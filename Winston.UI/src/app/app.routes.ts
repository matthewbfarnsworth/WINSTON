import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { ApiService } from './services/api';

export const routes: Routes = [
    { path: '', redirectTo: () => inject(ApiService).currentUserId ? 'home' : 'login', pathMatch: 'full' },
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then(module => module.Login)
    },
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
];