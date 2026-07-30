import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommentService } from '../../../services/api.services/comment.api.service';
import { SnackbarService } from '../../../services/component.services/snackbar.service';
import { SnippetStoreService } from '../../../services/store.services/snippet.store.service';
import { Comment } from '../../../interfaces/comment.interface';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

export interface CommentDialogData {
  snippetId: string;
  snippetName: string;
  snippetDescription?: string | null;
  ownerUserName?: string;
  isSnippetOwner: boolean;
}

@Component({
  selector: 'app-comment-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './comment-dialog.component.html',
  styleUrl: './comment-dialog.component.scss',
})
export class CommentDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<CommentDialogComponent>);
  data = inject<CommentDialogData>(MAT_DIALOG_DATA);

  private commentService = inject(CommentService);
  private snippetStoreService = inject(SnippetStoreService);
  private snackbarService = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  comments = signal<Comment[]>([]);
  totalCount = signal(0);
  loading = signal(false);
  posting = signal(false);

  newComment = '';
  editingCommentId = signal<string | null>(null);
  editContent = '';

  ngOnInit(): void {
    this.loadComments();
  }

  async loadComments() {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.commentService.getComments(this.data.snippetId));
      this.comments.set(res.comments ?? []);
      this.totalCount.set(res.totalCount ?? 0);
    } catch {
      this.snackbarService.error('Failed to load comments');
    } finally {
      this.loading.set(false);
    }
  }

  async postComment() {
    const content = this.newComment.trim();
    if (!content || this.posting()) return;

    this.posting.set(true);
    try {
      const res = await firstValueFrom(this.commentService.createComment(this.data.snippetId, content));
      this.comments.update(list => [res.comment, ...list]);
      this.totalCount.update(n => n + 1);
      this.snippetStoreService.bumpCommentCount(this.data.snippetId, 1);
      this.newComment = '';
    } catch {
      this.snackbarService.error('Failed to post comment');
    } finally {
      this.posting.set(false);
    }
  }

  canEdit(comment: Comment): boolean {
    return comment.isOwner;
  }

  canDelete(comment: Comment): boolean {
    return comment.isOwner || this.data.isSnippetOwner;
  }

  startEdit(comment: Comment) {
    this.editingCommentId.set(comment.commentId);
    this.editContent = comment.content;
  }

  cancelEdit() {
    this.editingCommentId.set(null);
    this.editContent = '';
  }

  async saveEdit(comment: Comment) {
    const content = this.editContent.trim();
    if (!content) return;

    try {
      const res = await firstValueFrom(this.commentService.updateComment(comment.commentId, content));
      this.comments.update(list =>
        list.map(c => (c.commentId === comment.commentId ? res.comment : c))
      );
      this.cancelEdit();
    } catch {
      this.snackbarService.error('Failed to update comment');
    }
  }

  deleteComment(comment: Comment) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Comment',
        message: 'Are you sure you want to delete this comment? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (result) => {
        if (!result) return;
        try {
          await firstValueFrom(this.commentService.deleteComment(comment.commentId));
          this.comments.update(list => list.filter(c => c.commentId !== comment.commentId));
          this.totalCount.update(n => Math.max(0, n - 1));
          this.snippetStoreService.bumpCommentCount(this.data.snippetId, -1);
          this.snackbarService.success('Comment deleted');
        } catch {
          this.snackbarService.error('Failed to delete comment');
        }
      });
  }

  close() {
    this.dialogRef.close();
  }
}
