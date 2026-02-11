const { getSession } = require('../services/session');

// Authentication middleware
function requireAuth(req, res, next) {
  const sessionId = req.cookies.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ 
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required'
      },
      redirect: '/admin/login.html' 
    });
  }

  const session = getSession(sessionId);
  
  if (!session) {
    return res.status(401).json({ 
      success: false,
      error: {
        code: 'SESSION_EXPIRED',
        message: 'Session expired'
      },
      redirect: '/admin/login.html' 
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
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
