import { Table, Column, Model, PrimaryKey, Default, DataType, HasMany, AutoIncrement } from 'sequelize-typescript';
import { Snippets } from './snippet.model';
import { Favorites } from './favorite.model';
import { Comments } from './comment.model';

@Table({ 
  tableName: 'users', 
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Users extends Model<Users> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  userId!: number;

  @Column({ 
    type: DataType.STRING, 
    allowNull: false, 
    unique: "user_email_unique" 
  })
  email!: string;

  @Column({ 
    type: DataType.STRING, 
    allowNull: false, 
    unique: "user_auth0_unique" 
  })
  auth0Id!: string;

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
}
