import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  Default,
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
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  snippet_fileId!: string;

  @ForeignKey(() => Snippets)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  snippetId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  file_type!: string; // html, css, js

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  file_name?: string | null;

  @Default(0)
  @Column({ type: DataType.INTEGER })
  sort_order!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  content?: string | null;

  // Relations
  @BelongsTo(() => Snippets, {
    foreignKey: 'snippetId',
    targetKey: 'snippetId',
    constraints: false,
  })
  snippet!: Snippets;
}
