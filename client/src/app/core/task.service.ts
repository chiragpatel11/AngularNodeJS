import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { Task, TaskInput } from './models';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tasks`;

  list() {
    return this.http.get<Task[]>(this.baseUrl);
  }

  create(input: TaskInput) {
    return this.http.post<Task>(this.baseUrl, input);
  }

  update(id: string, input: Partial<TaskInput> & { completed?: boolean }) {
    return this.http.patch<Task>(`${this.baseUrl}/${id}`, input);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
