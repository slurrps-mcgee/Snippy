import { Routes } from '@angular/router';
import { HomeComponent } from './core/pages/home/home.component';
import { UserHomeComponent } from './core/pages/user-home/user-home.component';
import { AuthGuard } from '@auth0/auth0-angular';
import { TestComponent } from './core/pages/test/test.component';

export const routes: Routes = [
    // {path: '', redirectTo: '/home', pathMatch: 'full' },
    {path: 'home', component: HomeComponent},
    {path: 'userhome', component: UserHomeComponent, canActivate: [AuthGuard] }, // Protected route
    {path: 'test', component: TestComponent, canActivate: [AuthGuard] },
    { path: '**', redirectTo: 'home' } // catch-all -> home
];
