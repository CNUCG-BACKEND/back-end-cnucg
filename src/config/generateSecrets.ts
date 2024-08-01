import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';


dotenv.config();


const generateSecret = (length: number = 64): string => {
  return crypto.randomBytes(length).toString('base64');
};


const ensureSecretInEnv = (key: string, defaultValue: string): void => {
  if (!process.env[key]) {
    fs.appendFileSync('.env', `\n${key}=${defaultValue}`);
  }
};


const jwtSecret = generateSecret();
const salt = generateSecret(16);

ensureSecretInEnv('JWT_SECRET', jwtSecret);
ensureSecretInEnv('SALT', salt);

console.log('Segredos garantidos no arquivo .env');