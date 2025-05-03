import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { User } from '../../../models/user.model';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgIf,AsyncPipe  } from '@angular/common';
import { RouterModule,Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
   standalone: true,
    imports: [
      MatIconModule,
      MatToolbarModule,
      NgIf,
      AsyncPipe,
      RouterModule
    ]
})
export class HeaderComponent implements OnInit {
  currentUser$: Observable<User | null>;

  constructor(public router: Router, private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
  }

  logout(): void {
    this.authService.logout();
  }
}
