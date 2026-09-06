import jwt from 'jsonwebtoken';
const secret = process.env.JWT_SECRET || 'marketpulse-development-secret';
export const signToken = user => jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '7d' });
export function requireAuth(req, res, next) { const token = req.headers.authorization?.replace('Bearer ', ''); try { req.user = jwt.verify(token, secret); next(); } catch { res.status(401).json({ error: 'Your session has expired. Please sign in again.' }); } }
