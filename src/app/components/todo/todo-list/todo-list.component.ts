import { Component, OnInit, OnDestroy } from '@angular/core';
import { TaskService } from '../../../services/task.service';
import { Task } from '../../../models/task.model';
import { MatDialog } from '@angular/material/dialog';
import { TodoFormComponent } from '../todo-form/todo-form.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, tap } from 'rxjs';
import { MaterialModule } from '../../../material.module';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.scss'],
   standalone: true,
   imports:[
    MaterialModule,
    FormsModule,
    CommonModule
   ]
})
export class TodoListComponent implements OnInit, OnDestroy {
  tasksList: Task[] = [];
  tasks$!: Observable<Task[]>;
  private tasksSubscription!: Subscription;
  filteredTasks: Task[] = [];
  loading = false;
  error = '';
  filterValue = '';
  showCompleted = true;
  priorityFilter: 'all' | 'low' | 'medium' | 'high' = 'all';

  constructor(
    private taskService: TaskService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loading = true;

    this.tasks$ = this.taskService.getTasks();

    this.tasksSubscription = this.tasks$.subscribe({
      next: (tasks) => {
        this.tasksList = tasks;
        this.applyFilters();

        // Only set loading to false if we have tasks OR initial loading is complete
        if (tasks.length > 0 || this.taskService.hasInitiallyLoaded()) {
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = err.message || 'Error loading tasks';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription to prevent memory leaks
    if (this.tasksSubscription) {
      this.tasksSubscription.unsubscribe();
    }
  }

  openTaskForm(task?: Task): void {
    if (task) {
      this.startEditing(task);
    }

    const dialogRef = this.dialog.open(TodoFormComponent, {
      width: '500px',
      data: task || {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // No need to reload tasks since socket.io will update them
      }
    });
  }

  toggleTaskCompletion(task: Task): void {
    this.taskService.toggleTaskCompletion(task).subscribe({
      error: (error) => {
        this.snackBar.open('Error updating task: ' + error, 'Close', {
          duration: 5000
        });
      }
    });
    // No need to manually update tasks as socket.io will handle it
  }

  applyFilters(): void {
    this.filteredTasks = this.tasksList.filter(task => {
      const titleMatch = task.title.toLowerCase().includes(this.filterValue.toLowerCase());
      const completionMatch = this.showCompleted ? true : !task.completed;
      const priorityMatch = this.priorityFilter === 'all' || task.priority === this.priorityFilter;
      return titleMatch && completionMatch && priorityMatch;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'accent';
      case 'medium': return 'primary';
      case 'low': return '';
      default: return '';
    }
  }

  formatDueDate(date: Date | undefined): string {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString();
  }

  toggleComplete(task: Task) {
    if (task._id) {
      this.taskService.updateTask(task._id, { completed: !task.completed }).subscribe();
    }
  }

  deleteTask(task: Task): void {
    if (!task.lockedBy && task._id) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: 'Delete Task',
          message: `Are you sure you want to delete the task:<br><strong>${task.title}</strong>?`
        }
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.taskService.deleteTask(task._id!).subscribe({
            next: () => {
              this.snackBar.open('Task deleted successfully', 'Close', { duration: 3000 });
            },
            error: (err) => {
              this.snackBar.open('Error deleting task: ' + err.message, 'Close', { duration: 5000 });
            }
          });
        }
      });
    }
  }
  
  startEditing(task: Task) {
    if (!task.lockedBy && task._id) {
      this.taskService.lockTask(task._id);
    }
  }

  stopEditing(task: Task) {
    if (task._id) {
      this.taskService.unlockTask(task._id);
    }
  }
  
  isOverdue(dueDate: string | Date): boolean {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    
    return taskDate < today;
  }  
}