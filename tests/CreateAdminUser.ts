import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
};

const createAdminUser = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  const senha = 'senha123';
  const hashedPassword = await hashPassword(senha);

  const query = `
    INSERT INTO usuarios (
      nome, email, senha, cpf, sexo, data_nascimento, endereco_logradouro, endereco_numero, 
      endereco_complemento, endereco_cep, endereco_cidade, endereco_estado, endereco_bairro, 
      rg, telefone, id_instituicao, status_validacao, administrador
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    'Admin', 'admin@example.com', hashedPassword, '00000000000', 'masc', '1970-01-01', 'Rua Admin', 
    '123', 'Apto 1', '00000000', 'Cidade Admin', 'ST', 'Bairro Admin', '00000000', '000000000', null, 'aprovado', true
  ];

  try {
    const [result] = await connection.execute(query, values);
    console.log('Usuário administrador criado com sucesso:', result);
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
  } finally {
    await connection.end();
  }
};

createAdminUser();