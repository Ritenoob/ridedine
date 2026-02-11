const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { createSession, deleteSession, getSession } = require('../services/session');

// Login endpoint - production-ready authentication
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Email and password are required'
        }
      });
    }

    // Check admin credentials from environment
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ridendine.com';
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    
    // If email matches admin email
    if (email === adminEmail) {
      let isValid = false;
      
      // If hash is configured, verify with bcrypt
      if (adminPasswordHash) {
        isValid = await bcrypt.compare(password, adminPasswordHash);
      } 
      // Fallback to plain text password for development (NOT recommended for production)
      else if (process.env.ADMIN_PASSWORD) {
        isValid = password === process.env.ADMIN_PASSWORD;
        console.warn('⚠️  Using plain text ADMIN_PASSWORD. Set ADMIN_PASSWORD_HASH for production!');
      }
      
      if (!isValid) {
        // Use timing-safe delay to prevent timing attacks
        await new Promise(resolve => setTimeout(resolve, 1000));
        return res.status(401).json({ 
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      // Create session
      const sessionId = createSession('admin', 'admin', email);

      // Set cookie
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      return res.json({ 
        success: true,
        data: {
          role: 'admin',
          userId: 'admin',
          email: email,
          redirect: '/admin'
        }
      });
    }

    // Invalid credentials (timing-safe)
    await new Promise(resolve => setTimeout(resolve, 1000));
    return res.status(401).json({ 
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'An error occurred during login'
      }
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
  const sessionId = req.cookies.sessionId;
  
  if (!sessionId) {
    return res.json({ 
      success: true,
      data: {
        authenticated: false,
        demoMode: false
      }
    });
  }

  const session = getSession(sessionId);
  
  if (!session) {
    return res.json({ 
      success: true,
      data: {
        authenticated: false,
        demoMode: false
      }
    });
  }

  res.json({ 
    success: true,
    data: {
      authenticated: true, 
      demoMode: false,
      role: session.role,
      userId: session.userId,
      email: session.email
    }
  });
});

module.exports = router;
