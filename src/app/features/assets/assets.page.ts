import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BackofficeApiService } from '../../core/services/backoffice-api.service';
import { Asset, Project } from '../../core/models/backoffice.models';

@Component({
  selector: 'app-assets-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './assets.page.html',
  styleUrl: './assets.page.scss'
})
export class AssetsPageComponent {
  private readonly api = inject(BackofficeApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly assets = signal<Asset[]>([]);
  protected readonly projects = signal<Project[]>([]);
  protected readonly selectedFileName = signal('');
  protected readonly showModal = signal(false);

  protected readonly assetForm = this.fb.nonNullable.group({
    projectId: ['', Validators.required],
    category: ['3D Design', Validators.required],
    description: ['']
  });

  private selectedFile: File | null = null;

  constructor() {
    this.loadAssets();
    this.loadProjects();
  }

  protected loadAssets(): void {
    this.api
      .getAssets()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((assets) => this.assets.set(assets));
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

  protected closeModal(): void {
    this.showModal.set(false);
    this.resetForm();
  }

  protected resetForm(): void {
    this.assetForm.reset({ projectId: '', category: '3D Design', description: '' });
    this.selectedFile = null;
    this.selectedFileName.set('');
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;
    this.selectedFileName.set(file?.name ?? '');
  }

  protected saveAsset(): void {
    if (this.assetForm.invalid || !this.selectedFile) {
      this.assetForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('projectId', this.assetForm.getRawValue().projectId);
    formData.append('category', this.assetForm.getRawValue().category);
    formData.append('description', this.assetForm.getRawValue().description || '');
    formData.append('file', this.selectedFile);

    this.api
      .uploadAsset(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadAssets();
        this.closeModal();
      });
  }

  protected removeAsset(id: string): void {
    this.api
      .deleteAsset(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadAssets());
  }

  protected assetUrl(asset: Asset): string {
    return asset.url.startsWith('http') ? asset.url : asset.url;
  }

  protected imageCount(): number {
    return this.assets().filter((asset) => asset.fileType === 'Image').length;
  }

  protected documentCount(): number {
    return this.assets().filter((asset) => asset.fileType === 'Document').length;
  }
}
