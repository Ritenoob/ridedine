# Deploy RidenDine to Production

## Prerequisites

1. **GitHub Account** (you already have the repo pushed)
2. **Supabase Account** (create at https://supabase.com)
3. **Vercel Account** (create at https://vercel.com - sign in with GitHub)

---

## Step 1: Set Up Supabase (Backend Database)

1. Go to https://supabase.com
2. Sign in/Sign up (free)
3. Click "New Project"
4. Fill in:
   - Name: `ridendine`
   - Database Password: (create strong password - save it!)
   - Region: Choose closest to your location
5. Click "Create new project" (wait 2-3 minutes)

### Get Your Supabase Credentials

After project is created:

1. Go to **Project Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (scroll down, click "Reveal", copy)

### Apply Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New query"
3. Follow `SETUP_SUPABASE.md` to apply all migrations (CLI recommended)
4. Click "Run" (bottom right)
5. You should see "Success. No rows returned"

---

## Step 2: Deploy to Vercel

### Deploy Web App (Customer-facing)

1. Go to https://vercel.com (sign in with GitHub)
2. Click "Add New..." → "Project"
3. Import your `ridendine-demo` repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: *(leave blank — Vercel Next.js builder handles this)*
   - **Output Directory**: `.next`
   - **Install Command**: *(leave blank — Vercel runs pnpm from repo root)*

5. Add Environment Variables (click "Environment Variables"):
   ```
    NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
    NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
   ```

6. Click "Deploy"

### Deploy Admin App

1. In Vercel, click "Add New..." → "Project" again
2. Import the **same** repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/admin`
   - **Build Command**: *(leave blank — Vercel Next.js builder handles this)*
   - **Output Directory**: `.next`
   - **Install Command**: *(leave blank — Vercel runs pnpm from repo root)*

4. Add Environment Variables:
   ```
    NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
    NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

5. Click "Deploy"

---

## Step 3: Create Test Data

After both apps are deployed:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this SQL to create a test chef with dishes:

```sql
-- You'll need to create auth users first through Supabase Auth UI
-- Go to Authentication → Users → Add User manually

-- After creating users, get their IDs and insert profiles
-- Replace the UUIDs below with actual user IDs from auth.users

INSERT INTO profiles (id, role, name, email, phone) VALUES
  ('CHEF_USER_ID_HERE', 'chef', 'Chef Maria', 'chef@ridendine.demo', '+1-555-0101'),
  ('ADMIN_USER_ID_HERE', 'admin', 'Admin User', 'admin@ridendine.demo', '+1-555-0001');

-- Create chef business
INSERT INTO chefs (profile_id, business_name, cuisine_type, bio, status, rating) VALUES
  ('CHEF_USER_ID_HERE', 'Maria''s Kitchen', 'Italian', 'Authentic Italian cuisine', 'approved', 4.8);

-- Get chef ID and create dishes
INSERT INTO dishes (chef_id, name, description, price, cuisine_type, available)
SELECT id, 'Margherita Pizza', 'Fresh mozzarella, basil, San Marzano tomatoes', 14.99, 'Italian', true FROM chefs WHERE profile_id = 'CHEF_USER_ID_HERE'
UNION ALL
SELECT id, 'Pasta Carbonara', 'Classic Roman pasta', 16.99, 'Italian', true FROM chefs WHERE profile_id = 'CHEF_USER_ID_HERE';
```

---

## Step 4: Test Your Deployment

1. **Web App**: Visit your Vercel URL (e.g., `https://ridendine-web.vercel.app`)
2. **Admin App**: Visit your admin Vercel URL (e.g., `https://ridendine-admin.vercel.app`)
3. Sign up as a customer
4. Browse chefs and place an order
5. Log in to admin panel and view orders

---

## Your Live URLs

After deployment, you'll have:

- **Customer App**: `https://your-web-app.vercel.app`
- **Admin Dashboard**: `https://your-admin-app.vercel.app`
- **Supabase Studio**: `https://app.supabase.com/project/your-project-id`

Share the customer app URL with anyone to let them sign up and order!

---

## Troubleshooting

### Build fails with "Cannot find module"
- Ensure Vercel Root Directory is set correctly (`apps/web` or `apps/admin`).
- Leave Install/Build commands blank so Vercel runs `pnpm install` from repo root.

### "TypeError: Cannot read properties of undefined"
- Check that all environment variables are set correctly
- Make sure NEXT_PUBLIC_ prefix is on public variables

### Database errors
- Verify you ran the schema SQL in Supabase SQL Editor
- Check that service_role key is set (not just anon key)

### Users can't sign up
- Go to Supabase → Authentication → Providers
- Make sure "Email" provider is enabled
- Disable "Confirm email" for easier testing (or set up email provider)
