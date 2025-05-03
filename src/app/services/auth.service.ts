import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User, AuthResponse } from '../models/user.model';
import { Router } from '@angular/router';

declare const BASE_API_URL: string; 

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${BASE_API_URL}/users`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      const user = JSON.parse(userJson);
      this.currentUserSubject.next(user);
    }
  }

  register(user: User): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, user).pipe(
      tap(response => this.setUserData(response)),
      catchError(this.handleError)
    );
  }

   login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        this.setUserData(response);
        this.router.navigate(['/tasks']);
      }),
      catchError(this.handleError)
    );
  }
  
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private setUserData(response: AuthResponse): void {
    const user: User = {
      id: response.user.id,
      email: response.user.email,
      token: response.token
    };
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', response.token);
    this.currentUserSubject.next(user);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private handleError(error: any) {
    console.error('Auth service error:', error);
    let errorMessage = 'An unknown error occurred';
    if (error.error?.message) {
      errorMessage = error.error.message;
    }
    return throwError(() => new Error(errorMessage));
  }
}
