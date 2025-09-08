import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { Users } from '../models/user.model'; // Adjust the import path as necessary
import { Invites } from '../models/invite.model';
import { Snippets } from '../models/snippet.model';
import { Snippet_Files } from '../models/snippet_file.model';
import { Favorites } from '../models/favorite.model';
import { Comments } from '../models/comment.model';

dotenv.config();

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'database',
  username: process.env.DB_USER || 'username',
  password: process.env.DB_PASS || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306, // MySQL default port
  dialect: 'mysql', // Change to MySQL
  logging: false,
  models: [Users, Invites, Snippets, Snippet_Files, Favorites, Comments], // Register models for syncing
});

// Optional: Test the database connection
sequelize.authenticate()
  .then(() => console.log('Database connection established.'))
  .catch((err) => console.error('Unable to connect to the database:', err));

// Optional: Sync all models with the database
sequelize.sync({ alter: true }) // Updates tables without losing data
  .then(() => console.log('All models were synchronized successfully.'))
  .catch((err) => console.error('Sequelize sync error:', err));

export default sequelize;
