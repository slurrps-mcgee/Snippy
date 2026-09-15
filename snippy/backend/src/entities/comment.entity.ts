import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Snippets } from './snippet.entity';
import { Users } from './user.entity';

@Table({
  tableName: 'comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_comments_auth0',
      fields: ['auth0_id'],
    },
    {
      name: 'idx_comments_snippet',
      fields: ['snippet_id'],
    },
    {
      name: 'idx_comments_snippet_created',
      fields: ['snippet_id', 'created_at'],
    },
  ],
})
export class Comments extends Model<Comments> {
  @PrimaryKey
  @Column({
    field: 'comment_id',
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  commentId!: string;

  @ForeignKey(() => Users)
  @Column({
    field: 'auth0_id',
    type: DataType.STRING,
    allowNull: false,
  })
  auth0Id!: string;

  @ForeignKey(() => Snippets)
  @Column({
    field: 'snippet_id',
    type: DataType.UUID,
    allowNull: false,
  })
  snippetId!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  content!: string;

  @ForeignKey(() => Comments)
  @Column({
    field: 'parent_comment_id',
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
  })
  parentCommentId?: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    defaultValue: null,
  })
  mentions?: string[] | null;

  @Column({
    field: 'is_deleted',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isDeleted!: boolean;

  // Relations
  @BelongsTo(() => Users, {
    foreignKey: 'auth0Id',
    targetKey: 'auth0Id',
    onDelete: 'CASCADE',
    constraints: true,
  })
  user!: Users;

  @BelongsTo(() => Snippets, {
    foreignKey: 'snippetId',
    targetKey: 'snippetId',
    onDelete: 'CASCADE',
    constraints: true,
  })
  snippet!: Snippets;

  @BelongsTo(() => Comments, {
    foreignKey: 'parentCommentId',
    targetKey: 'commentId',
    constraints: false,
  })
  parent?: Comments;

  @HasMany(() => Comments, {
    foreignKey: 'parentCommentId',
    sourceKey: 'commentId',
    constraints: false,
  })
  replies!: Comments[];
}
