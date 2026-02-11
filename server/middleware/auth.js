const jwt = require('jsonwebtoken');
const { getSession } = require('../services/session');

// JWT_SECRET is required in production - fail fast if not configured
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('❌ FATAL: JWT_SECRET environment variable is required in production mode');
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  process.exit(1);
}

// Use a clear fallback message for development
const JWT_SECRET_FINAL = JWT_SECRET || (() => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  WARNING: Using insecure fallback JWT_SECRET in development mode');
    return 'dev-secret-not-for-production';
  }
})();

// JWT Authentication middleware (production mode)
function requireJWT(req, res, next) {
  // Check for demo mode bypass (only if explicitly enabled)
  if (process.env.DEMO_MODE === 'true') {
    req.user = { userId: 'demo', role: 'admin', email: 'demo@ridendine.com' };
    return next();
  }

  // Check for JWT in Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: { 
        code: 'NO_TOKEN', 
        message: 'Authentication required',
        redirect: '/admin/login'
      } 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_FINAL);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: { 
          code: 'TOKEN_EXPIRED', 
          message: 'Session expired, please login again',
          redirect: '/admin/login'
        } 
      });
    }
    return res.status(401).json({ 
      success: false,
      error: { 
        code: 'INVALID_TOKEN', 
        message: 'Invalid authentication token',
        redirect: '/admin/login'
      } 
    });
  }
}

// Session-based authentication middleware (backward compatibility)
function requireAuth(req, res, next) {
  // Check for demo mode bypass
  if (process.env.DEMO_MODE === 'true') {
    req.user = { userId: 'demo', role: 'admin', email: 'demo@ridendine.com' };
    return next();
  }

  const sessionId = req.cookies.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ 
      success: false,
      error: { 
        code: 'NO_SESSION', 
        message: 'Authentication required',
        redirect: '/admin/login'
      } 
    });
  }

  const session = getSession(sessionId);
  
  if (!session) {
    return res.status(401).json({ 
      success: false,
      error: { 
        code: 'SESSION_EXPIRED', 
        message: 'Session expired, please login again',
        redirect: '/admin/login'
      } 
    });
  }

  req.user = session;
  next();
}

// Role-based authorization middleware
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: { 
          code: 'NO_AUTH', 
          message: 'Authentication required' 
        } 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: { 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions' 
        } 
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireJWT,
  requireRole,
  JWT_SECRET: JWT_SECRET_FINAL
};
