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
import { Users } from "./user.model";

@Table({
    tableName: "favorites",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Favorites extends Model<Favorites> {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column({ type: DataType.UUID })
    favoriteId!: string;

    @ForeignKey(() => Users)
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    auth0Id!: string;

    @ForeignKey(() => Snippets)
    @Column({
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
