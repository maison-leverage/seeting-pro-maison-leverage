

## Problem: A/B Test Always Shows 0

The `trackSend` function in `DailyQueue.tsx` silently fails on every call because the insert payload doesn't match the `message_sends` table schema. No data is ever recorded, so the Admin A/B test dashboard shows 0 everywhere.

### Root Cause

The `message_sends` table requires these NOT NULL columns:
- `prospect_id`, `variant_id`, `user_id`, `category`

But `trackSend` currently sends:
- `created_at` (wrong — column is `sent_at`, has a default)
- `variant_id: null` when no variant (violates NOT NULL)
- No `user_id`
- No `category`

The `as any` cast hides TypeScript errors, and the missing `.then()` error check means failures are swallowed.

### Fix Plan

**1. Fix `trackSend` in `src/pages/DailyQueue.tsx`**

Update the function signature to accept all required fields and send correct column names:

```typescript
const trackSend = async (prospectId: string, variantId: string, category: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  
  const { error } = await supabase.from('message_sends').insert({
    prospect_id: prospectId,
    variant_id: variantId,
    user_id: session.user.id,
    category: category,
    got_reply: false,
  });
  
  if (error) console.error('Failed to track send:', error);
};
```

**2. Update all `trackSend` call sites** (3 places in `handleMarkDone`)

- For `section === 'new'`: pass `variantId` and `first_dm_${prospect.source}` as category
- For `section === 'overdue'` or `'today'`: pass `variantId` and `followup_${followUpNumber}` as category
- Only call `trackSend` when `variantId` exists (skip if using fallback templates with no variant)

**3. Fix `handleReplyReceived`** — already correct (updates `got_reply` on existing sends)

### What This Fixes

- Every "Fait !" click will now correctly record the send in `message_sends`
- The Admin A/B test dashboard will start showing real send counts and reply rates
- The 50/50 distribution logic (`pickVariant`) will also work correctly since `sendCounts` will have real data

### No Database Changes Required

The table schema is already correct. Only the frontend code needs fixing.

