import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    nome: string;
    administrador: boolean;
    tipo: 'INSTITUICAO' | 'PCD';
  };
}

const adminMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    const [rows]: [RowDataPacket[], any] = await pool.query('SELECT administrador FROM usuarios WHERE id = ?', [(decoded as any).id]);

    if (rows.length === 0 || !rows[0].administrador) {
      return res.status(403).json({ message: 'Permissão negada' });
    }

    (req as AuthenticatedRequest).user = decoded as any;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

export default adminMiddleware;