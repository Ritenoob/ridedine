# Test Infrastructure - RidenDine Demo

**Created:** 2026-02-25
**Purpose:** Comprehensive E2E testing infrastructure for demo readiness

---

## 📁 Test Assets Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| **e2e/complete-order-flow.spec.ts** | Automated Playwright tests | CI/CD pipeline, pre-deployment verification |
| **DEMO_TEST_CHECKLIST.md** | Manual test checklist | Pre-demo dry run (15-20 min) |
| **DATA_VERIFICATION_QUERIES.sql** | Database integrity checks | Before demo, during troubleshooting |
| **BUG_TRIAGE_TEMPLATE.md** | Bug reporting template | When issues found during testing |
| **E2E_TEST_SCRIPT.md** | Detailed manual test script | Full 20-minute comprehensive test |

---

## 🚀 Quick Start

### Option 1: Automated Tests (Playwright)

**Run all E2E tests:**

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run tests
npx playwright test e2e/complete-order-flow.spec.ts

# Run with UI (watch mode)
npx playwright test --ui

# Run specific test
npx playwright test -g "Phase 1: Customer Journey"
```

**View test report:**

```bash
npx playwright show-report
```

---

### Option 2: Manual Testing (15-minute dry run)

**Before investor demo or important presentation:**

1. Open **DEMO_TEST_CHECKLIST.md**
2. Complete all sections in order (⬜ → ✅)
3. Take screenshots at each checkpoint
4. Document any issues in **BUG_TRIAGE_TEMPLATE.md**

**Time commitment:** 15-20 minutes

---

### Option 3: Database Verification (SQL queries)

**Check data integrity:**

```bash
# Open Supabase SQL Editor
# Copy queries from DATA_VERIFICATION_QUERIES.sql
# Run Section 1 (Pre-Demo Validation)
```

**Expected results documented in query comments**

---

## 📊 Test Coverage

### Automated Tests (Playwright)

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| **Phase 1: Customer Journey** | 1 test | Browse → Cart → Checkout |
| **Phase 2: Chef Dashboard** | 1 test | Order management UI |
| **Phase 3: Admin Dashboard** | 1 test | Metrics and monitoring |
| **Performance Tests** | 1 test | Page load times |
| **Accessibility Tests** | 1 test | A11y compliance |
| **Responsive Tests** | 1 test | Mobile viewport |
| **Error Handling** | 1 test | Invalid routes |
| **Smoke Tests** | 4 tests | Critical paths |

**Total:** 11 automated tests

---

### Manual Test Checklist

| Section | Items | Duration |
|---------|-------|----------|
| Pre-Demo Setup | 10 checks | 5 min |
| Customer Journey | 5 tests | 5 min |
| Chef Dashboard | 2 tests | 2 min |
| Admin Dashboard | 2 tests | 2 min |
| Visual Quality | 8 checks | 3 min |
| Performance Check | 4 checks | 2 min |
| Deployment Verification | 6 checks | 2 min |

**Total:** 37 manual checks

---

### Database Verification Queries

| Section | Queries | Purpose |
|---------|---------|---------|
| Pre-Demo Validation | 7 queries | Data integrity before demo |
| During-Demo Health | 5 queries | Real-time monitoring |
| Performance Checks | 3 queries | Cache effectiveness, slow queries |
| Data Integrity | 4 queries | Orphaned records, price consistency |
| Realtime Features | 2 queries | GPS tracking, channel activity |
| Business Metrics | 4 queries | Admin dashboard data |
| Troubleshooting | 3 queries | Quick debugging |

**Total:** 28 verification queries

---

## 🎯 Recommended Testing Workflow

### Before Vercel Deployment

1. **Run automated tests locally:**
   ```bash
   npx playwright test e2e/complete-order-flow.spec.ts
   ```

2. **Check test results:**
   - All smoke tests passing? ✅ Deploy
   - Critical tests failing? ❌ Fix bugs first

3. **Run database verification:**
   - Section 1: Pre-Demo Validation
   - Section 4: Data Integrity Checks

---

### After Vercel Deployment

1. **Wait 2-3 minutes** for deployment to stabilize

2. **Run manual checklist** (DEMO_TEST_CHECKLIST.md)
   - Focus on Sections 1-3 (Critical Path)
   - Take screenshots for documentation

3. **Verify performance:**
   - Run Section 3 from DATA_VERIFICATION_QUERIES.sql
   - Check page load times < 3 seconds

4. **Document issues:**
   - Use BUG_TRIAGE_TEMPLATE.md for each bug
   - Prioritize using severity matrix

---

### Before Investor Demo (30 min before)

1. **Full dry run** using DEMO_TEST_CHECKLIST.md (15 min)

2. **Review known issues** from bug triage

3. **Prepare workarounds** for P2/P3 bugs

4. **Brief presenter** on:
   - Features that work well (emphasize these)
   - Known issues and how to avoid them
   - Backup slides/video if live demo fails

5. **Final checks:**
   - Deployment URL accessible
   - Supabase project active (not paused)
   - Browser cache cleared
   - Demo data seeded

---

## 🐛 Bug Tracking Process

### When Bug Found

1. **Create bug report** using BUG_TRIAGE_TEMPLATE.md

2. **Assign severity:**
   - **Critical:** Blocks demo flow → P0 (fix immediately)
   - **Major:** Impacts UX → P1 (fix today)
   - **Minor:** Cosmetic → P2/P3 (backlog)

3. **Document thoroughly:**
   - Steps to reproduce
   - Screenshots
   - Console errors
   - Expected vs actual behavior

4. **Assign to developer**

5. **Verify fix:**
   - Re-run test that found bug
   - Check for regressions

---

### Bug Priority Matrix

```
┌─────────────┬───────────────┬──────────────┬──────────┐
│ Severity    │ Affects Demo? │ User Visible │ Priority │
├─────────────┼───────────────┼──────────────┼──────────┤
│ Critical    │ Yes           │ Yes          │ P0       │
│ Critical    │ Yes           │ No           │ P1       │
│ Major       │ Yes           │ Yes          │ P1       │
│ Major       │ No            │ Yes          │ P2       │
│ Minor       │ Any           │ Any          │ P3       │
└─────────────┴───────────────┴──────────────┴──────────┘
```

---

## 📈 Success Metrics

### Automated Tests

✅ **Pass:** All smoke tests green
✅ **Pass:** Performance tests under threshold
⚠️ **Warning:** 1-2 non-critical tests failing
❌ **Fail:** Any critical path test failing

---

### Manual Checklist

✅ **Pass:** ≥ 80% of items checked
✅ **Pass:** All "Critical Path" items pass
⚠️ **Warning:** 60-79% passing
❌ **Fail:** < 60% passing or critical path blocked

---

### Database Verification

✅ **Pass:** All integrity checks return 0 rows
✅ **Pass:** Metrics within expected ranges
⚠️ **Warning:** Performance degraded but functional
❌ **Fail:** Data corruption or missing seed data

---

## 🛠️ Troubleshooting Common Issues

### "Playwright tests won't run"

```bash
# Install dependencies
npm install @playwright/test
npx playwright install

# Check Node version (need >= 20)
node --version
```

---

### "Chefs not loading in tests"

**Check:**
1. Web server running? (`pnpm --filter @home-chef/web dev`)
2. Supabase backend accessible?
3. RLS policies allow public read?

**Fix:**
```sql
-- Run in Supabase SQL Editor
CREATE POLICY "Allow public read" ON chefs
FOR SELECT USING (status = 'active');
```

---

### "Tests timing out"

**Increase timeout in playwright.config.ts:**

```typescript
export default defineConfig({
  timeout: 120 * 1000, // 2 minutes
});
```

---

### "Screenshots not generating"

**Create directory:**

```bash
mkdir -p e2e-screenshots
```

**Or disable screenshots:**

```typescript
// In test file, comment out:
// await page.screenshot({ path: '...' });
```

---

## 📚 Additional Resources

- **Playwright Docs:** https://playwright.dev/docs/intro
- **Supabase RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security
- **E2E Testing Best Practices:** https://playwright.dev/docs/best-practices

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test e2e/complete-order-flow.spec.ts
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📝 Maintenance

### Weekly

- [ ] Run full automated test suite
- [ ] Review and close fixed bugs
- [ ] Update test data if schema changes

### Before Each Demo

- [ ] Run DEMO_TEST_CHECKLIST.md
- [ ] Update known issues list
- [ ] Verify all seed data present

### After Deployment

- [ ] Run smoke tests on production
- [ ] Verify database queries
- [ ] Check performance metrics

---

## 🎓 Training Resources

### For Developers

1. Read **E2E_TEST_SCRIPT.md** to understand user flows
2. Run automated tests locally before each commit
3. Use **DATA_VERIFICATION_QUERIES.sql** to debug issues

### For QA Team

1. Master **DEMO_TEST_CHECKLIST.md** for pre-demo validation
2. Use **BUG_TRIAGE_TEMPLATE.md** consistently
3. Keep bug database updated with latest findings

### For Demo Presenters

1. Review known issues list before demo
2. Practice with **DEMO_TEST_CHECKLIST.md** flow
3. Have backup slides ready for critical bugs

---

## 📧 Support

**Questions about testing?**
- Check this README first
- Review test file comments
- Ask in team chat: #qa-testing

**Found a bug in the tests themselves?**
- Create issue with label `testing-infrastructure`
- Include: test file, line number, error message

---

**Last Updated:** 2026-02-25
**Maintained By:** QA Team
**Version:** 1.0
