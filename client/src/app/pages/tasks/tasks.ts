import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/auth.service';
import { Task } from '../../core/models';
import { TaskService } from '../../core/task.service';

@Component({
  selector: 'app-tasks',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks {
  private readonly auth = inject(AuthService);
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);

  readonly columns = ['title', 'dueDate', 'completed', 'actions'];
  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly userEmail = this.auth.user;

  readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    notes: ['', [Validators.maxLength(5000)]],
    dueDate: [''],
  });

  constructor() {
    this.auth.loadMe().subscribe();
    this.load();
  }

  load(): void {
    this.loading.set(this.tasks().length === 0);
    this.loadError.set(null);
    this.taskService.list().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        const message = this.messageFrom(error, 'Could not load tasks.');
        if (this.tasks().length === 0) {
          this.loadError.set(message);
        } else {
          this.snackBar.open(message, 'Dismiss', { duration: 4000 });
        }
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body = {
      title: value.title.trim(),
      notes: value.notes.trim() ? value.notes.trim() : null,
      dueDate: value.dueDate || null,
    };
    const editingId = this.editingId();
    const request = editingId
      ? this.taskService.update(editingId, body)
      : this.taskService.create(body);

    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(editingId ? 'Task updated.' : 'Task added.', 'Dismiss', { duration: 3000 });
        this.cancelEdit();
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.snackBar.open(this.messageFrom(error, 'Could not save the task.'), 'Dismiss', {
          duration: 4000,
        });
      },
    });
  }

  startEdit(task: Task): void {
    this.editingId.set(task.id);
    this.form.setValue({
      title: task.title,
      notes: task.notes ?? '',
      dueDate: task.dueDate ?? '',
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ title: '', notes: '', dueDate: '' });
  }

  setCompleted(task: Task, event: MatCheckboxChange): void {
    if (event.checked === task.completed) {
      return;
    }
    this.taskService.update(task.id, { completed: event.checked }).subscribe({
      next: () => this.load(),
      error: (error: HttpErrorResponse) => {
        this.snackBar.open(this.messageFrom(error, 'Could not update the task.'), 'Dismiss', {
          duration: 4000,
        });
        this.load();
      },
    });
  }

  remove(task: Task): void {
    if (!window.confirm(`Delete "${task.title}"?`)) {
      return;
    }
    this.taskService.delete(task.id).subscribe({
      next: () => {
        if (this.editingId() === task.id) {
          this.cancelEdit();
        }
        this.snackBar.open('Task deleted.', 'Dismiss', { duration: 3000 });
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.snackBar.open(this.messageFrom(error, 'Could not delete the task.'), 'Dismiss', {
          duration: 4000,
        });
      },
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  dueLabel(value: string | null): string {
    if (!value) {
      return 'No due date';
    }
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString();
  }

  private messageFrom(error: HttpErrorResponse, fallback: string): string {
    const message = error.error?.message;
    return typeof message === 'string' ? message : fallback;
  }
}
