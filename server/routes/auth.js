const express = require('express');
const router = express.Router();
const { createSession, deleteSession, getSession } = require('../services/session');

// Login endpoint
router.post('/login', (req, res) => {
  const { password, role } = req.body;

  if (!password || !role) {
    return res.status(400).json({ error: 'Password and role are required' });
  }

  // Validate role
  const validRoles = ['admin', 'chef', 'driver'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  // Check password against environment variables
  let expectedPassword;
  let userId;
  
  switch (role) {
    case 'admin':
      expectedPassword = process.env.ADMIN_PASSWORD;
      userId = 'admin';
      break;
    case 'chef':
      expectedPassword = process.env.CHEF_PASSWORD;
      userId = 'chef';
      break;
    case 'driver':
      expectedPassword = process.env.DRIVER_PASSWORD;
      userId = 'driver';
      break;
  }

  if (password !== expectedPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Create session
  const sessionId = createSession(userId, role);

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
    userId,
    redirect: role === 'admin' ? '/admin' : role === 'chef' ? '/chef-portal' : '/driver'
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
