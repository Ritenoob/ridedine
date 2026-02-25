# Demo Fallback Procedures - Quick Reference

**Print this and keep it handy during demo**

---

## 🚨 Emergency Contacts

**Supabase Status:** https://status.supabase.com/
**Vercel Status:** https://www.vercel-status.com/
**Stripe Status:** https://status.stripe.com/
**Google Maps Status:** https://status.cloud.google.com/

---

## ⚡ Quick Health Checks (Run 5 min before demo)

```bash
# 1. Check Supabase connection
curl https://YOUR_PROJECT.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY" | grep -q "message" && echo "✅ Supabase OK" || echo "❌ Supabase DOWN"

# 2. Check web app
curl -I https://ridendine-web.vercel.app | grep -q "200 OK" && echo "✅ Web OK" || echo "❌ Web DOWN"

# 3. Check admin app
curl -I https://ridendine-admin.vercel.app | grep -q "200 OK" && echo "✅ Admin OK" || echo "❌ Admin DOWN"

# 4. Check Google Maps (route API)
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/get_route \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"coordinates":[{"lat":40.7128,"lng":-74.0060},{"lat":40.7580,"lng":-73.9855}]}' \
  | grep -q "distanceMeters" && echo "✅ Maps OK" || echo "❌ Maps DOWN"

# 5. Check Stripe
curl https://api.stripe.com/v1/payment_intents \
  -u YOUR_STRIPE_KEY: | grep -q "data" && echo "✅ Stripe OK" || echo "❌ Stripe DOWN"
```

**If all 5 checks pass → proceed with live demo**
**If any check fails → see fallback procedures below**

---

## 🔧 Fallback Procedures by Failure Type

### 1. Google Maps API Failure

**Symptoms:**
- Route calculations fail
- Geocoding fails
- Map tiles don't load

**Automatic Fallback:** ✅ Already implemented
- System falls back to OSRM (open-source)
- No action needed from you

**What to Say:**
> "Notice how the system seamlessly switched to our backup routing provider, OSRM. This is exactly why we built multi-provider fallback—if Google Maps has an issue, we keep working."

**Manual Override (if needed):**
```bash
# Force OSRM for all routes
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/get_route \
  -d '{"coordinates":[...], "provider":"osrm"}'
```

---

### 2. Stripe Payment Processing Slow/Failed

**Symptoms:**
- Checkout hangs after clicking "Pay"
- Payment confirmation takes > 10 seconds
- Webhook not received

**Immediate Action:**
1. Use pre-authorized test card: `4242 4242 4242 4242`
2. If still hanging after 15 seconds, close checkout and show alternative flow

**What to Say:**
> "In production, the payment would process asynchronously in the background. Let me show you the order confirmation screen that the customer would see..."

**Backup Demo Path:**
- Show pre-placed order in admin dashboard
- Skip checkout entirely, go straight to chef receiving order
- Mention: "Payment was pre-authorized when they placed the order"

**Nuclear Option:**
- Use screenshot of successful Stripe checkout from `docs/demo-screenshots/stripe-success.png`

---

### 3. Database Query Slow/Timeout

**Symptoms:**
- Chef list loads slowly (> 5 seconds)
- Driver assignment fails
- Admin dashboard empty or spinning

**Immediate Action:**
```bash
# 1. Check database connection
psql $DATABASE_URL -c "SELECT 1;" # Should return instantly

# 2. Check for long-running queries
psql $DATABASE_URL -c "
  SELECT pid, query, state, age(clock_timestamp(), query_start)
  FROM pg_stat_activity
  WHERE state != 'idle'
  ORDER BY query_start ASC;
"

# 3. Kill slow queries (last resort)
psql $DATABASE_URL -c "SELECT pg_terminate_backend(PID);" # Replace PID
```

**What to Say:**
> "We're seeing some network latency. Let me use our cached demo data..."

**Backup Demo Path:**
- Use pre-seeded demo accounts (see DEMO_SEED_DATA.sql)
- Show screenshots from `docs/demo-screenshots/`
- Refresh page to clear stuck queries

**Nuclear Option:**
- Switch to pre-recorded video: `docs/demo-video-backup.mp4`

---

### 4. Real-Time GPS Tracking Not Updating

**Symptoms:**
- Driver marker doesn't move on customer map
- Location shows as "null" or outdated
- WebSocket connection failed

**Immediate Action:**
1. Check Supabase Realtime status
2. Refresh customer app
3. Verify driver app is sending location updates

**What to Say:**
> "The driver's GPS location updates every 5 seconds. Let me jump ahead to show the delivery confirmation..."

**Backup Demo Path:**
- Show static route polyline (still useful for demo)
- Skip to "Mark Delivered" screen
- Mention: "In production, you'd see the marker moving in real-time"

**Manual Test:**
```bash
# Test realtime broadcast
psql $DATABASE_URL -c "
  SELECT * FROM driver_locations
  WHERE driver_id = 'DEMO_DRIVER_ID'
  ORDER BY created_at DESC LIMIT 1;
"
# Should show recent timestamp (< 10 seconds old)
```

---

### 5. Images Not Loading

**Symptoms:**
- Chef photos show broken image icon
- Dish images don't load
- Spinner never resolves

**Immediate Action:**
1. Check Supabase Storage status
2. Verify CDN is responding

```bash
# Test image URL
curl -I https://YOUR_PROJECT.supabase.co/storage/v1/object/public/chef-photos/maria.jpg
# Should return 200 OK in < 500ms
```

**What to Say:**
> "We're seeing some CDN latency. The platform works fine without images, but normally you'd see beautiful food photos here..."

**Backup Demo Path:**
- Continue demo without images (text descriptions still work)
- Show screenshots with images from `docs/demo-screenshots/`

**Manual Fix:**
- Refresh page to clear cached failures
- Use fallback placeholder images (already in app bundle)

---

### 6. Mobile App Crashes or Won't Load

**Symptoms:**
- Expo app crashes on launch
- White screen of death
- "Unable to load bundle" error

**Immediate Action:**
1. Force-quit Expo Go app
2. Reopen and shake for dev menu
3. Tap "Reload"

**If Reload Fails:**
```bash
# 1. Check Metro bundler is running
npx expo start --clear

# 2. Restart Expo Go on phone
# 3. Re-scan QR code
```

**What to Say:**
> "We're having a connection issue with the development build. Let me show you the web version, which has identical functionality..."

**Backup Demo Path:**
- Switch to web app (same React codebase, same features)
- Use browser DevTools responsive mode to simulate mobile screen
- Show pre-recorded mobile video from `docs/demo-video-backup.mp4`

---

## 🎬 Nuclear Option: Full Demo Failure

**If everything fails and you can't recover in 2 minutes:**

### Transition Script:
> "We're experiencing some unexpected network issues. Rather than troubleshoot live, let me show you a pre-recorded walkthrough of the exact same functionality. This is from our staging environment running the production codebase..."

### Backup Assets (in order of preference):

1. **Pre-recorded video:** `docs/demo-video-backup.mp4`
   - Full 5-minute customer → chef → driver → admin flow
   - Narrated with key talking points
   - Shows all real-time features working

2. **Screenshot walkthrough:** `docs/demo-screenshots/`
   - Narrate through key screens
   - Use DEMO_PRESENTATION_SCRIPT.md for talking points

3. **Architecture discussion:** `docs/ARCHITECTURE_DIAGRAM.md`
   - Pivot to technical architecture discussion
   - Show data flow diagrams
   - Discuss scalability and design decisions

**Pro Tip:** If you have to go nuclear, lean into it:
> "This actually gives me a chance to talk more about the architecture and show you some metrics we wouldn't normally have time for..."

Then transition to PERFORMANCE_DEMO_SCRIPT.md (performance metrics, cost efficiency)

---

## 📋 Pre-Demo Warm-Up Checklist

**30 minutes before:**
- [ ] Run health checks (see top of this document)
- [ ] Seed demo data: `psql $DATABASE_URL < DEMO_SEED_DATA.sql`
- [ ] Verify test accounts work (login to each app)
- [ ] Pre-load cache: Run 5 test orders to warm route and geocode caches
- [ ] Check phone is charged and connected to stable WiFi
- [ ] Open backup video in VLC (ready to play with one click)
- [ ] Have screenshots folder open in another window

**5 minutes before:**
- [ ] Re-run all 5 health checks
- [ ] Close unnecessary browser tabs
- [ ] Silence phone notifications (except demo phones)
- [ ] Check room WiFi speed: https://fast.com/ (need > 10 Mbps)
- [ ] Have this document printed or on second screen

---

## 🎯 Priority Order for Features

**If time is tight or things are failing, show features in this order:**

1. **Must Show (core value prop):**
   - Customer browsing chefs
   - Placing an order
   - Chef receiving order notification
   - Driver GPS tracking (even if static)
   - Payment flow (even if mocked)

2. **Should Show (differentiation):**
   - Real-time order status updates
   - Driver assignment automation
   - Admin dashboard with analytics
   - Proof of delivery photo

3. **Nice to Have (polish):**
   - Address autocomplete
   - Dietary tags filtering
   - Rating and review system
   - Multi-cuisine variety

**If < 5 minutes remaining:** Show #1 only, jump to closing
**If 5-10 minutes remaining:** Show #1 + #2, mention #3 exists
**If 10+ minutes remaining:** Show all, dive into tech details

---

## 🔍 How to Tell What's Failing

| Symptom | Likely Cause | Fallback Section |
|---------|--------------|------------------|
| Map is blank | Google Maps API issue | Section 1 |
| Checkout spinner won't stop | Stripe API slow | Section 2 |
| Chef list empty | Database query timeout | Section 3 |
| Driver marker frozen | Realtime broadcast issue | Section 4 |
| Broken image icons | Supabase Storage down | Section 5 |
| App crashes on open | Metro bundler disconnected | Section 6 |
| Network tab shows all red | Your WiFi died | Nuclear option |

---

## 📞 Emergency Decision Tree

```
Can I recover in < 2 minutes?
├─ YES → Follow fallback procedure above
│         Keep narrating, don't panic
│         "This is a great example of why we built fallbacks..."
│
└─ NO → Go nuclear (video or screenshots)
         Transition smoothly: "Let me show you a recording..."
         Pivot to Q&A or architecture discussion
         End strong with performance metrics
```

---

## 💡 Pro Tips

1. **Stay calm:** Investors know demos fail. Your recovery matters more than the failure.

2. **Narrate through issues:** If something is slow, talk about what's happening behind the scenes. Fill dead air.

3. **Have a buddy:** If doing virtual demo, have someone on standby who can check logs/restart services.

4. **Test the night before:** Run through entire demo flow at least once with same WiFi/setup.

5. **Memorize test accounts:**
   - Customer: `demo-customer@ridendine.com` / `demo123`
   - Chef: `maria@ridendine.com` / `demo123`
   - Driver: `mike@ridendine.com` / `demo123`
   - Admin: `admin@ridendine.com` / `admin123`

6. **Stripe test cards:**
   - Success: `4242 4242 4242 4242`
   - Declined: `4000 0000 0000 0002` (don't use during demo!)
   - 3DS: `4000 0027 6000 3184` (avoid, requires popup)

7. **Know your metrics cold:**
   - 92% cost reduction (Google Maps caching)
   - Sub-2-second load times
   - 750 API calls/month (vs 3,000 without caching)
   - $0 infrastructure cost today, scales to 500 orders/day

---

**Remember:** The demo is a means to an end. If tech fails, pivot to business metrics, traction, or Q&A. You know this product inside and out—show that confidence.

---

**Last Updated:** 2026-02-25
**Next Review:** After demo (document what actually failed, improve procedures)
