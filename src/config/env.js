import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb+srv://bhusalniraj51_db_user:nerraj01@cluster0.tlvm1v2.mongodb.net/chat_app',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_chat_app_key_2026_xyz',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};
