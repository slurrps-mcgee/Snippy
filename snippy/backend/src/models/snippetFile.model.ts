import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Snippets } from "./snippet.model";

@Table({
  tableName: "snippet_files",
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ["snippet_id", "file_type"],
      name: "unique_snippet_file_type_per_snippet",
    },
  ],
})
export class SnippetFiles extends Model<SnippetFiles> {
  @PrimaryKey
  @Column({ 
    field: 'snippet_file_id',
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  snippetFileID!: string;

  @ForeignKey(() => Snippets)
  @Column({
    field: 'snippet_id',
    type: DataType.UUID,
    allowNull: false,
  })
  snippetId!: string;

  @Column({
    field: "file_type",
    type: DataType.ENUM("html", "css", "js"),
    allowNull: false,
  })
  fileType!: "html" | "css" | "js";

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  content?: string | null;

  // Relations
  @BelongsTo(() => Snippets, {
    foreignKey: 'snippetId',
    targetKey: 'snippetId',
    onDelete: 'CASCADE',
    constraints: true,
  })
  snippet!: Snippets;
}
