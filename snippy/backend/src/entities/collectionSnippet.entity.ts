import {
    Table,
    Column,
    Model,
    PrimaryKey,
    DataType,
    ForeignKey,
    BelongsTo,
} from 'sequelize-typescript';
import { Collections } from './collection.entity';
import { Snippets } from './snippet.entity';

@Table({
    tableName: 'collection_snippets',
    timestamps: false,
    indexes: [
        {
            name: 'idx_collection_snippets_pair',
            unique: true,
            fields: ['collection_id', 'snippet_id'],
        },
        { name: 'idx_collection_snippets_collection', fields: ['collection_id'] },
        { name: 'idx_collection_snippets_snippet', fields: ['snippet_id'] },
    ],
})
export class CollectionSnippets extends Model<CollectionSnippets> {
    @PrimaryKey
    @Column({
        field: 'collection_snippet_id',
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    collectionSnippetId!: string;

    @ForeignKey(() => Collections)
    @Column({
        field: 'collection_id',
        type: DataType.UUID,
        allowNull: false,
    })
    collectionId!: string;

    @ForeignKey(() => Snippets)
    @Column({
        field: 'snippet_id',
        type: DataType.UUID,
        allowNull: false,
    })
    snippetId!: string;

    @Column({
        field: 'position',
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    position!: number;

    @BelongsTo(() => Collections, {
        foreignKey: 'collectionId',
        targetKey: 'collectionId',
        onDelete: 'CASCADE',
        constraints: true,
    })
    collection!: Collections;

    @BelongsTo(() => Snippets, {
        foreignKey: 'snippetId',
        targetKey: 'snippetId',
        onDelete: 'CASCADE',
        constraints: true,
    })
    snippet!: Snippets;
}
