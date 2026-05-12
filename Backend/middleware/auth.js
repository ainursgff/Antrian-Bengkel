const fs = require('fs');
const path = require('path');

const TOKENS_FILE = path.join(__dirname, '../active_tokens.json');

// In-memory token store: token -> { userId, role, nama, email, noHp }
let activeTokens = new Map();

// Muat data token dari file saat startup backend
try {
  if (fs.existsSync(TOKENS_FILE)) {
    const raw = fs.readFileSync(TOKENS_FILE, 'utf8');
    if (raw.trim()) {
      const obj = JSON.parse(raw);
      activeTokens = new Map(Object.entries(obj));
    }
  }
} catch (e) {
  console.error("Database startup check error (active_tokens.json):", e);
}

function saveTokens() {
  try {
    const obj = Object.fromEntries(activeTokens.entries());
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error("Gagal menyimpan active_tokens.json:", e);
  }
}

function addToken(token, userData) {
  activeTokens.set(token, userData);
  saveTokens();
}

function removeToken(token) {
  activeTokens.delete(token);
  saveTokens();
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
