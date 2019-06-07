import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { User } from 'src/app/shared/user.model';
import { AuthService } from 'src/app/shared/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  user: User;
  password: string;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    this.user = new User();
  }

  signup(form: NgForm) {
    this.authService.signup(form.value.name, form.value.email, form.value.password).subscribe(() => {
      this.authService.login(form.value.email, form.value.password).subscribe(() => {
        this.router.navigateByUrl("/");
      })
    })
  }

}
