import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Api } from '@app/api/generated/api';
import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from '@app/api/generated/functions';
import { SnackbarService } from '@app/services/ui/snackbar.service';
import { SnippetStoreService } from '@app/services/stores/snippet.store.service';
import { DialogService } from '@app/services/ui/dialog.service';
import { Comment } from '@app/api/generated/models/comment';

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
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
],
  templateUrl: './comment-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './comment-dialog.component.scss',
})
export class CommentDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<CommentDialogComponent>);
  data = inject<CommentDialogData>(MAT_DIALOG_DATA);

  private api = inject(Api);
  private snippetStoreService = inject(SnippetStoreService);
  private snackbarService = inject(SnackbarService);
  private dialogService = inject(DialogService);

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
      const res = await this.api.invoke(getComments, { snippetId: this.data.snippetId });
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
      const res = await this.api.invoke(createComment, {
        snippetId: this.data.snippetId,
        body: { content },
      });
      if (res.comment) {
        this.comments.update(list => [res.comment!, ...list]);
      }
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
    return !!comment.isOwner;
  }

  canDelete(comment: Comment): boolean {
    return !!comment.isOwner || this.data.isSnippetOwner;
  }

  startEdit(comment: Comment) {
    if (!comment.commentId) return;
    this.editingCommentId.set(comment.commentId);
    this.editContent = comment.content ?? '';
  }

  cancelEdit() {
    this.editingCommentId.set(null);
    this.editContent = '';
  }

  async saveEdit(comment: Comment) {
    const content = this.editContent.trim();
    if (!content) return;

    try {
      if (!comment.commentId) return;
      const res = await this.api.invoke(updateComment, {
        commentId: comment.commentId,
        body: { content },
      });
      if (res.comment) {
        this.comments.update(list =>
          list.map(c => (c.commentId === comment.commentId ? res.comment! : c))
        );
      }
      this.cancelEdit();
    } catch {
      this.snackbarService.error('Failed to update comment');
    }
  }

  deleteComment(comment: Comment) {
    return this.dialogService.confirmAndRun({
      confirm: {
        title: 'Delete Comment',
        message: 'Are you sure you want to delete this comment? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
      action: async () => {
        await this.api.invoke(deleteComment, { commentId: comment.commentId! });
        this.comments.update(list => list.filter(c => c.commentId !== comment.commentId));
        this.totalCount.update(n => Math.max(0, n - 1));
        this.snippetStoreService.bumpCommentCount(this.data.snippetId, -1);
      },
      success: 'Comment deleted',
      error: 'Failed to delete comment',
    });
  }

  close() {
    this.dialogRef.close();
  }
}
