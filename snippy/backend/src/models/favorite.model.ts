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
    @Column(DataType.UUID)
    userId!: string;

    @ForeignKey(() => Snippets)
    @Column(DataType.UUID)
    snippetId!: string;

    // Relations
    @BelongsTo(() => Users, {
        foreignKey: 'userId',
        targetKey: 'userId',
        constraints: false,
    })
    user!: Users;
    
    @BelongsTo(() => Snippets, {
        foreignKey: 'snippetId',
        targetKey: 'snippetId',
        constraints: false,
    })
    snippet!: Snippets;
}
