import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BackofficeApiService } from '../../core/services/backoffice-api.service';
import { Project } from '../../core/models/backoffice.models';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './projects.page.html',
  styleUrl: './projects.page.scss'
})
export class ProjectsPageComponent {
  private readonly api = inject(BackofficeApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly projects = signal<Project[]>([]);
  protected readonly selectedProjectId = signal<string | null>(null);
  protected readonly showModal = signal(false);

  protected readonly projectForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    location: ['', Validators.required],
    status: ['Planning' as Project['status'], Validators.required],
    clientName: ['', Validators.required],
    clientEmail: ['', [Validators.required, Validators.email]],
    clientPhone: ['', Validators.required],
    startDate: ['', Validators.required],
    expectedCompletionDate: ['', Validators.required],
    materials: [''],
    budget: [0, Validators.min(0)],
    notes: ['']
  });

  constructor() {
    this.loadProjects();
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

  protected editProject(project: Project): void {
    this.selectedProjectId.set(project.id);
    this.projectForm.patchValue(project);
    this.showModal.set(true);
  }

  protected closeModal(): void {
    this.showModal.set(false);
    this.resetForm();
  }

  protected resetForm(): void {
    this.selectedProjectId.set(null);
    this.projectForm.reset({
      name: '',
      location: '',
      status: 'Planning',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      startDate: '',
      expectedCompletionDate: '',
      materials: '',
      budget: 0,
      notes: ''
    });
  }

  protected saveProject(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.projectForm.getRawValue(),
      budget: Number(this.projectForm.getRawValue().budget || 0)
    };

    const request = this.selectedProjectId()
      ? this.api.updateProject(this.selectedProjectId()!, payload)
      : this.api.createProject(payload);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadProjects();
      this.closeModal();
    });
  }

  protected removeProject(id: string): void {
    this.api
      .deleteProject(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadProjects();
        if (this.selectedProjectId() === id) {
          this.closeModal();
        }
      });
  }

  protected totalBudget(): number {
    return this.projects().reduce((total, project) => total + Number(project.budget || 0), 0);
  }

  protected ongoingCount(): number {
    return this.projects().filter((project) => project.status === 'Ongoing').length;
  }

  protected completedCount(): number {
    return this.projects().filter((project) => project.status === 'Completed').length;
  }
}
