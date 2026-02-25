# Local Development Setup

## Prerequisites

1. **Install Node.js 20+**
   ```bash
   node --version  # Should be >= 18.0.0
   ```

2. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

3. **Install Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

## Setup Steps

### 1. Clone and Install

```bash
git clone https://github.com/SeanCFAFinlay/ridendine-demo.git
cd ridendine-demo
pnpm install
```

### 2. Setup Supabase

```bash
# Start local Supabase instance
cd backend/supabase
supabase init  # If not already initialized
supabase start

# Note the API URL and anon key from output
# Apply migrations
supabase db reset
```

### 3. Configure Environment Variables

**Mobile App:**
```bash
cd apps/mobile
cp .env.example .env
# Edit .env with your Supabase URL and anon key
```

**Admin Dashboard:**
```bash
cd apps/admin
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key
```

### 4. Build Shared Package

```bash
pnpm --filter @home-chef/shared build
```

### 5. Start Development Servers

**Option A: Mobile App**
```bash
cd apps/mobile
npm start
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Or scan QR code with Expo Go app
```

**Option B: Admin Dashboard**
```bash
pnpm --filter @home-chef/admin dev
# Open http://localhost:3000
```

## Testing

### Test Mobile App
1. Sign up with test email
2. Choose role (customer/chef)
3. Navigate through role-specific screens

### Test Admin Dashboard
1. Create admin user in Supabase
2. Sign in at `/login`
3. View dashboard stats

### Test Payments (with Stripe)
1. Get Stripe test keys from dashboard
2. Add to Edge Function secrets
3. Use test card: 4242 4242 4242 4242

## Troubleshooting

### Supabase not starting
```bash
supabase stop
supabase start
```

### Can't connect to Supabase
- Check URL and key in .env
- Verify Supabase is running: `supabase status`

### Mobile app not loading
- Clear Expo cache: `expo start -c`
- Delete node_modules and reinstall

### TypeScript errors in shared package
```bash
cd packages/shared
npm run build
```

## Development Workflow

1. Make changes in appropriate workspace
2. Test locally
3. Build shared package if modified
4. Commit changes
5. Push to GitHub

## Useful Commands

```bash
# Install in specific workspace
pnpm add <package> --filter @home-chef/mobile

# Run script in workspace
pnpm --filter @home-chef/admin <script>

# Clean all node_modules
pnpm run clean
```
