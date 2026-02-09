# Security Policy

## Security Measures Implemented

### Authentication & Authorization
- ✅ Session-based authentication with httpOnly cookies
- ✅ Role-based access control (admin/chef/driver)
- ✅ Timing-safe password comparison to prevent timing attacks
- ✅ Protected routes with auth guards
- ✅ DEMO_MODE bypass for development (disable in production)

### Rate Limiting
- ✅ General API rate limiting: 100 requests per 15 minutes per IP
- ✅ Authentication rate limiting: 5 login attempts per 15 minutes per IP
- ✅ Failed authentication attempts don't count against limit

### Data Protection
- ✅ Chef addresses redacted from customer-facing APIs
- ✅ Order tracking API returns only necessary customer data
- ✅ Session secrets stored in environment variables
- ✅ Sensitive data never logged in production

### Payment Security
- ✅ Stripe Checkout integration (PCI-compliant)
- ✅ Webhook signature verification
- ✅ No payment data stored on server
- ✅ Server-side payment validation

## Known Limitations (Demo/MVP)

### CSRF Protection
⚠️ **Status:** Not implemented  
**Impact:** Low (session-based attacks)  
**Mitigation for Production:**
- Add CSRF token middleware (e.g., `csurf`)
- Use SameSite cookie attribute
- Implement double-submit cookie pattern

### Session Storage
⚠️ **Status:** In-memory (will reset on server restart)  
**Impact:** Sessions lost on deployment/restart  
**Mitigation for Production:**
- Use Redis or database for session storage
- Implement session persistence
- Add session timeout/renewal

### Order Storage
⚠️ **Status:** In-memory (will reset on server restart)  
**Impact:** Orders lost on deployment/restart  
**Mitigation for Production:**
- Implement database (PostgreSQL, MongoDB, etc.)
- Add order persistence layer
- Implement proper backup strategy

### Input Validation
⚠️ **Status:** Basic validation only  
**Impact:** Potential injection attacks  
**Mitigation for Production:**
- Add comprehensive input validation (e.g., `joi`, `express-validator`)
- Sanitize all user inputs
- Implement strict type checking

### HTTPS
⚠️ **Status:** Not enforced in development  
**Impact:** Man-in-the-middle attacks  
**Mitigation for Production:**
- Always use HTTPS in production
- Set `secure: true` for cookies
- Implement HSTS headers

### Static File Rate Limiting
⚠️ **Status:** Static files not rate-limited  
**Impact:** Potential for abuse of static file serving  
**Mitigation for Production:**
- Use CDN for static file serving (Cloudflare, AWS CloudFront)
- Implement rate limiting for static routes if self-hosted
- Monitor file access patterns for abuse

### Secret Management
⚠️ **Status:** Environment variables  
**Impact:** Secrets in plain text on server  
**Mitigation for Production:**
- Use secret management service (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly
- Never commit secrets to version control

## Security Best Practices for Deployment

### Production Checklist

- [ ] Set `DEMO_MODE=false`
- [ ] Use strong, unique passwords for all roles
- [ ] Enable HTTPS/TLS
- [ ] Set `NODE_ENV=production`
- [ ] Implement database for session/order storage
- [ ] Add CSRF protection
- [ ] Configure proper CORS policies
- [ ] Set up monitoring and logging
- [ ] Implement backup strategy
- [ ] Add API documentation and versioning
- [ ] Set up security headers (Helmet.js)
- [ ] Configure rate limiting based on traffic
- [ ] Add request logging and audit trail
- [ ] Implement proper error handling (don't expose stack traces)
- [ ] Set up automated security scanning

### Environment Variables (Production)

```bash
# Security
DEMO_MODE=false
SESSION_SECRET=<generate_long_random_string>
ADMIN_PASSWORD=<strong_unique_password>
CHEF_PASSWORD=<strong_unique_password>
DRIVER_PASSWORD=<strong_unique_password>

# Stripe (Production Keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Integrations
COOCO_WEBHOOK_SECRET=<secure_random_string>
MEALBRIDGE_API_KEY=<provided_by_mealbridge>
MEALBRIDGE_BASE_URL=https://api.mealbridge.com

# Server
PORT=443
NODE_ENV=production
```

## Reporting Security Issues

If you discover a security vulnerability, please email security@ridendine.com (or create a private GitHub security advisory). Do not create public issues for security vulnerabilities.

## Security Updates

- Regular dependency updates via npm audit
- Monitor GitHub security advisories
- Subscribe to security mailing lists for Node.js and Express

## Compliance Notes

- **PCI DSS:** Payment handling delegated to Stripe (PCI-compliant)
- **GDPR:** Customer data minimization implemented
- **Data Retention:** Orders stored indefinitely (implement retention policy for production)

## Last Updated

This security policy was last updated on 2024-02-09.
