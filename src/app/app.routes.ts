import { Routes } from '@angular/router';
import { LoginComponent } from '../app/components/auth/login/login.component';
import { RegisterComponent } from '../app/components/auth/register/register.component';
import { TodoListComponent } from '../app/components/todo/todo-list/todo-list.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/tasks', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'tasks', component: TodoListComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/tasks' }
];
