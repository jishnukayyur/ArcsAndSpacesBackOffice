import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BackofficeApiService } from '../../core/services/backoffice-api.service';
import { DashboardOverview } from '../../core/models/backoffice.models';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class DashboardPageComponent {
  private readonly api = inject(BackofficeApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly overview = signal<DashboardOverview | null>(null);
  protected readonly loading = signal(true);

  constructor() {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.api
      .getDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((overview) => {
        this.overview.set(overview);
        this.loading.set(false);
      });
  }
}
