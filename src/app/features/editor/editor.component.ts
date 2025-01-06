import * as RxJS from "rxjs";
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormGroup,
} from "@angular/forms";
import { NgForOf, NgIf, NgSwitch } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { takeUntil } from "rxjs/operators";
import { Errors } from "../../core/models/errors.model";
import { ArticlesService } from "../../core/services/articles.service";
import { UserService } from "../../core/services/user.service";
import { ListErrorsComponent } from "../../shared/list-errors.component";

interface ArticleForm {
  title: FormControl<string>;
  description: FormControl<string>;
  body: FormControl<string>;
}

@Component({
  selector: "app-editor-page",
  templateUrl: "./editor.component.html",
  imports: [ListErrorsComponent, ReactiveFormsModule, NgForOf, FormsModule],
  standalone: true,
})
export class EditorComponent implements OnInit, OnDestroy {
  tagList: string[] = [];
  articleForm: FormGroup<ArticleForm> = new FormGroup<ArticleForm>({
    title: new FormControl("", { nonNullable: true }),
    description: new FormControl("", { nonNullable: true }),
    body: new FormControl("", { nonNullable: true }),
  });
  tagField = new FormControl<string>("", { nonNullable: true });

  errors: Errors | null = null;
  isSubmitting = false;
  destroy$ = new RxJS.Subject<void>();

  constructor(
    private readonly articleService: ArticlesService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService
  ) {}

  ngOnInit() {
    if (this.route.snapshot.params["slug"]) {
      RxJS.combineLatest([
        this.articleService.get(this.route.snapshot.params["slug"]),
        this.userService.getCurrentUser(),
      ])
        .pipe(RxJS.takeUntil(this.destroy$))
        .subscribe(([article, { user }]) => {
          if (user.username === article.author.username) {
            this.tagList = article.tagList;
            this.articleForm.patchValue(article);
          } else {
            void this.router.navigate(["/"]);
          }
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addTag() {
    const tag = this.tagField.value;
    if (tag != null && tag.trim() !== "" && this.tagList.indexOf(tag) < 0) {
      this.tagList.push(tag);
    }
    this.tagField.reset("");
  }

  removeTag(tagName: string): void {
    this.tagList = this.tagList.filter((tag) => tag !== tagName);
  }

  submitForm(): void {
    this.isSubmitting = true;

    this.addTag();

    this.articleService
      .create({
        ...this.articleForm.value,
        tagList: this.tagList,
      })
      .pipe(RxJS.takeUntil(this.destroy$))
      .subscribe({
        next: (article) => this.router.navigate(["/article/", article.slug]),
        error: (err) => {
          this.errors = err;
          this.isSubmitting = false;
        },
      });
  }
}
