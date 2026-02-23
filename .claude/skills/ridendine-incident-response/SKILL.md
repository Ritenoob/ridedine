---
name: ridendine-incident-response
description: |
  Master incident response procedures for RidenDine production outages and emergencies. Use when:
  (1) production outage occurs, (2) database performance degradation, (3) payment processing
  failures, (4) security incidents, (5) coordinating incident resolution. Key insight: Blameless
  postmortems, incident commander role, clear communication channels, runbooks for common issues.
author: Claude Code
version: 1.0.0
---

# RidenDine Incident Response

## Problem

Production incidents require rapid response, clear communication, and systematic resolution. RidenDine incidents may involve Supabase database, Vercel web apps, EAS mobile apps, Stripe payments, or third-party integrations.

## Context / Trigger Conditions

Use this skill when:
- Production outage detected
- Critical service degradation
- Security incident or data breach
- Payment processing failures
- Database performance issues
- High error rates in monitoring

## Incident Severity Levels

| Severity | Impact | Response Time | Examples |
|----------|--------|---------------|----------|
| **P0 (Critical)** | Complete outage, no orders possible | < 15 min | Database down, web app unreachable, payment processing broken |
| **P1 (High)** | Major feature broken, some orders affected | < 1 hour | Chef app broken, delivery tracking down, specific payment method failing |
| **P2 (Medium)** | Minor feature degraded, workaround exists | < 4 hours | Slow page loads, search not working, image uploads failing |
| **P3 (Low)** | Cosmetic issue, no business impact | < 1 day | UI glitch, broken link, typo |

## Pattern 1: Incident Response Workflow

**Step 1: Detect (0-5 min)**
- Alert fired from monitoring system
- User report via support channel
- Error spike in Sentry

**Step 2: Triage (5-15 min)**
- Assess severity (P0-P3)
- Identify affected systems
- Assign incident commander
- Create incident channel (#incident-YYYY-MM-DD)

**Step 3: Communicate (immediate)**
- Post status update (status page if available)
- Notify stakeholders
- Update every 30min for P0/P1

**Step 4: Investigate (ongoing)**
- Check recent deployments
- Review logs (Supabase, Vercel, Sentry)
- Reproduce issue if possible

**Step 5: Mitigate (ASAP)**
- Apply quick fix if known
- Rollback deployment if needed
- Implement workaround

**Step 6: Resolve (varies)**
- Deploy permanent fix
- Verify resolution
- Monitor for recurrence

**Step 7: Postmortem (within 48 hours)**
- Document timeline
- Identify root cause
- Create action items

## Pattern 2: Common Runbooks

### Runbook: Database Performance Degradation

**Symptoms:** Slow queries, high CPU, connection pool exhaustion

**Steps:**
1. Check Supabase Dashboard → Database → Performance
2. Identify slow queries:
   ```sql
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```
3. Check missing indexes:
   ```sql
   SELECT schemaname, tablename, attname
   FROM pg_stats
   WHERE n_distinct > 1000
     AND attname NOT IN (
       SELECT a.attname
       FROM pg_index i
       JOIN pg_attribute a ON a.attrelid = i.indrelid
       WHERE i.indisvalid
     );
   ```
4. Add indexes if needed (via migration)
5. Consider read replicas for heavy read workload

### Runbook: Stripe Payment Failures

**Symptoms:** Orders stuck in "draft", payment webhook not firing

**Steps:**
1. Check Stripe Dashboard → Events → Filter failed events
2. Verify webhook endpoint responding:
   ```bash
   curl -X POST https://ridendine.supabase.co/functions/v1/webhook_stripe \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```
3. Check Supabase Edge Function logs:
   ```bash
   supabase functions logs webhook_stripe
   ```
4. Verify webhook signature secret matches Stripe Dashboard
5. Re-trigger failed events manually from Stripe Dashboard

### Runbook: Vercel Deployment Failure

**Symptoms:** Build fails, site unreachable, 500 errors

**Steps:**
1. Check Vercel Dashboard → Deployments → View logs
2. Identify error in build logs
3. Common issues:
   - Environment variable missing → Add in Vercel dashboard
   - Dependency error → Check pnpm-lock.yaml, run `pnpm install`
   - TypeScript error → Fix locally, push fix
4. Rollback to previous deployment if needed:
   ```bash
   vercel rollback
   ```
5. Re-deploy after fix:
   ```bash
   git push origin main
   ```

### Runbook: Mobile App Crash on Launch

**Symptoms:** App crashes immediately after opening, high crash rate in Sentry

**Steps:**
1. Check Sentry → Issues → Filter by iOS/Android
2. Identify crash stack trace
3. Common causes:
   - OTA update broke app → Rollback EAS Update
   - Native module issue → Rebuild app with `eas build`
   - API endpoint down → Check backend
4. Rollback OTA update:
   ```bash
   eas update:rollback --channel production
   ```
5. If native issue, submit hotfix build to app stores

## Pattern 3: Communication Templates

**Initial Alert:**
```
🚨 Incident: [Brief description]
Severity: P[0-3]
Impact: [User-facing impact]
Status: Investigating
ETA: TBD
Incident Commander: @username
Channel: #incident-2024-01-15
```

**Status Update (every 30min for P0/P1):**
```
⏱️ Update [HH:MM]
Status: [Investigating | Mitigating | Resolved]
Progress: [What we've done]
Next Steps: [What's next]
ETA: [Updated estimate]
```

**Resolution:**
```
✅ RESOLVED [HH:MM]
Duration: [Total time]
Root Cause: [Brief explanation]
Fix: [What was done]
Monitoring: [How we're watching for recurrence]
Postmortem: [Link or "within 48 hours"]
```

## Pattern 4: Rollback Procedures

**Vercel Web/Admin:**
```bash
# View recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>

# Or via dashboard: Deployments → ... → Promote to Production
```

**EAS Mobile (OTA Update):**
```bash
# View update history
eas update:view --channel production

# Rollback to previous update
eas update:rollback --channel production

# Or specify update ID
eas update:rollback --channel production --update-id <id>
```

**Supabase Migration:**
```bash
# Create rollback migration
supabase migration new rollback_issue_fix

# Write rollback SQL (reverse of original migration)
# Push migration
supabase db push
```

**Edge Function:**
```bash
# Deploy previous version from git
git checkout <previous-commit>
supabase functions deploy webhook_stripe
```

## Pattern 5: Postmortem Template

**Title:** [YYYY-MM-DD] [Brief description]

**Summary:**
- Date/Time: [Start] - [End]
- Duration: [Total time]
- Severity: P[0-3]
- Impact: [User-facing impact, number affected]
- Root Cause: [One-sentence explanation]

**Timeline:**
- HH:MM - Alert fired
- HH:MM - Incident commander assigned
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Resolved

**Root Cause:**
[Detailed explanation of what went wrong and why]

**Resolution:**
[What was done to fix the issue]

**Impact:**
- Affected users: [number]
- Failed orders: [number]
- Revenue impact: [if applicable]

**Action Items:**
- [ ] Add monitoring for [specific metric]
- [ ] Create runbook for [scenario]
- [ ] Add test coverage for [code path]
- [ ] Update documentation for [process]

**Lessons Learned:**
- What went well: [...]
- What could be improved: [...]

## Incident Response Checklist

**During Incident:**
- [ ] Assess severity
- [ ] Assign incident commander
- [ ] Create incident channel
- [ ] Post initial alert
- [ ] Investigate logs and monitoring
- [ ] Apply mitigation or rollback
- [ ] Update stakeholders every 30min
- [ ] Verify resolution
- [ ] Post resolution message

**After Incident:**
- [ ] Schedule postmortem within 48 hours
- [ ] Document timeline and root cause
- [ ] Create action items with owners
- [ ] Update runbooks if needed
- [ ] Share learnings with team

## References

- Incident response guide: https://response.pagerduty.com/
- Blameless postmortems: https://sre.google/sre-book/postmortem-culture/
- Supabase status: https://status.supabase.com/
- Vercel status: https://www.vercelstatus.com/
