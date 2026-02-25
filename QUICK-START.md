# RidenDine - Quick Start Guide

**You're ready to launch! Here's the 5-minute deployment checklist.**

---

## ⚡ Fast Track to Live (After Vercel Upgrade)

### 1. Verify Everything is Ready (2 minutes)

```bash
cd /home/nygmaee/Desktop/ridendine-demo-main
./verify-config.sh
```

**Expected:** All checks pass ✅

---

### 2. Deploy to Vercel (3 minutes)

```bash
./deploy-production.sh
```

**Expected:** Two URLs returned:
- Web: `https://web-[hash].vercel.app`
- Admin: `https://admin-[hash].vercel.app`

---

### 3. Test the Apps (5 minutes)

**Customer Test:**
1. Visit web app URL
2. Click "Sign Up"
3. Enter email/password
4. Browse chefs (demo data loaded)

**Admin Test:**
1. Visit admin app URL
2. Sign in with admin credentials
3. View dashboard

**Expected:** Both apps load without errors ✅

---

### 4. Share with Hamilton Customers

Send them the web app URL and tell them to sign up!

---

## 📋 If You Need More Details

- **Full deployment guide:** [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)
- **Stripe setup:** [STRIPE-SETUP-GUIDE.md](STRIPE-SETUP-GUIDE.md)
- **Environment variables:** [.env.production.template](.env.production.template)

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Vercel deployment limit reached" | Upgrade account at https://vercel.com/account/billing |
| "Module not found" errors | Run `pnpm install --frozen-lockfile && pnpm build:shared` |
| "Can't connect to Supabase" | Check environment variables in Vercel dashboard |
| "Stripe payment fails" | See [STRIPE-SETUP-GUIDE.md](STRIPE-SETUP-GUIDE.md) |

---

## ✅ Pre-Launch Checklist

Before going live:

- [ ] Vercel account upgraded
- [ ] Both apps deploy successfully
- [ ] Supabase database schema executed
- [ ] Environment variables set in Vercel
- [ ] Health check passes: `curl https://your-app.vercel.app/api/health`
- [ ] Test customer signup works
- [ ] Demo chefs visible on homepage

**All checked?** You're live! 🚀

---

## 🎯 What Happens After Launch

**First Hour:**
- Customers in Hamilton can sign up
- Browse demo chefs and menus
- Create accounts

**Day 1:**
- Real chefs apply via "Become a Chef"
- Admin approves chefs
- First real menus go live

**Week 1:**
- First real orders placed
- Stripe payments flowing
- Platform fees collecting

**Month 1:**
- Growing customer base
- Multiple active chefs
- Regular orders flowing
- Business is operational! 💰

---

## 📞 Need Help?

1. Check [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) for detailed steps
2. Review logs in Vercel dashboard
3. Check Supabase logs for database errors
4. Contact support if needed

---

**Status:** ✅ Ready for deployment
**Next Action:** Upgrade Vercel → Run `./deploy-production.sh` → Go live!
