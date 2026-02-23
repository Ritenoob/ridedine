#!/usr/bin/env node

/**
 * Password Hash Generator for RIDENDINE
 * 
 * Usage:
 *   node scripts/generate-password-hash.js <password>
 * 
 * Example:
 *   node scripts/generate-password-hash.js MySecurePassword123
 * 
 * This will generate a bcrypt hash that you can use in your .env file:
 *   ADMIN_PASSWORD_HASH=<generated_hash>
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('❌ Error: Please provide a password as an argument');
  console.log('\nUsage: node scripts/generate-password-hash.js <password>');
  console.log('Example: node scripts/generate-password-hash.js MySecurePassword123');
  process.exit(1);
}

if (password.length < 8) {
  console.warn('⚠️  Warning: Password should be at least 8 characters long for security');
}

console.log('Generating password hash...\n');

// Use async/await for cleaner error handling
(async () => {
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log('✅ Password hash generated successfully!\n');
    console.log('Add this to your .env file:');
    console.log('━'.repeat(60));
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log('━'.repeat(60));
    console.log('\n💡 Remember to keep this hash secure and never commit it to version control!');
  } catch (error) {
    console.error('❌ Error generating hash:', error.message);
    process.exit(1);
  }
})();
