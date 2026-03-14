import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Asset, DashboardOverview, Project, Worker } from '../models/backoffice.models';

@Injectable({
  providedIn: 'root'
})
export class BackofficeApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  getDashboard(): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>(`${this.baseUrl}/dashboard`);
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/projects`);
  }

  createProject(payload: Omit<Project, 'id'>): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects`, payload);
  }

  updateProject(id: string, payload: Omit<Project, 'id'>): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/projects/${id}`, payload);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${id}`);
  }

  getWorkers(): Observable<Worker[]> {
    return this.http.get<Worker[]>(`${this.baseUrl}/workers`);
  }

  createWorker(payload: Omit<Worker, 'id' | 'projectName'>): Observable<Worker> {
    return this.http.post<Worker>(`${this.baseUrl}/workers`, payload);
  }

  updateWorker(id: string, payload: Omit<Worker, 'id' | 'projectName'>): Observable<Worker> {
    return this.http.put<Worker>(`${this.baseUrl}/workers/${id}`, payload);
  }

  deleteWorker(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/workers/${id}`);
  }

  getAssets(): Observable<Asset[]> {
    return this.http.get<Asset[]>(`${this.baseUrl}/assets`);
  }

  uploadAsset(formData: FormData): Observable<Asset> {
    return this.http.post<Asset>(`${this.baseUrl}/assets/upload`, formData);
  }

  deleteAsset(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/assets/${id}`);
  }
}
