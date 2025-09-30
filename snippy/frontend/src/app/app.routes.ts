import { Routes } from '@angular/router';
import { HomeComponent } from './core/pages/home/home.component';
import { AuthGuard } from './shared/services/auth.guard';

export const routes: Routes = [
// {path: '', redirectTo: '/home', pathMatch: 'full' },
{path: 'home', component: HomeComponent},
{ path: '**', redirectTo: 'home' } // catch-all -> home
];