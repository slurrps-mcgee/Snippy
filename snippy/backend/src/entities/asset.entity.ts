import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { Users } from './user.entity';

@Table({
  tableName: 'assets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_assets_auth0_object_key',
      fields: ['auth0_id', 'object_key'],
      unique: true,
    },
    {
      name: 'idx_assets_auth0Id',
      fields: ['auth0_id'],
    },
  ],
})
export class Assets extends Model<Assets> {
  @PrimaryKey
  @Column({
    field: 'asset_id',
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  assetId!: string;

  @ForeignKey(() => Users)
  @Column({
    field: 'auth0_id',
    type: DataType.STRING,
    allowNull: false,
  })
  auth0Id!: string;

  @Column({
    field: 'file_name',
    type: DataType.STRING,
    allowNull: false,
  })
  fileName!: string;

  @Column({
    field: 'object_key',
    type: DataType.STRING,
    allowNull: false,
  })
  objectKey!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  url!: string;

  @Column({
    field: 'file_type',
    type: DataType.STRING,
    allowNull: false,
  })
  fileType!: string;

  // Relations
  @BelongsTo(() => Users, {
    foreignKey: 'auth0Id',
    targetKey: 'auth0Id',
    onDelete: 'CASCADE',
    constraints: true,
  })
  user!: Users;
}
