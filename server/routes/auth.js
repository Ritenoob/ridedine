const express = require('express');
const router = express.Router();
const { createSession, deleteSession, getSession } = require('../services/session');
const dataService = require('../services/dataService');

// Demo mode constants
const DEFAULT_DEMO_ROLE = 'admin';
const DEFAULT_DEMO_USER_ID = 'demo';

// Login endpoint
router.post('/login', async (req, res) => {
  const { password, role, userId, email } = req.body;

  // DEMO MODE BYPASS - Allow login without password or with simple role selection
  if (process.env.DEMO_MODE === 'true') {
    // Support email-based login or role-based login
    let loginRole = role || 'admin';
    let loginUserId = userId || 'demo';
    let loginEmail = email;

    // If email is provided, check if it's our admin
    if (email === 'sean@seanfinlay.ca') {
      loginRole = 'admin';
      loginUserId = 'admin_sean';
      loginEmail = email;
    } else if (email) {
      // Try to find user by email in database
      const user = await dataService.findUserByEmail(email);
      if (user) {
        loginRole = user.role;
        loginUserId = user.id.toString();
        loginEmail = user.email;
      }
    }

    // Validate role
    const validRoles = ['admin', 'chef', 'driver', 'customer'];
    if (!validRoles.includes(loginRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

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
      role: loginRole,
      userId: loginUserId,
      email: loginEmail,
      demoMode: true,
      redirect: loginRole === 'admin' ? '/admin' : 
                loginRole === 'chef' ? '/chef-portal/dashboard' : 
                loginRole === 'driver' ? '/driver/jobs' : 
                '/customer'
    });
  }

  // PRODUCTION MODE - Require email and password
  if (!email) {
    // Fallback to role-based auth for backwards compatibility
    if (!role || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check password against environment variables (using timing-safe comparison)
    let expectedPassword;
    let authenticatedUserId;
    
    const validRoles = ['admin', 'chef', 'driver', 'customer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    switch (role) {
      case 'admin':
        expectedPassword = process.env.ADMIN_PASSWORD || 'Admin0123';
        authenticatedUserId = 'admin';
        break;
      case 'chef':
        expectedPassword = process.env.CHEF_PASSWORD;
        authenticatedUserId = 'chef';
        break;
      case 'driver':
        expectedPassword = process.env.DRIVER_PASSWORD;
        authenticatedUserId = 'driver';
        break;
      case 'customer':
        return res.status(400).json({ error: 'Customer login requires email' });
    }

    // Use timing-safe comparison to prevent timing attacks
    const crypto = require('crypto');
    const passwordBuffer = Buffer.from(password);
    const expectedBuffer = Buffer.from(expectedPassword || '');
    
    if (passwordBuffer.length !== expectedBuffer.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!crypto.timingSafeEqual(passwordBuffer, expectedBuffer)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const sessionId = createSession(authenticatedUserId, role);

    // Set cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.json({ 
      success: true, 
      role,
      userId: authenticatedUserId,
      demoMode: false,
      redirect: role === 'admin' ? '/admin' : 
                role === 'chef' ? '/chef-portal/dashboard' : 
                '/driver/jobs'
    });
  }

  // Email-based authentication
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  // Check for master admin credentials
  if (email === 'sean@seanfinlay.ca' && password === 'Admin0123') {
    const sessionId = createSession('admin_sean', 'admin', email);

    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      role: 'admin',
      userId: 'admin_sean',
      email: email,
      demoMode: false,
      redirect: '/admin'
    });
  }

  // Check database for user
  const user = await dataService.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // In demo mode or without hashed password, skip password check
  // In production, you would verify against hashed_password
  if (user.hashed_password) {
    // TODO: Implement proper password hashing with bcrypt
    return res.status(401).json({ error: 'Password authentication not yet implemented' });
  }

  // Create session for database user
  const sessionId = createSession(user.id.toString(), user.role, user.email);

  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });

  res.json({
    success: true,
    role: user.role,
    userId: user.id.toString(),
    email: user.email,
    demoMode: false,
    redirect: user.role === 'admin' ? '/admin' : 
              user.role === 'chef' ? '/chef-portal/dashboard' : 
              user.role === 'driver' ? '/driver/jobs' :
              '/customer'
  });
});

// Logout endpoint
router.post('/logout', (req, res) => {
  const sessionId = req.cookies.sessionId;
  
  if (sessionId) {
    deleteSession(sessionId);
  }

  res.clearCookie('sessionId');
  res.json({ success: true, redirect: '/' });
});

// Check session endpoint
router.get('/session', (req, res) => {
  // Check for demo mode - allow any role access
  if (process.env.DEMO_MODE === 'true') {
    // Check if there's a session cookie to get role preference
    const sessionId = req.cookies.sessionId;
    let role = DEFAULT_DEMO_ROLE;
    let userId = DEFAULT_DEMO_USER_ID;
    
    if (sessionId) {
      const session = getSession(sessionId);
      if (session && session.role) {
        role = session.role;
        userId = session.userId;
      }
    }
    
    return res.json({ 
      authenticated: true, 
      demoMode: true,
      role: role,
      userId: userId
    });
  }

  const sessionId = req.cookies.sessionId;
  
  if (!sessionId) {
    return res.json({ authenticated: false });
  }

  const session = getSession(sessionId);
  
  if (!session) {
    return res.json({ authenticated: false });
  }

  res.json({ 
    authenticated: true, 
    demoMode: false,
    role: session.role,
    userId: session.userId
  });
});

module.exports = router;
