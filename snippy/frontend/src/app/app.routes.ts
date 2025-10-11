import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { HomePageComponent } from './core/pages/home-page/home-page.component';
import { UserHomePageComponent } from './core/pages/user-home-page/user-home-page.component';

export const routes: Routes = [
// {path: '', redirectTo: '/home', pathMatch: 'full' },
{path: '', component: HomePageComponent},
{path: 'home', component: UserHomePageComponent, canActivate: [AuthGuard] }, // Protected route
{ path: '**', redirectTo: '' } // catch-all -> home
];