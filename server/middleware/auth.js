const { getSession } = require('../services/session');

// Authentication middleware
function requireAuth(req, res, next) {
  // Check for demo mode bypass
  if (process.env.DEMO_MODE === 'true') {
    req.user = { userId: 'demo', role: 'admin' };
    return next();
  }

  const sessionId = req.cookies.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Authentication required', redirect: '/admin/login.html' });
  }

  const session = getSession(sessionId);
  
  if (!session) {
    return res.status(401).json({ error: 'Session expired', redirect: '/admin/login.html' });
  }

  req.user = session;
  next();
}

// Role-based authorization middleware
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
