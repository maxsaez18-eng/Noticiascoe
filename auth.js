const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'app-noticias-secret-change-me';

function generateToken(user) {
  return jwt.sign({ id: user._id.toString(), username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function optionalToken(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), JWT_SECRET);
    } catch {}
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Autenticación requerida' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'No tienes permisos' });
    next();
  };
}

module.exports = { generateToken, verifyToken, optionalToken, requireRole };
