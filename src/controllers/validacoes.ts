import { Router } from 'express';
import pool from '../config/database';
import adminMiddleware from '../middlewares/adminMiddleware';
import { RowDataPacket, OkPacket } from 'mysql2';

const router = Router();
router.use(adminMiddleware);


router.get('/listar/usuarios/:status', async (req, res) => {
  const { status } = req.params;

  try {
    const [rows]: [RowDataPacket[], any] = await pool.query(
      'SELECT * FROM usuarios WHERE status_validacao = ? AND administrador = false',
      [status]
    );

    res.json(rows);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao listar usuários', error: errorMessage });
  }
});


router.get('/listar/instituicoes/:status', async (req, res) => {
  const { status } = req.params;

  try {
    const [rows]: [RowDataPacket[], any] = await pool.query(
      'SELECT * FROM instituicoes WHERE status_validacao = ?',
      [status]
    );

    res.json(rows);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao listar instituições', error: errorMessage });
  }
});


router.post('/validar-usuario/:id', async (req, res) => {
  const { id } = req.params;
  const { status, motivo_rejeicao } = req.body;

  try {
    const [result]: [OkPacket, any] = await pool.query(
      'UPDATE usuarios SET status_validacao = ?, motivo_rejeicao = ? WHERE id = ? AND administrador = false',
      [status, motivo_rejeicao, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado ou é um administrador' });
    }

    res.json({ message: 'Status do usuário atualizado com sucesso' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao atualizar status do usuário', error: errorMessage });
  }
});


router.post('/validar-instituicao/:id', async (req, res) => {
  const { id } = req.params;
  const { status, motivo_rejeicao } = req.body;

  try {
    const [result]: [OkPacket, any] = await pool.query(
      'UPDATE instituicoes SET status_validacao = ?, motivo_rejeicao = ? WHERE id = ?',
      [status, motivo_rejeicao, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Instituição não encontrada' });
    }

    res.json({ message: 'Status da instituição atualizado com sucesso' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ message: 'Erro ao atualizar status da instituição', error: errorMessage });
  }
});

export default router;