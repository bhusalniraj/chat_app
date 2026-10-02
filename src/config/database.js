import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 4000
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection Warning: ${error.message}`);
    console.log(`[MongoDB] Tips: Set a valid MONGO_URI (e.g. MongoDB Atlas) in server/.env to enable persistent database storage.`);
  }
};
