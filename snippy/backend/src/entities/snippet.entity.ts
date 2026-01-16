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
import { SnippetFiles } from "./snippetFile.entity";
import { Users } from "./user.entity";
import { Favorites } from "./favorite.entity";
import { Comments } from "./comment.entity";
import { createUniqueShortName } from "../common/utilities/helper";

@Table({
  tableName: "snippets",
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_snippets_auth0',
      fields: ['auth0_id']
    },
    {
      name: 'idx_snippets_short_id',
      fields: ['short_id']
    },
    {
      name: 'idx_snippets_parent',
      fields: ['parent_snippet_short_id']
    },
    {
      name: 'idx_snippets_view_count',
      fields: ['view_count']
    },
    {
      name: 'idx_snippets_fork_count',
      fields: ['fork_count']
    },
    {
      name: 'idx_snippets_favorite_count',
      fields: ['favorite_count']
    },
    {
      name: 'idx_snippets_auth0_private',
      fields: ['auth0_id', 'is_private']
    },
    {
      name: 'idx_snippets_private_created',
      fields: ['is_private', 'created_at']
    },
    {
      name: 'idx_snippets_name_search',
      fields: ['name']
    },
    {
      name: 'idx_snippets_description_search',
      fields: ['description']
    }
  ]
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
    field: 'parent_snippet_short_id',
    type: DataType.STRING(16),
    allowNull: true,
    defaultValue: null,
  })
  parentShortId?: string | null;

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
    field: 'is_private',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isPrivate!: boolean;

  @Column({
    field: 'view_count',
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0
  })
  viewCount!: number;

  // Counts used for quick list sorting without joins
  @Column({
    field: 'fork_count',
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  forkCount!: number;

  @Column({
    field: 'favorite_count',
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  favoriteCount!: number;

  @Column({
    field: 'comment_count',
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  commentCount!: number;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    defaultValue: [],
  })
  externalResources!: string[];

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
    foreignKey: 'parent_snippet_short_id',
    targetKey: 'shortId',
    constraints: false,
  })
  parent?: Snippets;

  // List of forks that reference this snippet as parent
  @HasMany(() => Snippets, {
    foreignKey: 'parent_snippet_short_id',
    sourceKey: 'shortId',
    constraints: false,
  })
  forks!: Snippets[];

  @HasMany(() => SnippetFiles, {
    foreignKey: 'snippetId',
    sourceKey: 'snippetId',
    constraints: false,
  })
  snippetFiles!: SnippetFiles[];

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