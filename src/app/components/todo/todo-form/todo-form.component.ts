import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Task } from '../../../models/task.model';
import { TaskService } from '../../../services/task.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NativeDateAdapter, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-todo-form',
  templateUrl: './todo-form.component.html',
  styleUrls: ['./todo-form.component.scss'],
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: new Date(), 
        },
        display: {
          dateInput: 'DD/MM/YYYY',
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ]
})
export class TodoFormComponent implements OnInit {
  taskForm!: FormGroup;
  loading = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<TodoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Task
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?._id;

    this.taskForm = this.fb.group({
      title: [this.data?.title || '', [Validators.required]],
      priority: [this.data?.priority || 'medium', [Validators.required]],
      dueDate: [this.data?.dueDate || null],
      completed: [this.data?.completed || false]
    });
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      return;
    }

    this.loading = true;
    const task: Task = {
      ...this.data,
      ...this.taskForm.value
    };

    const action = this.isEditMode
      ? this.taskService.updateTask(this.data._id!, task)
      : this.taskService.createTask(task);

    action.subscribe({
      next: (result) => {
        if (this.isEditMode && this.data._id) {
          this.taskService.unlockTask(this.data._id);
        }
        this.snackBar.open(`Task ${this.isEditMode ? 'updated' : 'created'} successfully`, 'Close', {
          duration: 3000
        });
        this.dialogRef.close(result);
      },
      error: (error) => {
        this.snackBar.open(`Error ${this.isEditMode ? 'updating' : 'creating'} task: ${error}`, 'Close', {
          duration: 5000
        });
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.isEditMode && this.data?._id) {
      this.taskService.unlockTask(this.data._id);
    }
  }
}
