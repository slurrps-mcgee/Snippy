import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  Default,
} from "sequelize-typescript";
import { Snippets } from "./snippet.model";
import { UUID, UUIDV4 } from "sequelize";

@Table({
  tableName: "snippet_files",
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Snippet_Files extends Model<Snippet_Files> {
  @PrimaryKey
  @Default(UUIDV4)
  @Column({ type: UUID })
  snippet_fileId!: string;

  @ForeignKey(() => Snippets)
  @Column(UUID)
  snippetId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  file_type!: string; // html, css, js

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
