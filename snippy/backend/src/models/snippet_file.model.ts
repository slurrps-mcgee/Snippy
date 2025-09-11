import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Snippets } from "./snippet.model";

@Table({
  tableName: "snippet_files",
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Snippet_Files extends Model<Snippet_Files> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  snippet_fileId!: number;

  @ForeignKey(() => Snippets)
  @Column(DataType.INTEGER)
  snippetId!: number;

  @BelongsTo(() => Snippets, {
    foreignKey: 'snippetId',
    targetKey: 'snippetId',
    constraints: false,
  })
  snippet!: Snippets;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  file_type!: string; // html, css, js

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  content!: string;
}
