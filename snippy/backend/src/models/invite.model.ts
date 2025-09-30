import { Table, Column, Model, DataType, PrimaryKey, Default, AutoIncrement } from 'sequelize-typescript';

@Table({
  tableName: 'invites',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Invite extends Model<Invite> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  inviteId!: number;

  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    unique: "invite_code_unique",
  })
  code!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: 'invite_email_unique',
  })
  email!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  used!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true, // invite may not be used yet
  })
  used_at!: Date | null;
}
