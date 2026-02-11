const request = require('supertest');
const app = require('../server/index');

describe('Authentication API', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@ridendine.com',
          password: 'Admin0123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('role', 'admin');
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).toHaveProperty('email', 'admin@ridendine.com');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@ridendine.com',
          password: 'WrongPassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should reject missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Admin0123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_INPUT');
    });

    it('should reject missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@ridendine.com'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_INPUT');
    });
  });

  describe('GET /api/auth/session', () => {
    it('should return unauthenticated without session', async () => {
      const response = await request(app)
        .get('/api/auth/session')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('authenticated', false);
      expect(response.body.data).toHaveProperty('demoMode', false);
    });

    it('should return authenticated with valid session', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@ridendine.com',
          password: 'Admin0123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      // Then check session
      const response = await request(app)
        .get('/api/auth/session')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('authenticated', true);
      expect(response.body.data).toHaveProperty('role', 'admin');
      expect(response.body.data).toHaveProperty('demoMode', false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and clear session', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@ridendine.com',
          password: 'Admin0123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      // Then logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('redirect', '/');

      // Verify session is cleared
      const sessionResponse = await request(app)
        .get('/api/auth/session')
        .set('Cookie', cookies);

      expect(sessionResponse.body.data).toHaveProperty('authenticated', false);
    });
  });
});

describe('Protected Routes', () => {
  describe('GET /api/orders', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/orders')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
    });

    it('should allow authenticated requests', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@ridendine.com',
          password: 'Admin0123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      // Then access protected route
      const response = await request(app)
        .get('/api/orders')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orders');
    });
  });
});

describe('Public Routes', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status', 'ok');
      expect(response.body.data).toHaveProperty('demoMode', false);
    });
  });

  describe('GET /api/orders/:orderId/tracking', () => {
    it('should return not found for non-existent order', async () => {
      const response = await request(app)
        .get('/api/orders/INVALID_ORDER/tracking')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code', 'ORDER_NOT_FOUND');
    });
  });
});
