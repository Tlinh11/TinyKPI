import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'topkpi_default_jwt_secret_key_2026',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
};
