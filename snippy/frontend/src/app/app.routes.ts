import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { HomePageComponent } from './core/pages/home-page/home-page.component';
import { UserHomePageComponent } from './core/pages/user-home-page/user-home-page.component';
import { ProfilePageComponent } from './core/pages/profile-page/profile-page.component';
import { SnippetEditorPageComponent } from './core/pages/snippet-editor-page/snippet-editor-page.component';
import { unsavedChangesGuard } from './shared/guards/unsaved-changes.guard';
import { PublicPageComponent } from './core/pages/public-page/public-page.component';

export const routes: Routes = [

{ path: '', component: HomePageComponent}, //Home page, shows welcome message and login button if not authenticated, otherwise redirects to user home page
{ path: 'home', component: UserHomePageComponent, canActivate: [AuthGuard] }, //User home page, shows user snippets and profile info
{ path: 'public', component: PublicPageComponent, canActivate: [AuthGuard] }, //Public page, shows all public snippets and allows searching/filtering

//Snippet editor routes
{ path: ':username/snippet/:id', component: SnippetEditorPageComponent, canActivate: [AuthGuard], canDeactivate: [unsavedChangesGuard] },
{ path: 'snippet', component: SnippetEditorPageComponent, canActivate: [AuthGuard], canDeactivate: [unsavedChangesGuard] },

//Profile page route
{ path: ':username', component: ProfilePageComponent, canActivate: [AuthGuard] }, //Profile page, shows user profile info and their public snippets

{ path: '**', redirectTo: '' }, // catch-all -> home
];