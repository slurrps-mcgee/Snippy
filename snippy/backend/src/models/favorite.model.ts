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
import { Users } from "./user.model";
import { UUIDV4 } from "sequelize";
import { UUID } from "sequelize";

@Table({
    tableName: "favorites",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Favorites extends Model<Favorites> {
    @PrimaryKey
    @Default(UUIDV4)
    @Column({ type: UUID })
    favoriteId!: string;

    @ForeignKey(() => Users)
    @Column({ type: UUID })
    auth0Id!: string;

    @ForeignKey(() => Snippets)
    @Column({ type: UUID })
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
