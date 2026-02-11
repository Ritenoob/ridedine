const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createSession, deleteSession, getSession } = require('../services/session');
const dataService = require('../services/dataService');
const { JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Demo mode constants
const DEFAULT_DEMO_ROLE = 'admin';
const DEFAULT_DEMO_USER_ID = 'demo';

// Helper: Generate JWT token
function generateToken(userId, email, role) {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Login endpoint - supports both JWT and session-based auth
router.post('/login', async (req, res) => {
  const { password, role, userId, email } = req.body;

  // DEMO MODE BYPASS - Allow login without password or with simple role selection
  if (process.env.DEMO_MODE === 'true') {
    // Support email-based login or role-based login
    let loginRole = role || 'admin';
    let loginUserId = userId || 'demo';
    let loginEmail = email || 'demo@ridendine.com';

    // If email is provided, try to find user in database
    if (email) {
      // First check environment-configured admin email
      const configuredAdminEmail = process.env.ADMIN_EMAIL || 'admin@ridendine.com';
      if (email === configuredAdminEmail) {
        loginRole = 'admin';
        loginUserId = 'admin_demo';
        loginEmail = email;
      } else {
        // Try to find user by email in database
        const user = await dataService.findUserByEmail(email);
        if (user) {
          loginRole = user.role;
          loginUserId = user.id.toString();
          loginEmail = user.email;
        }
      }
    }

    // Validate role
    const validRoles = ['admin', 'chef', 'driver', 'customer'];
    if (!validRoles.includes(loginRole)) {
      return res.status(400).json({ 
        success: false,
        error: { code: 'INVALID_ROLE', message: 'Invalid role' } 
      });
    }

    // Generate JWT token
    const token = generateToken(loginUserId, loginEmail, loginRole);

    // Also create session for backward compatibility
    const sessionId = createSession(loginUserId, loginRole, loginEmail);

    // Set cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.json({ 
      success: true, 
      data: {
        token,
        user: {
          userId: loginUserId,
          email: loginEmail,
          role: loginRole
        },
        demoMode: true,
        redirect: loginRole === 'admin' ? '/admin' : 
                  loginRole === 'chef' ? '/chef-portal/dashboard' : 
                  loginRole === 'driver' ? '/driver/jobs' : 
                  '/customer'
      }
    });
  }

  // PRODUCTION MODE - Require email and password with bcrypt verification
  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      error: { code: 'MISSING_CREDENTIALS', message: 'Email and password are required' } 
    });
  }

  try {
    // Check for admin credentials using environment variables
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ridendine.com';
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

    if (email === ADMIN_EMAIL && ADMIN_PASSWORD_HASH) {
      // Verify password with bcrypt
      const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      
      if (!isValid) {
        return res.status(401).json({ 
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } 
        });
      }

      // Generate JWT token
      const token = generateToken('admin_1', email, 'admin');

      // Also create session for backward compatibility
      const sessionId = createSession('admin_1', 'admin', email);

      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        data: {
          token,
          user: {
            userId: 'admin_1',
            email,
            role: 'admin'
          },
          redirect: '/admin'
        }
      });
    }

    // Fallback: Check database for user (if database is available)
    const user = await dataService.findUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } 
      });
    }

    // Verify password with bcrypt if hash exists
    if (user.hashed_password) {
      const isValid = await bcrypt.compare(password, user.hashed_password);
      
      if (!isValid) {
        return res.status(401).json({ 
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } 
        });
      }
    } else {
      // No hashed password in database - reject
      return res.status(401).json({ 
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } 
      });
    }

    // Generate JWT token
    const token = generateToken(user.id.toString(), user.email, user.role);

    // Create session
    const sessionId = createSession(user.id.toString(), user.role, user.email);

    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          userId: user.id.toString(),
          email: user.email,
          role: user.role
        },
        redirect: user.role === 'admin' ? '/admin' : 
                  user.role === 'chef' ? '/chef-portal/dashboard' : 
                  user.role === 'driver' ? '/driver/jobs' :
                  '/customer'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Login failed. Please try again.' } 
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  const sessionId = req.cookies.sessionId;
  
  if (sessionId) {
    deleteSession(sessionId);
  }

  res.clearCookie('sessionId');
  res.json({ 
    success: true, 
    data: { redirect: '/' } 
  });
});

// Check session endpoint
router.get('/session', (req, res) => {
  // Check for demo mode - allow any role access
  if (process.env.DEMO_MODE === 'true') {
    // Check if there's a session cookie to get role preference
    const sessionId = req.cookies.sessionId;
    let role = DEFAULT_DEMO_ROLE;
    let userId = DEFAULT_DEMO_USER_ID;
    let email = 'demo@ridendine.com';
    
    if (sessionId) {
      const session = getSession(sessionId);
      if (session && session.role) {
        role = session.role;
        userId = session.userId;
        email = session.email || 'demo@ridendine.com';
      }
    }
    
    return res.json({ 
      success: true,
      data: {
        authenticated: true, 
        demoMode: true,
        user: {
          userId,
          email,
          role
        }
      }
    });
  }

  const sessionId = req.cookies.sessionId;
  
  if (!sessionId) {
    return res.json({ 
      success: true,
      data: { authenticated: false } 
    });
  }

  const session = getSession(sessionId);
  
  if (!session) {
    return res.json({ 
      success: true,
      data: { authenticated: false } 
    });
  }

  res.json({ 
    success: true,
    data: {
      authenticated: true, 
      demoMode: false,
      user: {
        userId: session.userId,
        email: session.email,
        role: session.role
      }
    }
  });
});

module.exports = router;
