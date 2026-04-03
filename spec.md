# ACW HuskTrack

## Current State
- Entries are stored in localStorage via `useLocalEntries.ts` with `createdAtMs` (milliseconds timestamp)
- Entry cards in `EntriesList.tsx` and `Dashboard.tsx` show date only (no time), using `nsToDate()` helper
- `NewEntry.tsx` always sets `createdAtMs: Date.now()` — no way to set a custom date
- `Customers.tsx` has Husk/Coconut tabs but no search bar to filter customers by name
- Admin role exists via `useAuth.ts`; no special date override logic for admins
- i18n translations exist for English and Tamil in `i18n.tsx`

## Requested Changes (Diff)

### Add
1. **Entry timestamps** — Show exact time (HH:MM) alongside the date on every entry card in `EntriesList.tsx` and Dashboard Recent Entries. Use `nsToDateTime()` helper that already exists.
2. **Search in Customers** — Add a search input bar at the top of each tab (Husk / Coconut) in `Customers.tsx` to filter the customer list by name in real-time. Include a clear button.
3. **Admin past-date entry** — In `NewEntry.tsx`, show a date picker field (visible only to admins) that lets the admin override the entry date. When the admin sets a past date, `createdAtMs` is set to the selected date (at midnight local time) instead of `Date.now()`. Non-admin users always use `Date.now()` (no date picker shown).

### Modify
- `EntriesList.tsx`: Replace date-only display with date + time on entry cards
- `Dashboard.tsx`: Same — show date + time on Recent Entries cards
- `Customers.tsx`: Add search state and filter logic per tab
- `NewEntry.tsx`: Add conditional date picker for admin role; pass custom timestamp to `addLocalHuskEntry` / `addLocalCoconutEntry`
- `useLocalEntries.ts`: Update `addLocalHuskEntry` and `addLocalCoconutEntry` to accept an optional `entryDateMs` override; if provided, use it as `createdAtMs` instead of `Date.now()`
- `i18n.tsx`: Add translations for new labels (Entry Date, Search Customers, Past date picker placeholder) in English and Tamil

### Remove
- Nothing removed

## Implementation Plan
1. Update `useLocalEntries.ts` — add optional `entryDateMs?: number` param to `HuskBatchEntryInput` and `CoconutBatchEntryInput` add functions; use it when provided.
2. Update `NewEntry.tsx` — detect if current user is admin; if yes, show a date input (type="date") defaulting to today; pass the selected date as `entryDateMs` to the add functions.
3. Update `EntriesList.tsx` — replace `nsToDate(...).toLocaleDateString()` calls with `nsToDateTime()` to show time on cards.
4. Update `Dashboard.tsx` Recent Entries cards — same time display change.
5. Update `Customers.tsx` — add `searchHusk` and `searchCoconut` state; filter customer lists by name match; render search input with clear button above each tab's list.
6. Update `i18n.tsx` — add keys: `entryDate`, `searchCustomers`, `selectDate` in both English and Tamil.
