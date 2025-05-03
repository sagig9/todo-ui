import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
    imports: [
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      RouterModule,
      MaterialModule
    ]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string = '/';
  error = '';
  hide = true;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/tasks';
    
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;
  
    if (this.loginForm.invalid) {
      return;
    }
  
    this.loading = true;
  
    this.authService.login(this.f['email'].value, this.f['password'].value)
      .subscribe({
        error: error => {
          this.error = error;
          this.snackBar.open('Login failed: ' + error, 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
          this.loading = false;
        }
      });
  }

  
}
