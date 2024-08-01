import pool from "../config/database";
import { RowDataPacket } from 'mysql2';

export async function getOne(req: any, res: any, tableName: string, columns: string[] = []) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `SELECT ${columns.length <= 0 ? '*' : columns.join(",")} FROM ?? WHERE ativo=true AND id=?`;
    const [rows]: [RowDataPacket[], any] = await conn.execute(query, [tableName, req.params.id]);
    if (rows.length <= 0) {
      res.status(204).send();
      return;
    }
    res.json(rows[0] ?? null);
  } catch (e) {
    res.status(500).json(e);
  } finally {
    if (conn) conn.release();
  }
}

export async function getMany(req: any, res: any, tableName: string, columns: string[] = []) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `SELECT ${columns.length <= 0 ? '*' : columns.join(",")} FROM ?? WHERE ativo=true AND id>=? LIMIT ?`;
    const [rows]: [RowDataPacket[], any] = await conn.execute(query, [tableName, req.params.id, parseInt(req.params.limit) ?? 1]);
    if (rows.length <= 0) {
      res.status(204).send();
      return;
    }
    res.json(rows);
  } catch (e) {
    res.status(500).json(e);
  } finally {
    if (conn) conn.release();
  }
}

export async function deleteRow(req: any, res: any, tableName: string) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `UPDATE ?? SET ativo=false WHERE id=?`;
    const [result]: [RowDataPacket[], any] = await conn.execute(query, [tableName, parseInt(req.params.id)]);
    res.json(result);
  } catch (e) {
    res.status(500).json(e);
  } finally {
    if (conn) conn.release();
  }
}

export async function insert(req: any, res: any, tableName: string, columns: string[] = []) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `INSERT INTO ?? (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
    const [result]: [RowDataPacket[], any] = await conn.execute(query, [tableName, ...Object.values(req.body)]);
    res.json(result);
  } catch (e) {
    res.status(500).json(e);
  } finally {
    if (conn) conn.release();
  }
}

export async function update(req: any, res: any, tableName: string, columns: string[] = []) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `UPDATE ?? SET ${columns.map(col => `${col}=?`).join(", ")} WHERE id=?`;
    const [result]: [RowDataPacket[], any] = await conn.execute(query, [tableName, ...Object.values(req.body), req.params.id]);
    res.json(result);
  } catch (e) {
    res.status(500).json(e);
  } finally {
    if (conn) conn.release();
  }
}