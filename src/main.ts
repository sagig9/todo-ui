import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'; // <-- import this
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptorService } from './app/services/auth-interceptor.service';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

import { MatDialogModule } from '@angular/material/dialog';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()), // ✅ use this instead of plain provideHttpClient()
    provideAnimations(),
    importProvidersFrom(MatDialogModule),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true
    }
  ]
});
