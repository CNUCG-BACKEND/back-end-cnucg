import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT as string, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    namedPlaceholders: true,
    charset: 'utf8mb4'
});


(async () => {
    try {
        const conn = await pool.getConnection();
        console.log('Conexão com o banco de dados estabelecida com sucesso.');
        conn.release();
    } catch (e) {
        console.error('Erro ao conectar ao banco de dados:', e);
    }
})();

export default pool;