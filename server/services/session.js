const crypto = require('crypto');

// In-memory session store (replace with Redis/DB in production)
const sessions = new Map();

// Session duration: 24 hours
const SESSION_DURATION = 24 * 60 * 60 * 1000;

function createSession(userId, role, email = null) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_DURATION;
  
  sessions.set(sessionId, {
    userId,
    role,
    email,
    createdAt: Date.now(),
    expiresAt
  });
  
  return sessionId;
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  
  return session;
}

function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(sessionId);
    }
  }
}

// Cleanup expired sessions every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = {
  createSession,
  getSession,
  deleteSession
};
