import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        nome: string;
        administrador: boolean;
        tipo: 'INSTITUICAO' | 'PCD';
      };
    }
  }
}

export {};