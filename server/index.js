import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import multer from 'multer';

const { Pool } = pg;
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const jwtSecret = process.env.JWT_SECRET || 'change-this-secret-in-production';
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : undefined });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const safeUser = ({ id, email, name, role, active }) => ({ id, email, name, role, active });
const sign = user => jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '7d' });
const auth = async (req, res, next) => {
  try {
    const token = req.cookies.hr_session || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    const payload = jwt.verify(token, jwtSecret);
    const { rows } = await pool.query('SELECT id,email,name,role,active FROM app_users WHERE id=$1 AND active=true', [payload.id]);
    if (!rows[0]) return res.status(401).json({ message: 'User is inactive or not found' });
    req.user = rows[0]; next();
  } catch { res.status(401).json({ message: 'Invalid or expired session' }); }
};
const admin = (req, res, next) => req.user?.role === 'admin' ? next() : res.status(403).json({ message: 'Admin permission required' });

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.post('/api/auth/register', (_req, res) => res.status(403).json({ message: 'Public registration is disabled. Contact the administrator.' }));
app.post('/api/users', auth, admin, async (req, res) => {
  const { email, password, name = '', role = 'employee' } = req.body || {};
  const normalizedRole = role === 'admin' ? 'admin' : 'employee';
  if (!email || !password || password.length < 8) return res.status(400).json({ message: 'Email and password (8+ characters) are required' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query('INSERT INTO app_users(email,name,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,email,name,role,active,created_at AS created_date', [email.toLowerCase(), name, hash, normalizedRole]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(e.code === '23505' ? 409 : 500).json({ message: e.code === '23505' ? 'Email already exists' : 'User creation failed' }); }
});
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const { rows } = await pool.query('SELECT * FROM app_users WHERE email=$1 AND active=true', [String(email || '').toLowerCase()]);
  if (!rows[0] || !(await bcrypt.compare(password || '', rows[0].password_hash))) return res.status(401).json({ message: 'Invalid email or password' });
  res.cookie('hr_session', sign(rows[0]), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400000 });
  res.json({ user: safeUser(rows[0]) });
});
app.post('/api/auth/logout', (_req, res) => { res.clearCookie('hr_session'); res.json({ ok: true }); });
app.get('/api/auth/me', auth, (req, res) => res.json(safeUser(req.user)));

app.get('/api/entities/:entity', auth, async (req, res) => {
  const { entity } = req.params; const limit = Math.min(Number(req.query.limit || 500), 1000); const order = req.query.order?.startsWith('-') ? 'DESC' : 'ASC';
  const field = (req.query.order || 'created_at').replace(/^-/, '').match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)?.[0] || 'created_at';
  const { rows } = await pool.query(`SELECT id, data, created_at, updated_at FROM records WHERE entity=$1 ORDER BY COALESCE(data->>$2, updated_at::text) ${order} LIMIT $3`, [entity, field, limit]);
  res.json(rows.map(r => ({ id: r.id, created_date: r.created_at, updated_date: r.updated_at, ...r.data })));
});
app.post('/api/entities/:entity', auth, async (req, res) => {
  const { rows } = await pool.query('INSERT INTO records(entity,data,created_by) VALUES($1,$2,$3) RETURNING id,data,created_at,updated_at', [req.params.entity, req.body || {}, req.user.id]);
  res.status(201).json({ id: rows[0].id, created_date: rows[0].created_at, updated_date: rows[0].updated_at, ...rows[0].data });
});
app.patch('/api/entities/:entity/:id', auth, async (req, res) => {
  const { rows } = await pool.query('UPDATE records SET data=data || $1::jsonb, updated_at=now() WHERE id=$2 AND entity=$3 RETURNING id,data,created_at,updated_at', [JSON.stringify(req.body || {}), req.params.id, req.params.entity]);
  if (!rows[0]) return res.status(404).json({ message: 'Record not found' });
  res.json({ id: rows[0].id, created_date: rows[0].created_at, updated_date: rows[0].updated_at, ...rows[0].data });
});
app.delete('/api/entities/:entity/:id', auth, admin, async (req, res) => { await pool.query('DELETE FROM records WHERE id=$1 AND entity=$2', [req.params.id, req.params.entity]); res.status(204).end(); });
app.post('/api/entities/:entity/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'File is required' });
  const { rows } = await pool.query('INSERT INTO file_documents(filename,mime_type,content) VALUES($1,$2,$3) RETURNING id', [req.file.originalname, req.file.mimetype, req.file.buffer]);
  res.json({ file_url: `/api/files/${rows[0].id}` });
});
app.get('/api/files/:id', auth, async (req, res) => { const { rows } = await pool.query('SELECT filename,mime_type,content FROM file_documents WHERE id=$1', [req.params.id]); if (!rows[0]) return res.sendStatus(404); res.type(rows[0].mime_type).attachment(rows[0].filename).send(rows[0].content); });
app.get('/api/users', auth, admin, async (_req, res) => { const { rows } = await pool.query('SELECT id,email,name,role,active,created_at AS created_date FROM app_users ORDER BY created_at DESC'); res.json(rows); });
app.patch('/api/users/:id', auth, admin, async (req, res) => { const { rows } = await pool.query('UPDATE app_users SET role=COALESCE($1,role), active=COALESCE($2,active), name=COALESCE($3,name), updated_at=now() WHERE id=$4 RETURNING id,email,name,role,active', [req.body.role, req.body.active, req.body.name, req.params.id]); if (!rows[0]) return res.status(404).json({ message: 'User not found' }); res.json(rows[0]); });
app.delete('/api/users/:id', auth, admin, async (req, res) => { if (req.params.id === req.user.id) return res.status(400).json({ message: 'You cannot delete your own administrator account' }); const { rowCount } = await pool.query('DELETE FROM app_users WHERE id=$1', [req.params.id]); if (!rowCount) return res.status(404).json({ message: 'User not found' }); res.status(204).end(); });

const dist = path.resolve(__dirname, '../dist');
app.use(express.static(dist));
app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')));
const start = async () => {
  try { await pool.query(await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8')); await pool.query('SELECT 1'); console.log('Database ready'); }
  catch (error) { console.error('Database initialization failed:', error.message); process.exit(1); }
  app.listen(port, () => console.log(`HR server listening on ${port}`));
};
start();
