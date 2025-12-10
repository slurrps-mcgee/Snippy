import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { HomePageComponent } from './core/pages/home-page/home-page.component';
import { UserHomePageComponent } from './core/pages/user-home-page/user-home-page.component';
import { ProfilePageComponent } from './core/pages/profile-page/profile-page.component';
import { SnippetEditorPageComponent } from './core/pages/snippet-editor-page/snippet-editor-page.component';
import { unsavedChangesGuard } from './shared/guards/unsaved-changes.guard';
import { PublicPageComponent } from './core/pages/public-page/public-page.component';

export const routes: Routes = [

{ path: '', component: HomePageComponent},
{ path: 'home', component: UserHomePageComponent, canActivate: [AuthGuard] }, // Protected route
{ path: 'public', component: PublicPageComponent, canActivate: [AuthGuard] },

{ path: ':username/snippet/:id', component: SnippetEditorPageComponent, canActivate: [AuthGuard], canDeactivate: [unsavedChangesGuard] },
{ path: 'snippet', component: SnippetEditorPageComponent, canActivate: [AuthGuard], canDeactivate: [unsavedChangesGuard] },

{ path: ':username', component: ProfilePageComponent, canActivate: [AuthGuard] },

{ path: '**', redirectTo: '' }, // catch-all -> home
];