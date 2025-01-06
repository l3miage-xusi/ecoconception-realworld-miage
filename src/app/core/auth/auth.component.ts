import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  Validators,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  FormsModule,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { NgIf, NgForOf } from "@angular/common";
import { ListErrorsComponent } from "../../shared/list-errors.component";
import { Errors } from "../models/errors.model";
import { UserService } from "../services/user.service";
import { HttpClientModule } from "@angular/common/http";
import * as RxJS from "rxjs";

interface AuthForm {
  email: FormControl<string>;
  password: FormControl<string>;
  username?: FormControl<string>;
}

@Component({
  selector: "app-auth-page",
  templateUrl: "./auth.component.html",
  imports: [
    RouterLink,
    NgIf,
    NgForOf,
    ListErrorsComponent,
    ReactiveFormsModule,
    FormsModule,
  ],
  standalone: true,
})
export class AuthComponent implements OnInit, OnDestroy {
  authType = "";
  title = "";
  errors: Errors = { errors: {} };
  isSubmitting = false;
  authForm: FormGroup<AuthForm>;
  destroy$ = new RxJS.Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService
  ) {
    this.authForm = new FormGroup<AuthForm>({
      email: new FormControl("", {
        validators: [Validators.required],
        nonNullable: true,
      }),
      password: new FormControl("", {
        validators: [Validators.required],
        nonNullable: true,
      }),
    });
  }

  ngOnInit(): void {
    this.authType = this.route.snapshot.url.at(-1)!.path;
    this.title = this.authType === "login" ? "Sign in" : "Sign up";
    if (this.authType === "register") {
      this.authForm.addControl(
        "username",
        new FormControl("", {
          validators: [Validators.required],
          nonNullable: true,
        })
      );
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submitForm(): void {
    this.isSubmitting = true;
    this.errors = { errors: {} };

    let observable =
      this.authType === "login"
        ? this.userService.login(
            this.authForm.value as { email: string; password: string }
          )
        : this.userService.register(
            this.authForm.value as {
              email: string;
              password: string;
              username: string;
            }
          );

    observable.pipe(RxJS.takeUntil(this.destroy$)).subscribe({
      next: () => void this.router.navigate(["/"]),
      error: (err) => {
        this.errors = err;
        this.isSubmitting = false;
      },
    });
  }
}
