import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, filter, take, tap, retry, switchMap, delay } from 'rxjs/operators';
import { Task } from '../models/task.model';
import { AuthService } from './auth.service';
import { io } from 'socket.io-client';

declare const BASE_API_URL: string; 
const socket = io(BASE_API_URL);

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasks$ = new BehaviorSubject<Task[]>([]);
  private apiUrl = `${BASE_API_URL}/tasks`;
  private initialLoadComplete = false;
  private tokenRetryCount = 0;
  private maxTokenRetries = 3;

  constructor(private http: HttpClient, private authService: AuthService) {
    console.log('TaskService initialized');
    
    // Wait for authentication and check token before fetching tasks
    this.waitForValidToken().subscribe(hasToken => {
      if (hasToken) {
        console.log('Valid token available - fetching tasks');
        this.fetchTasks();
      } else {
        console.error('Could not get valid token after multiple attempts');
        this.initialLoadComplete = true; // Mark as loaded to avoid blocking UI
      }
    });

    socket.on('taskCreated', (task: Task) => {
      this.tasks$.next([...this.tasks$.getValue(), task]);
    });

    socket.on('taskUpdated', (task: Task) => {
      const updated = this.tasks$.getValue().map(t => t._id === task._id ? task : t);
      this.tasks$.next(updated);
    });

    socket.on('taskDeleted', (task: Task) => {
      const filtered = this.tasks$.getValue().filter(t => t._id !== task._id);
      this.tasks$.next(filtered);
    });

    socket.on('taskLocked', ({ taskId, lockedBy }) => {
      const updated = this.tasks$.getValue().map(t => t._id === taskId ? { ...t, lockedBy } : t);
      this.tasks$.next(updated);
    });

    socket.on('taskUnlocked', ({ taskId }) => {
      const updated = this.tasks$.getValue().map(t => t._id === taskId ? { ...t, lockedBy: null } : t);
      this.tasks$.next(updated);
    });
  }

  // Wait for a valid token with retries
  private waitForValidToken(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      tap(user => {
        console.log('Auth state:', user ? 'User available' : 'No user yet');
      }),
      filter(user => !!user),
      take(1),
      switchMap(() => {
        const token = this.authService.getToken();
        console.log('Token status:', token ? 'Token available' : 'No token');
        
        if (token) {
          return of(true);
        } else if (this.tokenRetryCount < this.maxTokenRetries) {
          this.tokenRetryCount++;
          console.log(`No token available. Retry attempt ${this.tokenRetryCount}/${this.maxTokenRetries}`);
          // Retry after a delay
          return of(null).pipe(
            delay(1000),
            switchMap(() => this.waitForValidToken())
          );
        } else {
          return of(false);
        }
      })
    );
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    
    if (!token) {
      console.warn('getHeaders called but no token is available');
    }
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  fetchTasks() {
    const token = this.authService.getToken();
    if (!token) {
      console.error('Attempting to fetch tasks but no token is available');
      this.initialLoadComplete = true;
      return;
    }
    
    console.log('Fetching tasks from:', this.apiUrl);
    
    this.http.get<Task[]>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(
        retry(1),
        catchError(err => {
          console.error('Error fetching tasks:', err);
          this.initialLoadComplete = true;
          return of([]);
        })
      )
      .subscribe(tasks => {
        this.tasks$.next(tasks);
        this.initialLoadComplete = true;
        console.log('Successfully fetched tasks:', tasks.length);
      });
  }
  
  // Check if initial load has completed
  hasInitiallyLoaded(): boolean {
    return this.initialLoadComplete;
  }
  
  // Get the tasks from the BehaviorSubject
  getTasks(): Observable<Task[]> {
    return this.tasks$.asObservable();
  }

  createTask(task: Task): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateTask(id: string, data: Partial<Task>) {
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
  
  deleteTask(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Toggle task completion (for checkbox functionality)
  toggleTaskCompletion(task: Task): Observable<Task> {
    const updatedTask = { ...task, completed: !task.completed };
    return this.updateTask(task._id!, updatedTask);
  }

  lockTask(taskId: string) {
    socket.emit('lockTask', taskId);
  }

  unlockTask(taskId: string) {
    socket.emit('unlockTask', taskId);
  }

  private handleError(error: any) {
    console.error('Task service error:', error);
    let errorMessage = 'An unknown error occurred';
    if (error.error?.message) {
      errorMessage = error.error.message;
    }
    return throwError(() => new Error(errorMessage));
  }
}