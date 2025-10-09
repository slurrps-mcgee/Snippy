import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  HasMany,
  ForeignKey,
  BelongsTo,
  Default,
} from "sequelize-typescript";
import { Snippet_Files } from "./snippet_file.model";
import { Users } from "./user.model";
import { Favorites } from "./favorite.model";
import { Comments } from "./comment.model";

@Table({
  tableName: "snippets",
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Snippets extends Model<Snippet_Files> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  snippetId!: string;

  @ForeignKey(() => Users)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description!: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  tags?: string | null;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  view_count!: number;


  //MAYBE ADD LATER
  // @Column({
  //   type: DataType.STRING,
  //   allowNull: false,
  // })
  // snippet_type!: string; // Web, Python, etc.


  // Relations
  @BelongsTo(() => Users, {
    foreignKey: 'userId',
    targetKey: 'userId',
    constraints: false,
  })
  user!: Users;

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
}
