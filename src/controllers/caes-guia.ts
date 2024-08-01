import { Router, json, Request, Response } from 'express';
import pool from '../config/database';
import { caesGuiaSchema } from '../validators/caesGuiaValidator';
import authMiddleware from '../middlewares/authMiddleware';
import upload from '../middlewares/upload';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { RowDataPacket } from 'mysql2';

const execAsync = promisify(exec);
const router = Router();
router.use(json());
router.use(authMiddleware);

const uploadsDir = path.join(__dirname, '../../uploads');


if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    nome: string;
    administrador: boolean;
    tipo: 'INSTITUICAO' | 'PCD';
  };
}

router.post('/', upload.single('imagem'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      console.log('Usuário autenticado:', user);
  
      let id_usuario: number | null = null;
      let id_instituicao: number | null = null;
  
      if (user?.tipo === 'PCD') {
        id_usuario = user.id;
  
        if (req.body.cnpj_instituicao) {
          const cnpj = req.body.cnpj_instituicao.replace(/[^\d]/g, '');
          const [rows]: any = await pool.query('SELECT id FROM instituicoes WHERE cnpj = ?', [cnpj]);
          if (rows.length > 0) {
            id_instituicao = rows[0].id;
          } else {
            console.warn('Instituição não encontrada para o CNPJ fornecido');
          }
        }
      } else if (user?.tipo === 'INSTITUICAO') {
        id_instituicao = user.id;
      } else {
        console.log('Permissão negada');
        return res.status(403).json({ message: 'Permissão negada' });
      }
  
      console.log('Dados recebidos para cadastro de cão-guia:', req.body);
  
      const validation = caesGuiaSchema.safeParse({ ...req.body, id_instituicao, id_usuario });
      if (!validation.success) {
        const errorMessages = validation.error.errors.map(err => err.message).join(', ');
        console.error('Erros de validação:', errorMessages);
        return res.status(400).json({ message: `Erro de validação: ${errorMessages}` });
      }
  
      const data = validation.data;
      const values = [
        data.nome,
        data.sexo,
        data.cor,
        data.data_nascimento,
        data.raca,
        data.numero_registro,
        id_instituicao,
        id_usuario
      ];
  
      console.log('Valores para inserção:', values);
  
      let imagemPath: string | null = null;
      if (req.file) {
        const originalPath = path.join(uploadsDir, req.file.filename);
        const processedFilename = `processed-${req.file.filename}`;
        const processedPath = path.join(uploadsDir, processedFilename);
  
        console.log(`Original Path: ${originalPath}`);
        console.log(`Processed Path: ${processedPath}`);
  
        const image = sharp(originalPath);
        const metadata = await image.metadata();
        console.log(`Image metadata: ${JSON.stringify(metadata)}`);
  
        if (!metadata.width || !metadata.height) {
          fs.unlinkSync(originalPath);
          return res.status(400).json({ message: 'A imagem fornecida é inválida.' });
        }
  
        if (metadata.width < 300 || metadata.height < 400) {
          fs.unlinkSync(originalPath);
          return res.status(400).json({ message: 'A resolução mínima da imagem é 300x400.' });
        }
  
        if (metadata.width > 3000 || metadata.height > 4000) {
          fs.unlinkSync(originalPath);
          return res.status(400).json({ message: 'A resolução máxima da imagem é 3000x4000.' });
        }
  
        await image
          .resize({ width: 600, height: 800, fit: 'cover' })
          .toFile(processedPath);
  
        fs.unlinkSync(originalPath);
        imagemPath = processedFilename;
        console.log(`Imagem salva em: ${imagemPath}`);
      }
  
      let conn;
      try {
        conn = await pool.getConnection();
        const [result]: any = await conn.execute(
          `INSERT INTO caes_guia (nome, sexo, cor, data_nascimento, raca, numero_registro, id_instituicao, id_usuario, imagem) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [...values, imagemPath]
        );
        console.log('Cão-guia registrado com sucesso:', result);
        res.status(201).json(result);
      } catch (e: any) {
        if (e.code === 'ER_DUP_ENTRY') {
          console.error('Erro ao adicionar cão-guia: Número de registro duplicado');
          if (imagemPath) fs.unlinkSync(path.join(uploadsDir, imagemPath));
          res.status(409).json({ message: 'Número de registro duplicado' });
        } else {
          console.error('Erro ao adicionar cão-guia:', e);
          if (imagemPath) fs.unlinkSync(path.join(uploadsDir, imagemPath));
          res.status(500).json({ message: 'Erro ao adicionar cão-guia', error: e.message });
        }
      } finally {
        if (conn) conn.release();
      }
    } catch (e: unknown) {
      const error = e as Error;
      console.error('Erro ao validar dados do cão-guia:', error);
      return res.status(400).json({ message: `Erro ao validar dados do cão-guia: ${error.message}` });
    }
  });


router.get('/meus', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    let conn;
    try {
      conn = await pool.getConnection();
      const [rows]: [RowDataPacket[], any] = await conn.execute(
        'SELECT * FROM caes_guia WHERE id_usuario = ? OR id_instituicao = ? AND ativo = true',
        [user?.id, user?.id]
      );
      res.json(rows);
    } catch (e: unknown) {
      const error = e as Error;
      console.error('Erro ao obter cães-guia:', error);
      res.status(500).json({ message: 'Erro ao obter cães-guia', error: error.message });
    } finally {
      if (conn) conn.release();
    }
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Erro ao validar usuário:', error);
    return res.status(400).json({ message: `Erro ao validar usuário: ${error.message}` });
  }
});


router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  let conn;
  try {
    conn = await pool.getConnection();


    const [rows]: any = await conn.execute('SELECT imagem FROM caes_guia WHERE id=?', [parseInt(req.params.id, 10)]);
    const imagemPath = rows[0]?.imagem;


    const [result]: any = await conn.execute('UPDATE caes_guia SET ativo=false WHERE id=?', [parseInt(req.params.id, 10)]);


    if (imagemPath) {
      fs.unlinkSync(imagemPath);
    }

    res.json(result);
  } catch (e) {
    console.error('Erro ao inativar cão-guia:', e);
    res.status(500).json(e);
  } finally {
    if (conn) conn.release();
  }
});

export default router;