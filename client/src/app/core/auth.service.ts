import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from './models';

const tokenKey = 'accessToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly token = signal<string | null>(localStorage.getItem(tokenKey));
  readonly user = signal<User | null>(null);

  register(email: string, password: string) {
    return this.http.post<User>(`${environment.apiUrl}/auth/register`, { email, password });
  }

  login(email: string, password: string) {
    return this.http
      .post<{ accessToken: string }>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((response) => {
          localStorage.setItem(tokenKey, response.accessToken);
          this.token.set(response.accessToken);
        }),
      );
  }

  loadMe() {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(tap((user) => this.user.set(user)));
  }

  logout(): void {
    localStorage.removeItem(tokenKey);
    this.token.set(null);
    this.user.set(null);
  }
}
