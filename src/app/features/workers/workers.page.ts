import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BackofficeApiService } from '../../core/services/backoffice-api.service';
import { Project, Worker } from '../../core/models/backoffice.models';

@Component({
  selector: 'app-workers-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './workers.page.html',
  styleUrl: './workers.page.scss'
})
export class WorkersPageComponent {
  private readonly api = inject(BackofficeApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly workers = signal<Worker[]>([]);
  protected readonly projects = signal<Project[]>([]);
  protected readonly selectedWorkerId = signal<string | null>(null);
  protected readonly showModal = signal(false);

  protected readonly workerForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    role: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    assignedProjectId: [''],
    attendanceStatus: ['Present' as Worker['attendanceStatus'], Validators.required],
    lastLog: ['']
  });

  constructor() {
    this.loadWorkers();
    this.loadProjects();
  }

  protected loadWorkers(): void {
    this.api
      .getWorkers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((workers) => this.workers.set(workers));
  }

  protected loadProjects(): void {
    this.api
      .getProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projects) => this.projects.set(projects));
  }

  protected openCreateModal(): void {
    this.resetForm();
    this.showModal.set(true);
  }

  protected editWorker(worker: Worker): void {
    this.selectedWorkerId.set(worker.id);
    this.workerForm.patchValue({
      name: worker.name,
      role: worker.role,
      phone: worker.phone,
      email: worker.email,
      assignedProjectId: worker.assignedProjectId,
      attendanceStatus: worker.attendanceStatus,
      lastLog: worker.lastLog
    });
    this.showModal.set(true);
  }

  protected closeModal(): void {
    this.showModal.set(false);
    this.resetForm();
  }

  protected resetForm(): void {
    this.selectedWorkerId.set(null);
    this.workerForm.reset({
      name: '',
      role: '',
      phone: '',
      email: '',
      assignedProjectId: '',
      attendanceStatus: 'Present',
      lastLog: ''
    });
  }

  protected saveWorker(): void {
    if (this.workerForm.invalid) {
      this.workerForm.markAllAsTouched();
      return;
    }

    const payload = this.workerForm.getRawValue();
    const request = this.selectedWorkerId()
      ? this.api.updateWorker(this.selectedWorkerId()!, payload)
      : this.api.createWorker(payload);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadWorkers();
      this.closeModal();
    });
  }

  protected removeWorker(id: string): void {
    this.api
      .deleteWorker(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadWorkers();
        if (this.selectedWorkerId() === id) {
          this.closeModal();
        }
      });
  }

  protected assignedCount(): number {
    return this.workers().filter((worker) => !!worker.assignedProjectId).length;
  }

  protected presentCount(): number {
    return this.workers().filter((worker) => worker.attendanceStatus === 'Present').length;
  }

  protected remoteCount(): number {
    return this.workers().filter((worker) => worker.attendanceStatus === 'Remote').length;
  }
}
