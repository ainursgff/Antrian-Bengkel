// In-memory token store: token -> { userId, role, nama, email, noHp }
const activeTokens = new Map();

function addToken(token, userData) {
  activeTokens.set(token, userData);
}

function removeToken(token) {
  activeTokens.delete(token);
}

function getUser(token) {
  return activeTokens.get(token);
}

// Middleware: cek token valid
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  const user = activeTokens.get(token);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Token tidak valid atau sudah kadaluarsa' });
  }

  req.user = user;
  req.token = token;
  next();
}

// Middleware: cek harus admin
function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Hanya admin yang dapat mengakses' });
    }
    next();
  });
}

module.exports = { authMiddleware, adminMiddleware, addToken, removeToken, getUser };
