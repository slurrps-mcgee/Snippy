import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  HasMany,
  ForeignKey,
  BelongsTo,
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
  @AutoIncrement
  @Column(DataType.INTEGER)
  snippetId!: number;

  @ForeignKey(() => Users)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  auth0Id!: string;

  @BelongsTo(() => Users, {
    foreignKey: 'auth0Id',
    targetKey: 'auth0Id',
    constraints: false,
  })
  user!: Users;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: "snippet_name_unique"
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description!: string;

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
