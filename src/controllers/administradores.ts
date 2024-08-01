import { Router } from 'express';
import pool from '../config/database';
import adminMiddleware from '../middlewares/adminMiddleware';
import { RowDataPacket, OkPacket } from 'mysql2';

const router = Router();
router.use(adminMiddleware);


router.post('/promover/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result]: [OkPacket, any] = await pool.query('UPDATE usuarios SET administrador = true WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json({ message: 'Usuário promovido a administrador com sucesso' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao promover usuário', error: errorMessage });
  }
});

router.post('/rebaixar/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result]: [OkPacket, any] = await pool.query('UPDATE usuarios SET administrador = false WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json({ message: 'Usuário rebaixado de administrador com sucesso' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao rebaixar usuário', error: errorMessage });
  }
});

router.get('/listar/:tipo/:status', async (req, res) => {
  const { tipo, status } = req.params;
  let tableName;

  if (tipo === 'usuarios') {
    tableName = 'usuarios';
  } else if (tipo === 'instituicoes') {
    tableName = 'instituicoes';
  } else {
    return res.status(400).json({ message: 'Tipo inválido. Use "usuarios" ou "instituicoes".' });
  }

  try {
    const [rows]: [RowDataPacket[], any] = await pool.query(`SELECT * FROM ${tableName} WHERE status_validacao = ?`, [status]);
    res.json(rows);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao listar registros', error: errorMessage });
  }
});

export default router;