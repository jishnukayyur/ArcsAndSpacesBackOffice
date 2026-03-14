import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storageKey = 'arcs-and-spaces-auth';
  private readonly username = 'admin';
  private readonly password = 'Admin@2026';

  login(username: string, password: string): boolean {
    const isValid = username === this.username && password === this.password;

    if (isValid) {
      localStorage.setItem(this.storageKey, 'true');
    }

    return isValid;
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
  }

  isAuthenticated(): boolean {
    return localStorage.getItem(this.storageKey) === 'true';
  }
}
