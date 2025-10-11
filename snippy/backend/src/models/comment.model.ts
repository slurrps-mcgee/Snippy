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
import { UUID, UUIDV4 } from "sequelize/lib/data-types";

@Table({
    tableName: "comments",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Comments extends Model<Comments> {
    @PrimaryKey
    @Default(UUIDV4)
    @Column({ type: UUID })
    commentId!: string;

    @ForeignKey(() => Users)
    @Column({ type: UUID })
    auth0Id!: string;

    @ForeignKey(() => Snippets)
    @Column({ type: UUID })
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
