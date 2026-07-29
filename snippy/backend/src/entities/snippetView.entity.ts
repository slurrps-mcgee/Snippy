import {
    Table,
    Column,
    Model,
    PrimaryKey,
    DataType,
    ForeignKey,
    BelongsTo,
} from 'sequelize-typescript';
import { Snippets } from './snippet.entity';
import { Users } from './user.entity';

@Table({
    tableName: 'snippet_views',
    timestamps: false,
    indexes: [
        {
            name: 'idx_snippet_views_snippet_user',
            unique: true,
            fields: ['snippet_id', 'auth0_id'],
        },
        {
            name: 'idx_snippet_views_auth0',
            fields: ['auth0_id'],
        },
    ],
})
export class SnippetViews extends Model<SnippetViews> {
    @PrimaryKey
    @Column({
        field: 'snippet_view_id',
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    snippetViewId!: string;

    @ForeignKey(() => Snippets)
    @Column({
        field: 'snippet_id',
        type: DataType.UUID,
        allowNull: false,
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
        field: 'last_viewed_at',
        type: DataType.DATE,
        allowNull: false,
    })
    lastViewedAt!: Date;

    @BelongsTo(() => Snippets, {
        foreignKey: 'snippetId',
        targetKey: 'snippetId',
        onDelete: 'CASCADE',
        constraints: true,
    })
    snippet!: Snippets;

    @BelongsTo(() => Users, {
        foreignKey: 'auth0Id',
        targetKey: 'auth0Id',
        onDelete: 'CASCADE',
        constraints: true,
    })
    user!: Users;
}
