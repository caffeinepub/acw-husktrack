# ACW HuskTrack

## Current State
Fully offline-first app — all data (entries, customers, vehicles) stored in localStorage only. The backend canister has all CRUD APIs for entries and customers but is not being used for data storage (only for PIN changes).

## Requested Changes (Diff)

### Add
- `syncedBackendId?: number` field to `StoredHuskEntry`, `StoredCoconutEntry`, and `LocalCustomer` stored shapes
- `src/frontend/src/utils/syncService.ts` — sync utility with:
  - `syncAll(actor, username, pin)` — pushes all local-only items (no `syncedBackendId`) to backend, then pulls all backend data and merges locally
  - `getUnsyncedCount()` — returns count of items not yet synced
  - Last sync timestamp stored in localStorage under `acw_last_sync`
- Sync card in Settings page with:
  - "Sync Data" title with RefreshCw icon
  - Last synced timestamp display
  - Count of unsynced items
  - "Sync Now" button (shows loading spinner while syncing)
- Sync status dot in Layout header (small badge on avatar when unsynced items > 0)
- i18n keys: `syncData`, `syncNow`, `lastSynced`, `syncing`, `syncSuccess`, `syncFailed`, `unsyncedItems` in both en and ta

### Modify
- `useLocalEntries.ts`: add optional `syncedBackendId?: number` to `StoredHuskEntry` and `StoredCoconutEntry` interfaces
- `useLocalCustomers.ts`: add optional `syncedBackendId?: number` to `LocalCustomer` interface; export `deleteAllCustomers` if not present
- `Settings.tsx`: add Sync Data card above the Change PIN card
- `Layout.tsx`: add unsynced indicator dot on avatar button
- `i18n.tsx`: add sync translation keys

### Remove
- Nothing removed

## Implementation Plan
1. Add `syncedBackendId?: number` to stored type interfaces in useLocalEntries.ts and useLocalCustomers.ts
2. Create `syncService.ts` with push/pull/merge logic
3. Update i18n.tsx with sync keys (en + ta)
4. Update Settings.tsx to add Sync Data card
5. Update Layout.tsx to show unsynced dot on avatar
6. Validate (lint + typecheck + build)
