import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { HomePageComponent } from './core/pages/home-page/home-page.component';
import { UserHomePageComponent } from './core/pages/user-home-page/user-home-page.component';
import { ProfilePageComponent } from './core/pages/profile-page/profile-page.component';
import { SnippetCodeEditorComponentComponent } from './shared/components/snippet-code-editor-component/snippet-code-editor-component.component';

export const routes: Routes = [
// {path: '', redirectTo: '/home', pathMatch: 'full' },
{ path: '', component: HomePageComponent},
{ path: 'home', component: UserHomePageComponent, canActivate: [AuthGuard] }, // Protected route
{ path: 'snippet', component: SnippetCodeEditorComponentComponent, canActivate: [AuthGuard] },

{ path: ':username', component: ProfilePageComponent, canActivate: [AuthGuard] },
{ path: ':username/snippet/:id', component: SnippetCodeEditorComponentComponent, canActivate: [AuthGuard] },

{ path: '**', redirectTo: '' }, // catch-all -> home
];