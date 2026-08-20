import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { Users } from './user.entity';

@Table({
  tableName: 'follows',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      name: 'idx_follows_pair',
      unique: true,
      fields: ['follower_auth0_id', 'following_auth0_id'],
    },
    {
      name: 'idx_follows_follower',
      fields: ['follower_auth0_id'],
    },
    {
      name: 'idx_follows_following',
      fields: ['following_auth0_id'],
    },
  ],
})
export class Follows extends Model<Follows> {
  @PrimaryKey
  @Column({
    field: 'follow_id',
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  followId!: string;

  @ForeignKey(() => Users)
  @Column({
    field: 'follower_auth0_id',
    type: DataType.STRING,
    allowNull: false,
  })
  followerAuth0Id!: string;

  @ForeignKey(() => Users)
  @Column({
    field: 'following_auth0_id',
    type: DataType.STRING,
    allowNull: false,
  })
  followingAuth0Id!: string;

  @CreatedAt
  @Column({ field: 'created_at' })
  createdAt!: Date;

  @BelongsTo(() => Users, {
    foreignKey: 'followerAuth0Id',
    targetKey: 'auth0Id',
    as: 'follower',
    onDelete: 'CASCADE',
    constraints: true,
  })
  follower!: Users;

  @BelongsTo(() => Users, {
    foreignKey: 'followingAuth0Id',
    targetKey: 'auth0Id',
    as: 'following',
    onDelete: 'CASCADE',
    constraints: true,
  })
  following!: Users;
}
