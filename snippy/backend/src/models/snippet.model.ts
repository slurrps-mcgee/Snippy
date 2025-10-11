import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  HasMany,
  Default,
  ForeignKey,
  BelongsTo,
  BeforeCreate,
} from "sequelize-typescript";
import { Snippet_Files } from "./snippet_file.model";
import { Users } from "./user.model";
import { Favorites } from "./favorite.model";
import { Comments } from "./comment.model";
import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nano = customAlphabet(alphabet, 6); // 6 chars


@Table({
  tableName: "snippets",
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Snippets extends Model<Snippets> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  snippetId!: string;

  @ForeignKey(() => Users)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  auth0Id!: string;

  @Column({
    type: DataType.STRING(16),
    allowNull: false,
    unique: 'snippet_short_id_unique_constraint'
  })
  short_id!: string;

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
    field: 'parent_snippet_id',
  })
  parent_snippet_id?: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description?: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  tags?: string[] | null;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN
  })
  is_private!: boolean;

  @Default(0)
  @Column({
    type: DataType.INTEGER
  })
  view_count!: number;

  // Counts used for quick list sorting without joins
  @Default(0)
  @Column({
    type: DataType.INTEGER
  })
  fork_count!: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER
  })
  favorite_count!: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER
  })
  comment_count!: number;

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
    if (!snippet.short_id) {
      // try generating a unique shortId a few times
      for (let i = 0; i < 5; i++) {
        const candidate = nano();
        // try insert-safe uniqueness check: db lookup
        // Note: a findOne on shortId is fine here; the DB unique index prevents final race
        const exists = await Snippets.findOne({ where: { short_id: candidate } });
        if (!exists) {
          snippet.short_id = candidate;
          return;
        }
      }
      // fallback to a longer id if collisions happen repeatedly
      snippet.short_id = `${nano(10)}`;
    }
  }
}