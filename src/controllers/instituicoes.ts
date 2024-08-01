import { Router, json } from 'express';
import pool from '../config/database';
import { RowDataPacket, OkPacket } from 'mysql2';
import { institutionSchema } from '../validators/instituicoesValidator';
import { ParsedQs } from 'qs';

const router = Router();
router.use(json());


const cleanNumberString = (value: string) => value.replace(/[^\d]/g, '');


const isValidCNPJ = (cnpj: string) => {
    cnpj = cleanNumberString(cnpj);
    if (cnpj.length !== 14) return false;

    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    let digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;
    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;
    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
}


router.post('/', async (req, res) => {
    try {
        const parsedData = institutionSchema.parse(req.body);
        parsedData.cnpj = cleanNumberString(parsedData.cnpj);
        parsedData.endereco_cep = cleanNumberString(parsedData.endereco_cep);

        const insColsData = [
            'razao_social', 'cnpj', 'endereco_logradouro', 'endereco_numero',
            'endereco_complemento', 'endereco_cep', 'endereco_cidade', 'endereco_estado',
            'endereco_bairro', 'email', 'senha'
        ];
        const values = Object.values(parsedData);
        let conn;
        try {
            conn = await pool.getConnection();
            const [result]: [OkPacket, any] = await conn.execute(
                `INSERT INTO instituicoes (${insColsData.join(", ")}) VALUES (${insColsData.map(() => "?").join(", ")})`,
                values
            );
            res.status(201).json(result); 
        } catch (e) {
            console.error('Erro ao adicionar instituição:', e);
            res.status(500).json(e);
        } finally {
            if (conn) conn.release();
        }
    } catch (e: any) {
        console.error('Erro ao validar dados da instituição:', e);
        return res.status(400).json({ message: 'Erro de validação', errors: e.errors });
    }
});


router.get('/search', async (req, res) => {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Query não fornecida ou inválida' });
    }

    const cnpj = cleanNumberString(query);

    if (!isValidCNPJ(cnpj)) {
        return res.status(400).json({ message: 'CNPJ inválido' });
    }

    try {
        const [rows]: [RowDataPacket[], any] = await pool.query(
            `SELECT id, razao_social, cnpj FROM instituicoes WHERE cnpj = ?`,
            [cnpj]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Nenhuma instituição encontrada com o CNPJ fornecido' });
        }

        res.json(rows[0]); 
    } catch (e) {
        console.error('Erro ao pesquisar instituições:', e);
        res.status(500).json(e);
    }
});

export default router;