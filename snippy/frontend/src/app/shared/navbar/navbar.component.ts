import { Component } from '@angular/core';
import { LoginComponent } from "../login/login.component";

@Component({
  selector: 'app-navbar',
  imports: [LoginComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

}
