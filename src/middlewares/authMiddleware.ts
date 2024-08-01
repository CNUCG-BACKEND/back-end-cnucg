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

const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
    const [rows]: [RowDataPacket[], any] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    if (rows[0].status_validacao === 'pendente') {
      return res.status(403).json({ message: 'Cadastro em pendência de aprovação.' });
    }

    if (rows[0].status_validacao === 'rejeitado') {
      return res.status(403).json({ message: 'Cadastro rejeitado. Entre em contato para mais informações.' });
    }

    req.user = {
      id: decoded.id,
      nome: decoded.nome,
      administrador: decoded.administrador,
      tipo: rows[0].id_instituicao ? 'INSTITUICAO' : 'PCD'
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

export default authMiddleware;