const jwt = require('jsonwebtoken');
const { getSession } = require('../services/session');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

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
    const decoded = jwt.verify(token, JWT_SECRET);
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
  JWT_SECRET
};
