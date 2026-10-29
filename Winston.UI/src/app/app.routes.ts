import { Routes } from "@angular/router";
import { authGuard } from "./guards/auth-guard";

export const routes: Routes = [
    {
        path: 'access-denied',
        loadComponent: () => import('./pages/access-denied/access-denied').then(module => module.AccessDenied)
    },
    {
        path: '',
        loadComponent: () => import('./layouts/main-layout/main-layout').then(module => module.MainLayout),
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            {
                path: 'home',
                loadComponent: () => import('./pages/home/home').then(module => module.Home)
            },
            {
                path: 'trips',
                loadComponent: () => import('./pages/trips/trips').then(module => module.Trips)
            },
            {
                path: 'trips/new',
                loadComponent: () => import('./pages/edit-trip/edit-trip').then(module => module.EditTrip)
            },
            {
                path: 'trips/edit/:id',
                loadComponent: () => import('./pages/edit-trip/edit-trip').then(module => module.EditTrip)
            },
            {
                path: 'transactions',
                loadComponent: () => import('./pages/transactions/transactions').then(module => module.Transactions)
            },
            {
                path: 'transactions/new',
                loadComponent: () => import('./pages/edit-transaction/edit-transaction').then(module => module.EditTransaction)
            },
            {
                path: 'transactions/edit/:id',
                loadComponent: () => import('./pages/edit-transaction/edit-transaction').then(module => module.EditTransaction)
            },
            {
                path: 'settings',
                loadComponent: () => import('./pages/settings/settings').then(module => module.Settings)
            }
        ]
    }
]
