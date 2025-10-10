import { Routes } from '@angular/router';
import { HomeComponent } from './core/pages/home/home.component';
import { UserHomeComponent } from './core/pages/user-home/user-home.component';
import { ResetPasswordComponent } from './core/pages/reset-password/reset-password.component';
import { AuthGuard } from './shared/services/auth/auth.guard';

export const routes: Routes = [
// {path: '', redirectTo: '/home', pathMatch: 'full' },
{path: 'home', component: HomeComponent},
{path: 'userhome', component: UserHomeComponent, canActivate: [AuthGuard] }, // Protected route
{path: 'reset-password', component: ResetPasswordComponent},
{ path: '**', redirectTo: 'home' } // catch-all -> home
];