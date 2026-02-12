const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { createSession, deleteSession, getSession } = require('../services/session');

function getRoleCredentials(role) {
  const normalizedRole = String(role || 'admin').toLowerCase();

  const roleConfig = {
    admin: {
      role: 'admin',
      userId: 'admin',
      defaultEmail: 'admin@ridendine.com',
      defaultPassword: process.env.NODE_ENV === 'production' ? null : 'Admin0123',
      emailEnv: 'ADMIN_EMAIL',
      passwordHashEnv: 'ADMIN_PASSWORD_HASH',
      passwordEnv: 'ADMIN_PASSWORD',
      redirect: '/admin'
    },
    chef: {
      role: 'chef',
      userId: 'chef_001',
      defaultEmail: 'chef@ridendine.com',
      defaultPassword: process.env.NODE_ENV === 'production' ? null : 'chef123',
      emailEnv: 'CHEF_EMAIL',
      passwordHashEnv: 'CHEF_PASSWORD_HASH',
      passwordEnv: 'CHEF_PASSWORD',
      redirect: '/chef-portal/dashboard'
    },
    driver: {
      role: 'driver',
      userId: 'driver_001',
      defaultEmail: 'driver@ridendine.com',
      defaultPassword: process.env.NODE_ENV === 'production' ? null : 'driver123',
      emailEnv: 'DRIVER_EMAIL',
      passwordHashEnv: 'DRIVER_PASSWORD_HASH',
      passwordEnv: 'DRIVER_PASSWORD',
      redirect: '/driver'
    }
  };

  return roleConfig[normalizedRole] || roleConfig.admin;
}

// Login endpoint - production-ready authentication
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

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

    const credentials = getRoleCredentials(role);
    const configuredEmail = process.env[credentials.emailEnv] || credentials.defaultEmail;
    const configuredPasswordHash = process.env[credentials.passwordHashEnv];
    const configuredPassword = process.env[credentials.passwordEnv] || credentials.defaultPassword;

    if (email === configuredEmail) {
      let isValid = false;

      if (configuredPasswordHash) {
        isValid = await bcrypt.compare(password, configuredPasswordHash);
      } else if (configuredPassword) {
        isValid = password === configuredPassword;
        if (process.env.NODE_ENV === 'production') {
          console.warn(`⚠️  ${credentials.passwordEnv} is plain text. Use ${credentials.passwordHashEnv} for production.`);
        }
      }

      if (!isValid) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      const sessionId = createSession(credentials.userId, credentials.role, email);

      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        data: {
          role: credentials.role,
          userId: credentials.userId,
          email,
          redirect: credentials.redirect
        }
      });
    }

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
