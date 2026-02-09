const express = require('express');
const router = express.Router();
const { createSession, deleteSession, getSession } = require('../services/session');

// Login endpoint
router.post('/login', (req, res) => {
  const { password, role, userId } = req.body;

  if (!role) {
    return res.status(400).json({ error: 'Role is required' });
  }

  // Validate role
  const validRoles = ['admin', 'chef', 'driver', 'customer'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  // DEMO MODE BYPASS - Allow login without password
  if (process.env.DEMO_MODE === 'true') {
    const demoUserId = userId || `demo_${role}`;
    const sessionId = createSession(demoUserId, role);

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
      userId: demoUserId,
      demoMode: true,
      redirect: role === 'admin' ? '/admin' : 
                role === 'chef' ? '/chef-portal/dashboard' : 
                role === 'driver' ? '/driver/jobs' : 
                '/customer'
    });
  }

  // PRODUCTION MODE - Require password
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  // Check password against environment variables (using timing-safe comparison)
  let expectedPassword;
  let authenticatedUserId;
  
  switch (role) {
    case 'admin':
      expectedPassword = process.env.ADMIN_PASSWORD;
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
      // Customer auth would be handled differently in production
      return res.status(400).json({ error: 'Customer login not implemented' });
  }

  // Use timing-safe comparison to prevent timing attacks
  const crypto = require('crypto');
  const passwordBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expectedPassword || '');
  
  // Ensure buffers are same length for timing-safe comparison
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

  res.json({ 
    success: true, 
    role,
    userId: authenticatedUserId,
    demoMode: false,
    redirect: role === 'admin' ? '/admin' : 
              role === 'chef' ? '/chef-portal/dashboard' : 
              '/driver/jobs'
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
  // Check for demo mode
  if (process.env.DEMO_MODE === 'true') {
    return res.json({ 
      authenticated: true, 
      demoMode: true,
      role: 'admin',
      userId: 'demo'
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
