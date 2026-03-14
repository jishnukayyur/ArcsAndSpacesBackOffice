import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPageComponent)
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/projects.page').then((m) => m.ProjectsPageComponent)
      },
      {
        path: 'workers',
        loadComponent: () =>
          import('./features/workers/workers.page').then((m) => m.WorkersPageComponent)
      },
      {
        path: 'assets',
        loadComponent: () =>
          import('./features/assets/assets.page').then((m) => m.AssetsPageComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
