import {
    Table,
    Column,
    Model,
    PrimaryKey,
    DataType,
    ForeignKey,
    BelongsTo,
} from "sequelize-typescript";
import { Snippets } from "./snippet.entity";
import { Users } from "./user.entity";

@Table({
    tableName: "favorites",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            name: 'idx_favorites_auth0',
            fields: ['auth0_id']
        },
        {
            name: 'idx_favorites_snippet',
            fields: ['snippet_id']
        },
        {
            name: 'idx_favorites_user_snippet',
            unique: true,
            fields: ['auth0_id', 'snippet_id']
        }
    ]
})
export class Favorites extends Model<Favorites> {
    @PrimaryKey
    @Column({ 
        field: 'favorite_id',
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4
    })
    favoriteId!: string;

    @ForeignKey(() => Users)
    @Column({
        field: 'auth0_id',
        type: DataType.STRING,
        allowNull: false,
    })
    auth0Id!: string;

    @ForeignKey(() => Snippets)
    @Column({
        field: 'snippet_id',
        type: DataType.UUID,
        allowNull: false,
    })
    snippetId!: string;

    // Relations
    @BelongsTo(() => Users, {
        foreignKey: 'auth0Id',
        targetKey: 'auth0Id',
        onDelete: 'CASCADE',
        constraints: true,
    })
    user!: Users;

    @BelongsTo(() => Snippets, {
        foreignKey: 'snippetId',
        targetKey: 'snippetId',
        onDelete: 'CASCADE',
        constraints: true,
    })
    snippet!: Snippets;
}
