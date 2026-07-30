import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CommentListResponse, CommentResponse } from '@app/interfaces/comment.interface';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private api = inject(ApiService);

  getComments(snippetId: string, page = 1, limit = 50): Observable<CommentListResponse> {
    return this.api.request({
      path: `/comments/${snippetId}`,
      method: 'GET',
      params: { page, limit },
    });
  }

  createComment(snippetId: string, content: string): Observable<CommentResponse> {
    return this.api.request({
      path: `/comments/${snippetId}`,
      method: 'POST',
      body: { content },
    });
  }

  updateComment(commentId: string, content: string): Observable<CommentResponse> {
    return this.api.request({
      path: `/comments/${commentId}`,
      method: 'PUT',
      body: { content },
    });
  }

  deleteComment(commentId: string): Observable<{ success: boolean; message?: string }> {
    return this.api.request({
      path: `/comments/${commentId}`,
      method: 'DELETE',
    });
  }
}
