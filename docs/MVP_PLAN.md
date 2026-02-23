# MVP Plan - Home Chef Delivery Marketplace

## Product Vision

Build a functional 3-sided marketplace connecting local chefs with customers and drivers, enabling home-cooked meal delivery with integrated payments and order tracking.

## MVP Scope

### What's Included (Phase 1)
- ✅ User authentication (Customer, Chef, Admin roles)
- ✅ Chef onboarding and profile creation
- ✅ Menu management (CRUD operations)
- ✅ Customer browsing and ordering
- ✅ Stripe Connect integration (payments & payouts)
- ✅ Order lifecycle management
- ✅ Admin dashboard (basic)
- ✅ Mobile-first responsive design

### What's Deferred (Phase 2)
- ⏸️ Driver functionality
- ⏸️ Real-time order tracking with maps
- ⏸️ Push notifications
- ⏸️ Advanced analytics
- ⏸️ Rating and review system
- ⏸️ Scheduled deliveries
- ⏸️ Multiple payment methods
- ⏸️ Refund processing

## User Journeys

### Customer Journey
1. **Sign Up** → Create account with email/password
2. **Browse** → See list of approved chefs in area
3. **View Menu** → Browse chef's available menu items
4. **Add to Cart** → Select items and quantities
5. **Checkout** → Choose pickup/delivery, pay with Stripe
6. **Track Order** → See order status updates
7. **Complete** → Receive order confirmation

### Chef Journey
1. **Sign Up** → Create chef account
2. **Onboarding** → Complete Stripe Connect setup
3. **Create Menu** → Add menu and menu items
4. **Set Availability** → Define service hours
5. **Receive Orders** → Get notified of new orders
6. **Accept/Prepare** → Update order status
7. **Mark Ready** → Customer notified for pickup
8. **Get Paid** → Automatic payout via Stripe

### Admin Journey
1. **Login** → Access admin dashboard
2. **Review Chefs** → Approve/reject chef applications
3. **Monitor Orders** → View all platform orders
4. **Handle Issues** → Manage disputes and refunds
5. **View Metrics** → Basic platform analytics

## Technical Implementation Phases

### Phase 0: Foundation ✅
- [x] Monorepo setup with workspaces
- [x] Shared types and schemas package
- [x] Environment configuration
- [x] Git repository and structure

### Phase 1: Database & Auth ✅
- [x] Supabase project creation
- [x] Database migrations (all core tables)
- [x] Row Level Security policies
- [x] Authentication setup
- [x] Storage buckets configuration

### Phase 2: Backend Functions ✅
- [x] Edge Function: create_connect_account
- [x] Edge Function: create_checkout_session
- [x] Edge Function: webhook_stripe
- [x] Function deployment and testing

### Phase 3: Mobile App - Auth ✅
- [x] Expo app initialization
- [x] Role-based routing setup
- [x] Sign up / Sign in screens
- [x] Supabase client configuration
- [x] Auth state management

### Phase 4: Mobile App - Customer
- [x] Browse chefs screen (basic)
- [ ] Chef detail screen
- [ ] Menu browsing
- [ ] Cart functionality
- [ ] Checkout flow
- [ ] Order tracking screen
- [ ] Order history

### Phase 5: Mobile App - Chef
- [x] Dashboard screen (basic)
- [ ] Menu management (CRUD)
- [ ] Incoming orders view
- [ ] Order accept/decline
- [ ] Status update controls
- [ ] Stripe Connect onboarding flow

### Phase 6: Admin Dashboard ✅
- [x] Next.js app setup
- [x] Admin authentication
- [x] Dashboard home (basic)
- [ ] Chef approval interface
- [ ] Order management view
- [ ] Basic analytics

### Phase 7: Integration Testing
- [ ] End-to-end order flow
- [ ] Payment processing test
- [ ] Chef payout verification
- [ ] Role-based access control
- [ ] Error handling

### Phase 8: Polish & Deploy
- [ ] UI/UX improvements
- [ ] Loading states
- [ ] Error messages
- [ ] Mobile app build (EAS)
- [ ] Admin deploy (Vercel)
- [ ] Documentation finalization

## Success Criteria

### Functional Requirements
- ✅ User can sign up and sign in
- ✅ Chef can create and manage menu
- ⏳ Customer can browse and order
- ⏳ Payment processes successfully
- ⏳ Chef receives payout
- ⏳ Admin can approve chefs
- ⏳ Order status updates work

### Technical Requirements
- ✅ Monorepo builds successfully
- ✅ Shared packages importable
- ✅ Database migrations run cleanly
- ✅ RLS policies enforce access control
- ⏳ Edge Functions deploy and execute
- ⏳ Mobile app runs on iOS/Android
- ⏳ Admin dashboard deploys to Vercel

### Performance Requirements
- Orders complete in < 30 seconds
- Page loads in < 3 seconds
- API responses in < 500ms
- 99% uptime

## Launch Checklist

### Pre-Launch
- [ ] All Phase 1-8 items complete
- [ ] Test accounts created for each role
- [ ] Sample data populated
- [ ] All environment variables set
- [ ] Stripe in test mode verified

### Launch Day
- [ ] Switch Stripe to live mode
- [ ] Update environment variables
- [ ] Deploy mobile app to stores
- [ ] Deploy admin to Vercel
- [ ] Monitor error logs
- [ ] Prepare support channels

### Post-Launch
- [ ] Monitor first transactions
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Plan Phase 2 features

## Resource Requirements

### Development Team
- 1 Full-stack developer (you!)
- Optional: Designer for UI/UX polish
- Optional: QA tester

### External Services
- Supabase (Free tier → $25/month)
- Stripe (2.9% + 30¢ per transaction)
- Vercel (Free tier → $20/month)
- EAS Build ($29/month for unlimited builds)
- Google Maps API (Free tier → usage-based)

### Time Estimate
- Phase 1-3: 1-2 weeks (foundation)
- Phase 4-6: 2-3 weeks (features)
- Phase 7-8: 1 week (polish & deploy)
- **Total: 4-6 weeks for MVP**

## Risk Mitigation

### Technical Risks
- **Stripe integration complexity**
  - Mitigation: Use test mode extensively, follow Stripe docs
- **Mobile app performance**
  - Mitigation: Profile early, optimize queries
- **Database scaling**
  - Mitigation: Start with indexes, monitor query performance

### Business Risks
- **Low chef adoption**
  - Mitigation: Manual outreach, demo accounts
- **Payment processing issues**
  - Mitigation: Comprehensive testing, Stripe support
- **User confusion**
  - Mitigation: Clear onboarding, help documentation

## Metrics to Track

### User Metrics
- Sign-ups per day
- Active chefs
- Orders per day
- Average order value
- Customer retention rate

### Technical Metrics
- API error rate
- Page load times
- Mobile app crashes
- Database query performance
- Edge Function execution time

### Business Metrics
- GMV (Gross Merchandise Value)
- Platform fees collected
- Chef payout volume
- Customer acquisition cost
- Chef satisfaction score

## Next Steps After MVP

### Phase 2 Features (Priority Order)
1. Driver functionality and delivery tracking
2. Push notifications for orders
3. Rating and review system
4. Scheduled orders (pre-order for later)
5. Multiple payment methods
6. Refund processing automation
7. Advanced analytics dashboard
8. Promotional codes and discounts
9. Loyalty program
10. Multi-language support

### Scaling Considerations
- Read replicas for reporting
- CDN for images
- Caching layer (Redis)
- Background job processing
- Geographic expansion
- Enterprise chef accounts

## Support & Maintenance

### Documentation
- User guides (customer, chef, driver)
- Admin manual
- API documentation
- Troubleshooting guide

### Support Channels
- Email support (help@homechefdelivery.com)
- In-app chat (Phase 2)
- FAQ/Help Center
- Community forum (Phase 3)

### Maintenance Plan
- Weekly dependency updates
- Monthly security patches
- Quarterly feature releases
- Database backups (daily)
- Monitoring and alerts
