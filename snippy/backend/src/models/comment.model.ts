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
import { Users } from "./user.model";
import { allow } from "joi";

@Table({
    tableName: "comments",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Comments extends Model<Comments> {
    @PrimaryKey
    @Column({ 
        field: 'comment_id',
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4
    })
    commentId!: string;

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

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    content!: string;

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
