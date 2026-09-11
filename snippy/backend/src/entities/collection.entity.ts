import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  BeforeCreate,
} from 'sequelize-typescript';
import { Users } from './user.entity';
import { CollectionSnippets } from './collectionSnippet.entity';
import { createUniqueCollectionShortId } from '../common/utilities/helper';

@Table({
  tableName: 'collections',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { name: 'idx_collections_auth0', fields: ['auth0_id'] },
    { name: 'idx_collections_short_id', unique: true, fields: ['short_id'] },
    { name: 'idx_collections_auth0_private', fields: ['auth0_id', 'is_private'] },
  ],
})
export class Collections extends Model<Collections> {
  @PrimaryKey
  @Column({
    field: 'collection_id',
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  collectionId!: string;

  @ForeignKey(() => Users)
  @Column({
    field: 'auth0_id',
    type: DataType.STRING,
    allowNull: false,
  })
  auth0Id!: string;

  @Column({
    field: 'short_id',
    type: DataType.STRING(16),
    allowNull: false,
    unique: true,
  })
  shortId!: string;

  @Column({
    field: 'name',
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    field: 'description',
    type: DataType.TEXT,
    allowNull: true,
  })
  description!: string | null;

  @Column({
    field: 'is_private',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isPrivate!: boolean;

  @BelongsTo(() => Users, {
    foreignKey: 'auth0Id',
    targetKey: 'auth0Id',
    onDelete: 'CASCADE',
    constraints: true,
  })
  user!: Users;

  @HasMany(() => CollectionSnippets, {
    foreignKey: 'collectionId',
    sourceKey: 'collectionId',
    onDelete: 'CASCADE',
    constraints: true,
  })
  collectionSnippets!: CollectionSnippets[];

  @BeforeCreate
  static async setShortId(collection: Collections) {
    await createUniqueCollectionShortId(collection);
  }
}
