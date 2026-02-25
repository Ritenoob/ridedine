# RidenDine Demo Presentation Script (Snapshot)

Note: Historical snapshot for demo planning. Validate against current repo state.

**Duration:** 20 minutes
**Audience:** Investors, stakeholders, potential partners
**Goal:** Demonstrate complete platform capabilities and business model

---

## Pre-Demo Checklist (5 minutes before)

- [ ] All services running (mobile app, admin dashboard, backend)
- [ ] Demo data seeded (10 chefs, 50 dishes, 5 drivers)
- [ ] Test devices ready (2-3 phones with Expo Go)
- [ ] Screen mirroring configured for mobile demos
- [ ] Admin dashboard open in browser
- [ ] Stripe test mode active
- [ ] Backup slides ready (in case of technical issues)

---

## Opening (2 minutes)

### Introduction

**Script:**

> "Good [morning/afternoon]. I'm excited to show you RidenDine, a 3-sided marketplace platform that connects home chefs, customers, and delivery drivers. Think of it as combining the best of Uber, DoorDash, and Airbnb, but for home-cooked meals.
>
> What makes RidenDine unique is that we empower home chefs to turn their passion into income, while giving customers access to authentic, home-cooked meals from diverse cuisines that you won't find in traditional restaurants.
>
> Today I'll walk you through the complete customer journey, from browsing chefs to receiving their food, and show you how our platform handles payments, delivery coordination, and real-time tracking."

### The Problem We're Solving

**Script:**

> "Traditional food delivery platforms focus on restaurants. But there's a massive untapped market of talented home chefs who can't afford a commercial kitchen or don't want the overhead of running a restaurant. Meanwhile, customers are craving authentic, home-cooked meals from diverse cultures.
>
> RidenDine bridges this gap by providing the infrastructure, payments, and logistics that home chefs need to run their business safely and legally."

---

## Act 1: Customer Experience (5 minutes)

### Scene 1: Browsing Chefs

**Action:**
1. Open Customer app on phone
2. Show home screen with chef carousel

**Script:**

> "Let me show you the customer experience. When you open the app, you see chefs near you. We have 10 chefs in our demo, representing cuisines from around the world—Mexican, Chinese, Indian, Italian, Japanese, French, Spanish, Middle Eastern, Korean, and Russian."

**Key Points to Highlight:**
- 📍 Location-based browsing (chefs sorted by distance)
- ⭐ Star ratings and review counts
- 🍽️ Cuisine type badges
- 📸 Professional chef photos

**Demo Action:**
Scroll through chef list, tap on "Maria Rodriguez - Mexican Cuisine"

---

### Scene 2: Viewing Menu

**Action:**
1. Show Maria's menu with 5 dishes
2. Scroll through items

**Script:**

> "Each chef creates their own menu. Maria specializes in authentic Mexican food. You can see photos, prices, descriptions, and dietary tags. Everything from $6 street corn to $14 enchiladas.
>
> Notice the dietary tags—gluten-free, vegetarian, vegan. We make it easy for customers to filter by their dietary needs."

**Key Points:**
- 💰 Transparent pricing
- 🏷️ Dietary tags (vegetarian, gluten-free, vegan, spicy)
- 📷 Appetizing food photos
- ℹ️ Detailed descriptions

**Demo Action:**
Add "Tacos al Pastor" ($12) and "Elote" ($6) to cart

---

### Scene 3: Checkout & Payment

**Action:**
1. Navigate to cart
2. Show order summary

**Script:**

> "Here's the checkout. Notice the cost breakdown: $18 for food, $5 delivery fee, and a $1.80 platform fee—that's our 10% commission on food cost only, not on delivery.
>
> The customer enters their delivery address, and we use Google Maps geocoding with 30-day caching to keep costs down. That's saved us 92% on Google Maps API costs compared to calling the API every time."

**Key Points:**
- 📊 **Transparent fees:** Customers see exactly what they're paying for
- 💳 **Secure payments:** Stripe integration, PCI compliant
- 🗺️ **Smart address handling:** Geocoding with intelligent caching
- 📍 **Distance & ETA:** Calculated automatically

**Demo Action:**
Enter address: "456 Park Ave, New York, NY 10022"
Place order using Stripe test card (4242 4242 4242 4242)

---

## Act 2: Chef & Kitchen Operations (4 minutes)

### Scene 4: Chef Receives Order

**Action:**
1. Switch to Chef app (Maria's account)
2. Show real-time notification

**Script:**

> "The moment the customer places the order, Maria gets a push notification. She sees the order details: who ordered, what they want, where to deliver, and how much she'll earn.
>
> Maria's payout is $16.20—that's the $18 food cost minus our $1.80 platform fee. She gets 90% of the food revenue. The $5 delivery fee goes entirely to the driver."

**Key Points:**
- ⚡ **Real-time notifications:** Supabase Realtime (WebSocket-based)
- 💵 **Clear earnings:** Chefs see their payout upfront
- 📱 **Mobile-first:** Everything managed from their phone
- ⏱️ **Order timer:** Tracks how long since order placed

**Demo Action:**
- Accept order
- Tap "Start Cooking"

---

### Scene 5: Kitchen Management

**Action:**
Show order moves through states: Accepted → Cooking → Ready

**Script:**

> "Maria updates the order status as she cooks. The customer sees these updates in real-time: 'Your order is being prepared', 'Your order is ready', etc.
>
> When Maria marks the order ready, our system automatically finds the best available driver within 15km based on distance and rating, and assigns them the delivery."

**Key Points:**
- 📈 **Order state management:** Clear workflow (Pending → Accepted → Cooking → Ready → Delivered)
- 🤖 **Auto-dispatch:** Algorithm finds best driver automatically
- 📍 **Distance-based:** PostGIS geospatial queries for efficiency
- 🔒 **Security:** Row Level Security ensures chefs only see their own orders

**Demo Action:**
Tap "Mark Ready" → triggers driver assignment

---

## Act 3: Driver & Delivery (5 minutes)

### Scene 6: Driver Receives Assignment

**Action:**
1. Switch to Driver app (Mike's account)
2. Show delivery assignment notification

**Script:**

> "Mike, one of our drivers, immediately gets notified of a new delivery opportunity. He sees: pickup address (Maria's location), dropoff address (customer's location), the fee he'll earn ($5), and estimated distance (5.2km).
>
> Drivers can accept or decline. Mike accepts."

**Key Points:**
- 💰 **Clear earnings:** Driver knows fee upfront
- 📏 **Distance shown:** Helps driver decide if worthwhile
- 🗺️ **Route preview:** Map shows pickup and dropoff locations
- ⚡ **Fast assignment:** Under 5 seconds from chef marking ready

**Demo Action:**
Accept delivery

---

### Scene 7: Live GPS Tracking

**Action:**
1. Show driver's navigation view
2. Switch to customer app and show live tracking map

**Script:**

> "This is where the magic happens. Mike's phone broadcasts his GPS location every 5 seconds using Supabase Realtime. The customer sees Mike's exact location on a map, moving in real-time.
>
> Notice the route polyline—we use Google Maps Routes API with 5-minute caching. The first request fetches the route from Google; subsequent requests within 5 minutes pull from our cache. Again, massive cost savings."

**Key Points:**
- 📡 **Real-time GPS:** 5-second updates via Supabase Realtime broadcast
- 🗺️ **Visual tracking:** Polyline shows route, marker shows driver position
- ⏱️ **Dynamic ETA:** Recalculates based on distance remaining
- 💰 **Cost optimization:** Route caching reduces Google Maps API costs by 92%

**Demo Action:**
- Show driver marker moving on customer's screen
- Point out ETA updates

---

### Scene 8: Proof of Delivery

**Action:**
1. Driver arrives at customer location
2. Tap "Mark Delivered"
3. Take photo of food at doorstep
4. Upload photo

**Script:**

> "When Mike arrives, he takes a photo for proof of delivery. This protects everyone: the customer gets confirmation, the driver has proof they delivered, and we can resolve any disputes.
>
> The photo uploads to Supabase Storage, and the customer sees it immediately."

**Key Points:**
- 📸 **Photo proof:** Uploaded to cloud storage
- ✅ **Delivery confirmation:** Customer notified instantly
- 🔒 **Dispute resolution:** Photo evidence for platform protection
- 💳 **Payment trigger:** Delivery completion triggers payment capture

**Demo Action:**
Mark delivered, show proof photo on customer app

---

## Act 4: Behind the Scenes - Payments (2 minutes)

### Scene 9: Automated Payment Processing

**Action:**
1. Switch to admin dashboard
2. Show order details with payment breakdown

**Script:**

> "Here's what happens behind the scenes. When Mike marks the order delivered, we automatically capture the $24.80 payment from the customer's card. Remember, we only authorized the payment when they ordered, but didn't charge them yet. This protects customers if the chef doesn't fulfill the order.
>
> Now the money gets split automatically via Stripe Connect:
> - Maria gets $16.20 (her 90% of food revenue)
> - Mike gets $5 (full delivery fee)
> - RidenDine keeps $1.80 (our 10% platform fee)
> - Stripe takes their 2.9% + $0.30 processing fee
>
> All transfers happen automatically. Maria and Mike see the money in their bank accounts within 2-7 business days through Stripe Express."

**Key Points:**
- 💳 **Stripe Connect:** Marketplace payment solution
- 💰 **Fair splits:** 90% to chef, 100% of delivery to driver
- 🤖 **Automated:** Zero manual intervention
- 🔒 **Secure:** PCI compliant, funds held until delivery confirmed

**Demo Action:**
Show admin dashboard with order details, payment breakdown, payout records

---

## Act 5: Platform Management (2 minutes)

### Scene 10: Admin Dashboard

**Action:**
1. Show real-time analytics dashboard
2. Navigate to orders list
3. Show user management

**Script:**

> "The admin dashboard gives us complete visibility. We can see:
> - Today's orders and revenue in real-time
> - Active deliveries and their status
> - All users: customers, chefs, drivers
> - Payment records and pending payouts
> - Analytics charts that update live
>
> We can also manually intervene if needed—resolve disputes, issue refunds, manage chef applications, etc."

**Key Points:**
- 📊 **Real-time analytics:** Live updates using Supabase subscriptions
- 👥 **User management:** Approve chefs, manage drivers
- 💰 **Financial tracking:** Revenue, payouts, commissions
- 🛠️ **Manual overrides:** Admin can intervene when needed

---

## Closing: Technology & Business Model (2 minutes)

### Tech Stack Highlights

**Script:**

> "Let me quickly touch on the technology. RidenDine is built on modern, scalable infrastructure:
>
> **Mobile:** React Native with Expo—one codebase for iOS and Android
> **Backend:** Supabase—managed PostgreSQL with built-in auth, real-time subscriptions, and serverless functions
> **Payments:** Stripe Connect for marketplace payments
> **Maps:** Google Maps with intelligent caching (92% cost reduction)
> **Hosting:** Vercel for web apps, Expo Application Services for mobile
>
> The entire platform was built in 12 weeks by [team size]. Validate production readiness and scaling claims against current metrics."

---

### Business Model

**Script:**

> "Our business model is simple and proven:
>
> **Revenue:** 10% commission on food sales only (not delivery)
> **Target:** $500k GMV in year 1 = $50k platform revenue
> **CAC:** $12 per customer (paid social, referrals)
> **LTV:** $480 per customer (avg 40 orders at $24 each, 10% margin)
> **Unit Economics:** 40:1 LTV:CAC ratio
>
> We're starting in New York City with 50 chefs in Q1, expanding to 5 metros by end of year."

---

### The Ask

**Script:**

> "We're raising [$X] to fund:
> - Chef acquisition and onboarding
> - Driver network expansion
> - Marketing and customer acquisition
> - Compliance and insurance
> - Team growth (2 engineers, 1 ops manager)
>
> We've validated product-market fit with [X] pilot users and [Y] orders. Validate scaling readiness against current metrics.
>
> Who has questions?"

---

## Backup Talking Points (If Questions)

### Safety & Compliance

> "Chef safety is our top priority. All chefs must:
> - Pass background checks
> - Complete food handler certification
> - Comply with local cottage food laws
> - Carry liability insurance (we provide $1M policy)
> - List all ingredients and allergens"

### Competitive Advantage

> "Unlike DoorDash (restaurants) and Uber Eats (restaurants), we focus on home chefs—an untapped market. We're also cheaper: our 10% commission beats DoorDash's 30%. Chefs keep more money, customers pay less."

### Scalability

> "Supabase and Vercel auto-scale to millions of users. Our caching strategy means Google Maps costs stay flat even as order volume grows. Validate capacity claims against current benchmarks."

### Regulatory Challenges

> "Cottage food laws vary by state. We're starting in states with permissive laws (NY, CA, TX). We provide compliance documentation and guide chefs through the process. We've worked with [attorney/firm] to ensure we're fully compliant."

---

## Technical Demo Backup (If Live Demo Fails)

**Have ready:**
- Pre-recorded video of full flow (customer → chef → driver)
- Screenshots of key screens
- Architecture diagram (docs/ARCHITECTURE_DIAGRAM.md)
- Data flow documentation (docs/DATA_FLOW_DOCUMENTATION.md)

---

## Post-Demo Actions

- [ ] Share demo access to investors (test accounts)
- [ ] Send pitch deck with technical appendix
- [ ] Provide GitHub repo access (if requested)
- [ ] Schedule follow-up meetings
- [ ] Collect feedback for iteration

---

## Success Metrics

**Demo was successful if:**
- [ ] No crashes or major bugs
- [ ] All real-time features worked (notifications, GPS)
- [ ] Payment flow completed end-to-end
- [ ] Audience asked questions (shows engagement)
- [ ] At least one investor/stakeholder requested follow-up

---

## Notes Section (Fill during demo)

**What worked well:**
-
-
-

**What needs improvement:**
-
-
-

**Questions asked:**
-
-
-

**Follow-up actions:**
-
-
-
