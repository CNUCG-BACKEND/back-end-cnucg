import { Router, json, Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket, OkPacket } from 'mysql2';
import { userSchema } from '../validators/authValidator';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    nome: string;
    administrador: boolean;
    tipo: 'INSTITUICAO' | 'PCD';
  };
}

const router = Router();
router.use(json());

const tableName = 'usuarios';


router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    userSchema.parse(req.body);
    const insCols = Object.keys(req.body);
    const values = Object.values(req.body);
    let conn;
    try {
      conn = await pool.getConnection();
      const [result]: [OkPacket, any] = await conn.execute(
        `INSERT INTO ${tableName} (${insCols.join(", ")}) VALUES (${insCols.map(() => "?").join(", ")})`,
        values
      );
      res.status(201).json(result); 
    } catch (e) {
      console.error('Erro ao inserir usuário:', e);
      res.status(500).json(e);
    } finally {
      if (conn) conn.release();
    }
  } catch (e: any) {
    console.error('Erro ao validar dados do usuário:', e);
    return res.status(400).send(e.message);
  }
});


router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows]: [RowDataPacket[], any] = await conn.execute(
      `SELECT * FROM ${tableName} WHERE id=? AND ativo=true`,
      [req.params.id]
    );
    if (rows.length <= 0) {
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }
    res.json(rows[0]);
  } catch (e) {
    console.error('Erro ao obter usuário:', e);
    res.status(500).json(e);
  } finally {
    if (conn) conn.release();
  }
});


router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [result]: [OkPacket, any] = await conn.execute(
      `UPDATE ${tableName} SET ativo=false WHERE id=?`,
      [req.params.id]
    );
    res.json(result);
  } catch (e) {
    console.error('Erro ao inativar usuário:', e);
    res.status(500).json(e);
  } finally {
    if (conn) conn.release();
  }
});

export default router;