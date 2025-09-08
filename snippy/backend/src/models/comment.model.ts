import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
    ForeignKey,
    BelongsTo,
} from "sequelize-typescript";
import { Snippets } from "./snippet.model";
import { Users } from "./user.model";

@Table({
    tableName: "comments",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Comments extends Model<Comments> {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    commentId!: number;

    @ForeignKey(() => Users)
    @Column(DataType.INTEGER)
    auth0Id!: number;

    @BelongsTo(() => Users, {
        foreignKey: 'auth0Id',
        targetKey: 'auth0Id',
        constraints: false,
    })
    users!: Users;
    
    @ForeignKey(() => Snippets)
    @Column(DataType.INTEGER)
    snippetId!: number;

    @BelongsTo(() => Snippets, {
        foreignKey: 'snippetId',
        targetKey: 'snippetId',
        constraints: false,
    })
    snippet!: Snippets;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    content!: string;
}
