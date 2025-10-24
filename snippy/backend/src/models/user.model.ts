import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  HasMany,
  BeforeCreate,
} from 'sequelize-typescript';
import { Snippets } from './snippet.model';
import { Favorites } from './favorite.model';
import { Comments } from './comment.model';
import { createUniqueUsername } from '../utils/helper';

@Table({
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Users extends Model<Users> {
  @PrimaryKey
  @Column({ 
    field: 'auth0_id',
    type: DataType.STRING
  })
  auth0Id!: string;

  @Column({
    field: 'user_name',
    type: DataType.STRING,
    allowNull: false,
    unique: true
  })
  userName!: string;

  @Column({
    field: 'display_name',
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  displayName?: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  bio?: string | null;

  @Column({
    field: 'picture_url',
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  pictureUrl?: string | null;

  @Column({
    field: 'is_admin',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  isAdmin!: boolean;

  // Relations
  @HasMany(() => Snippets, {
    foreignKey: 'auth0Id',
    sourceKey: 'auth0Id',
    constraints: false,
  })
  snippets!: Snippets[];

  @HasMany(() => Favorites, {
    foreignKey: 'auth0Id',
    sourceKey: 'auth0Id',
    constraints: false,
  })
  favorites!: Favorites[];

  @HasMany(() => Comments, {
    foreignKey: 'auth0Id',
    sourceKey: 'auth0Id',
    constraints: false,
  })
  comments!: Comments[];

  // Before creating a user, auto-generate a username if not provided
  @BeforeCreate
  static async generateUsername(user: Users) {
    await createUniqueUsername(user);
  }
}