import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  HasMany,
  ForeignKey,
  BelongsTo,
  BeforeCreate,
} from "sequelize-typescript";
import { Snippet_Files } from "./snippet_file.model";
import { Users } from "./user.model";
import { Favorites } from "./favorite.model";
import { Comments } from "./comment.model";
import { createUniqueShortName } from "../utils/helper";
import { allow } from "joi";

@Table({
  tableName: "snippets",
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Snippets extends Model<Snippets> {
  @PrimaryKey
  @Column({ 
    field: 'snippet_id',
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  snippetId!: string;

  @ForeignKey(() => Users)
  @Column({
    field: 'auth0_id',
    type: DataType.STRING,
    allowNull: false,
  })
  auth0Id!: string;

  @Column({
    type: DataType.STRING(16),
    allowNull: false,
    unique: true,
    field: 'short_id'
  })
  shortId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  // parent_snippet_id replaces the previous `forked_from` boolean/string combo.
  // Nullable self-referential FK to indicate this snippet was forked from another.
  @ForeignKey(() => Snippets)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    defaultValue: null,
    field: 'parent_snippet_id',
  })
  parentSnippetId?: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description?: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    defaultValue: null,
  })
  tags?: string[] | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_private',
  })
  isPrivate!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0
  })
  view_count!: number;

  // Counts used for quick list sorting without joins
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'fork_count',
  })
  forkCount!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'favorite_count',
  })
  favoriteCount!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'comment_count',
  })
  commentCount!: number;

  // Relations
  @BelongsTo(() => Users, {
    foreignKey: 'auth0Id',
    targetKey: 'auth0Id',
    onDelete: 'CASCADE',
    constraints: true,
  })
  user!: Users;

  // Self-referential relation: parent snippet (if this is a fork)
  @BelongsTo(() => Snippets, {
    foreignKey: 'parent_snippet_id',
    targetKey: 'snippetId',
    constraints: false,
  })
  parent?: Snippets;

  // List of forks that reference this snippet as parent
  @HasMany(() => Snippets, {
    foreignKey: 'parent_snippet_id',
    sourceKey: 'snippetId',
    constraints: false,
  })
  forks!: Snippets[];

  @HasMany(() => Snippet_Files, {
    foreignKey: 'snippetId',
    sourceKey: 'snippetId',
    constraints: false,
  })
  snippet_files!: Snippet_Files[];

  @HasMany(() => Favorites, {
    foreignKey: 'snippetId',
    sourceKey: 'snippetId',
    constraints: false,
  })
  favorites!: Favorites[];

  @HasMany(() => Comments, {
    foreignKey: 'snippetId',
    sourceKey: 'snippetId',
    constraints: false,
  })
  comments!: Comments[];

  @BeforeCreate
  static async setShortId(snippet: Snippets) {
    await createUniqueShortName(snippet);
  }
}