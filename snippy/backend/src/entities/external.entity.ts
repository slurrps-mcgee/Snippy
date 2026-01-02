
import {
    Table,
    Column,
    Model,
    PrimaryKey,
    DataType,
    BelongsTo,
    ForeignKey,
} from "sequelize-typescript";
import { Snippets } from "./snippet.entity";

@Table({
    tableName: "external_resources",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
    {
      unique: true,
      fields: ["snippet_id", "url"],
      name: "unique_snippet_resource_type_per_snippet",
    },
  ],
})
export class ExternalResource extends Model<ExternalResource> {
    @PrimaryKey
    @Column({
        field: 'external_id',
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    externalId!: string;
    
    @ForeignKey(() => Snippets)
    @Column({
        field: 'snippet_id',
        type: DataType.UUID,
        allowNull: false,
    })
    snippetId!: string;

    @Column({
        field: 'resource_type',
        type: DataType.ENUM('css', 'js'),
        allowNull: false,
    })
    resourceType!: 'css' | 'js';

    @Column({
        field: 'url',
        type: DataType.STRING,
        allowNull: false,
    })
    url!: string;

    // Relations
    @BelongsTo(() => Snippets, {
        foreignKey: 'snippetId',
        targetKey: 'snippetId',
        onDelete: 'CASCADE',
        constraints: true,
    })
    snippet!: Snippets;
}
