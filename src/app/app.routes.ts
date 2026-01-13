import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { SupportComponent } from './pages/support/support';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: Dashboard,
    title: 'dashboard',
  },
  {
    path: 'support',
    component: SupportComponent,
    title: 'support',
  },
];
