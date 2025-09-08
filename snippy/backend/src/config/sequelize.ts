import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { Users } from '../models/user.model'; // Adjust the import path as necessary
import { Invites } from '../models/invite.model';
import { Snippets } from '../models/snippet.model';
import { Snippet_Files } from '../models/snippet_file.model';
import { Favorites } from '../models/favorite.model';
import { Comments } from '../models/comment.model';

dotenv.config();

// Initialize Sequelize with MySQL configuration
const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'database',
  username: process.env.DB_USER || 'username',
  password: process.env.DB_PASS || 'password',
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT) || 3306, // MySQL default port
  dialect: 'mysql', // Change to MySQL
  logging: false,
  models: [Users, Invites, Snippets, Snippet_Files, Favorites, Comments], // Register models for syncing
});

// Function to connect to the database with retry logic
async function connectWithRetry() {
  let connected = false;
  while (!connected) {
    try {
      await sequelize.authenticate();
      connected = true;
      console.log("Database connected!");
      await sequelize.sync({ alter: true }); // Sync models with the database
      console.log("All models were synchronized successfully.");
    } catch (err) {
      console.log("Database not ready, retrying in 3s...");
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

export default connectWithRetry;
