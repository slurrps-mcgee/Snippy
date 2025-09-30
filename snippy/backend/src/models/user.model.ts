import { Table, Column, Model, PrimaryKey, DataType, HasMany, BeforeCreate, Default } from 'sequelize-typescript';
import { Snippets } from './snippet.model';
import { Favorites } from './favorite.model';
import { Comments } from './comment.model';
import { UUIDV4 } from 'sequelize';

@Table({ 
  tableName: 'users', 
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Users extends Model<Users> {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: UUIDV4 })
  userId!: string;

  @Column({ 
    type: DataType.STRING, 
    allowNull: false, 
    unique: "user_username_unique" 
  })
  user_name!: string;

  @Column({ 
    type: DataType.STRING, 
    allowNull: false, 
  })
  display_name!: string;

  @Column({ 
    type: DataType.STRING, 
    allowNull: false, 
    unique: "user_email_unique" 
  })
  email!: string;

  @Column({ 
    type: DataType.STRING, 
    allowNull: false, 
  })
  password!: string;

  @Column({ 
    type: DataType.STRING, 
    allowNull: false, 
  })
  salt!: string;

  @Column({ 
    type: DataType.TEXT, 
    allowNull: false, 
  })
  bio!: string;

  @Default(false)
  @Column({ 
    type: DataType.BOOLEAN, 
    allowNull: false, 
  })
  is_admin!: boolean;

  // Relations
  @HasMany(() => Snippets, { 
    foreignKey: 'userId', 
    sourceKey: 'userId',
    constraints: false,
  })
  snippets!: Snippets[];

  @HasMany(() => Favorites, { 
    foreignKey: 'userId', 
    sourceKey: 'userId',
    constraints: false,
  })
  favorites!: Favorites[];

  @HasMany(() => Comments, { 
    foreignKey: 'userId', 
    sourceKey: 'userId',
    constraints: false,
  })
  comments!: Comments[];

  /**
   * Before creating a user, auto-generate a username if not provided
   */
  @BeforeCreate
  static async setDefaultUsername(user: Users) {
    if (!user.user_name) {
      const randomSuffix = Math.floor(Math.random() * 10000);
      const baseName = user.display_name
        ? user.display_name.replace(/\s+/g, '').toLowerCase()
        : 'user';
      user.user_name = `${baseName}${randomSuffix}`;
    }
  }
}
