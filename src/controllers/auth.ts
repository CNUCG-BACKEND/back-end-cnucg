import { Router, json } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { RowDataPacket, OkPacket } from 'mysql2';
import { userSchema } from '../validators/authValidator';
import { institutionSchema } from '../validators/instituicoesValidator';
import { z, ZodIssue } from 'zod';

const router = Router();
router.use(json());

const cleanNumberString = (value: string) => {
  return value.replace(/[^\d]/g, '');
};

const validateFields = (data: any) => {
  const errors: string[] = [];

  data.cpf = cleanNumberString(data.cpf);
  if (data.cpf.length !== 11) {
    errors.push('CPF deve conter apenas números e ter exatamente 11 dígitos.');
  }

  data.rg = cleanNumberString(data.rg);
  if (data.rg.length < 7 || data.rg.length > 14) {
    errors.push('RG deve conter apenas números e ter entre 7 e 14 dígitos.');
  }

  data.endereco_cep = cleanNumberString(data.endereco_cep);
  if (data.endereco_cep.length !== 8) {
    errors.push('CEP deve conter apenas números e ter exatamente 8 dígitos.');
  }

  return errors;
};


router.post('/register', async (req, res) => {
  console.log('Recebendo solicitação de registro de usuário...');
  console.log('Dados recebidos:', req.body);

  const validation = userSchema.safeParse(req.body);
  if (!validation.success) {
    const errorMessage = validation.error.errors.map((err: z.ZodIssue) => err.message).join(', ');
    console.error('Erro de validação:', errorMessage);
    return res.status(400).json({ message: 'Erro de validação', errors: validation.error.errors });
  }

  const data = validation.data;

  
  const fieldErrors = validateFields(data);
  if (fieldErrors.length > 0) {
    return res.status(400).json({ message: 'Erro de validação', errors: fieldErrors });
  }

  const hashedPassword = await bcrypt.hash(data.senha, 10);
  console.log('Senha hashada:', hashedPassword);

  let conn;
  try {
    conn = await pool.getConnection();
    const query = 'INSERT INTO usuarios (nome, email, senha, cpf, sexo, data_nascimento, endereco_logradouro, endereco_numero, endereco_complemento, endereco_cep, endereco_cidade, endereco_estado, endereco_bairro, rg, telefone, id_instituicao, status_validacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [data.nome, data.email, hashedPassword, data.cpf, data.sexo, data.data_nascimento, data.endereco_logradouro, data.endereco_numero, data.endereco_complemento, data.endereco_cep, data.endereco_cidade, data.endereco_estado, data.endereco_bairro, data.rg, data.telefone, null, 'pendente'];
    console.log('Executando query:', query);
    console.log('Com valores:', values);
    const [result]: [OkPacket, any] = await conn.query(query, values);

    const [user]: [RowDataPacket[], any] = await conn.query('SELECT * FROM usuarios WHERE id = ?', [result.insertId]);
    console.log('Usuário registrado no banco de dados:', user[0]);
    res.status(201).json({ message: 'Usuário registrado com sucesso e está em pendência de aprovação.', user: user[0] });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    if (error.code === 'ER_DUP_ENTRY') {
      const duplicateField = error.sqlMessage.match(/'(.+?)'/)[1];
      res.status(409).json({ message: `Erro: ${duplicateField} já está em uso.` });
    } else {
      console.error('Erro ao registrar usuário:', errorMessage);
      res.status(500).json({ message: 'Erro ao registrar usuário', error: errorMessage });
    }
  } finally {
    if (conn) conn.release();
  }
});


router.post('/register-institution', async (req, res) => {
  console.log('Recebendo solicitação de registro de instituição...');
  console.log('Dados recebidos:', req.body);

  const validation = institutionSchema.safeParse(req.body);
  if (!validation.success) {
    const errorMessage = validation.error.errors.map(err => err.message).join(', ');
    console.error('Erro de validação:', errorMessage);
    return res.status(400).json({ message: 'Erro de validação', errors: validation.error.errors });
  }

  const data = validation.data;


  data.cnpj = cleanNumberString(data.cnpj);
  data.endereco_cep = cleanNumberString(data.endereco_cep);

  const hashedPassword = await bcrypt.hash(data.senha, 10);
  console.log('Senha hashada:', hashedPassword);

  let conn;
  try {
    conn = await pool.getConnection();
    const query = 'INSERT INTO instituicoes (razao_social, cnpj, endereco_logradouro, endereco_numero, endereco_complemento, endereco_cep, endereco_cidade, endereco_estado, endereco_bairro, email, senha, status_validacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [data.razao_social, data.cnpj, data.endereco_logradouro, data.endereco_numero, data.endereco_complemento, data.endereco_cep, data.endereco_cidade, data.endereco_estado, data.endereco_bairro, data.email, hashedPassword, 'pendente'];
    console.log('Executando query:', query);
    console.log('Com valores:', values);
    const [result]: [OkPacket, any] = await conn.query(query, values);

    const [institution]: [RowDataPacket[], any] = await conn.query('SELECT * FROM instituicoes WHERE id = ?', [result.insertId]);
    console.log('Instituição registrada no banco de dados:', institution[0]);
    res.status(201).json({ message: 'Instituição registrada com sucesso e está em pendência de aprovação.', institution: institution[0] });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    if (error.code === 'ER_DUP_ENTRY') {
      const duplicateField = error.sqlMessage.match(/'(.+?)'/)[1];
      res.status(409).json({ message: `Erro: ${duplicateField} já está em uso.` });
    } else {
      console.error('Erro ao registrar instituição:', errorMessage);
      res.status(500).json({ message: 'Erro ao registrar instituição', error: errorMessage });
    }
  } finally {
    if (conn) conn.release();
  }
});


router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  console.log('Tentativa de login para email:', email);

  let conn;
  try {
    conn = await pool.getConnection();
    const [rows]: [RowDataPacket[], any] = await conn.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      console.log('Usuário não encontrado para email:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const user = rows[0];
    console.log('Usuário encontrado:', user);

    if (user.status_validacao === 'pendente') {
      return res.status(403).json({ message: 'Cadastro em pendência de aprovação.' });
    }

    if (user.status_validacao === 'rejeitado') {
      return res.status(403).json({ message: 'Cadastro rejeitado. Entre em contato para mais informações.' });
    }

    const passwordValid = await bcrypt.compare(senha, user.senha);
    console.log('Senha válida:', passwordValid);

    if (!passwordValid) {
      console.log('Senha inválida para email:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: user.id, nome: user.nome, administrador: user.administrador }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

    res.json({ message: 'Login bem-sucedido', token });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao fazer login:', errorMessage);
    res.status(500).json({ message: 'Erro ao fazer login', error: errorMessage });
  } finally {
    if (conn) conn.release();
  }
});


router.post('/login-institution', async (req, res) => {
  const { email, senha } = req.body;

  console.log('Tentativa de login para email:', email);

  let conn;
  try {
    conn = await pool.getConnection();
    const [rows]: [RowDataPacket[], any] = await conn.query(
      'SELECT * FROM instituicoes WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      console.log('Instituição não encontrada para email:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const institution = rows[0];
    console.log('Instituição encontrada:', institution);

    if (institution.status_validacao === 'pendente') {
      return res.status(403).json({ message: 'Cadastro em pendência de aprovação.' });
    }

    if (institution.status_validacao === 'rejeitado') {
      return res.status(403).json({ message: 'Cadastro rejeitado. Entre em contato para mais informações.' });
    }

    const passwordValid = await bcrypt.compare(senha, institution.senha);
    console.log('Senha válida:', passwordValid);

    if (!passwordValid) {
      console.log('Senha inválida para email:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: institution.id, razao_social: institution.razao_social, administrador: institution.administrador }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

    res.json({ message: 'Login bem-sucedido', token });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao fazer login:', errorMessage);
    res.status(500).json({ message: 'Erro ao fazer login', error: errorMessage });
  } finally {
    if (conn) conn.release();
  }
});

export default router;