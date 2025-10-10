import { Table, Column, Model, PrimaryKey, DataType, Default, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Users } from './user.model';

@Table({
  tableName: 'password_reset_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class PasswordReset extends Model<PasswordReset> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id!: string;

  @ForeignKey(() => Users)
  @Column({ type: DataType.UUID, allowNull: false })
  userId!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  token_hash!: string;

  @Column({ type: DataType.DATE, allowNull: false })
  expires_at!: Date;

  @BelongsTo(() => Users, { foreignKey: 'userId', constraints: true })
  user?: Users;
}

export default PasswordReset;
