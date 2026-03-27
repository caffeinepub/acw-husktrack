# ACW HuskTrack

## Current State
Husk and coconut entries are stored as single-item records. When user adds multiple items (rows) on the New Entry form and saves, each row is saved as a **separate entry** via a for-loop of individual `addEntry` / `addCoconutEntry` calls. This results in multiple entries appearing in the Entries list for what the user considers one purchase transaction.

## Requested Changes (Diff)

### Add
- `HuskItem` type: `{ itemType, quantity }`
- `CoconutItem` type: `{ coconutType, specifyType, quantity }`
- `HuskBatchEntry` type: single entry containing an array of `HuskItem`, plus `customerId`, `customerName`, `vehicleNumber`, `notes`, `createdAt`, `createdBy`, `createdByName`
- `CoconutBatchEntry` type: single entry containing an array of `CoconutItem`, plus same shared fields
- Backend functions: `addHuskBatchEntry`, `getAllHuskBatchEntries`, `getHuskBatchEntry`, `updateHuskBatchEntry`, `deleteHuskBatchEntry`
- Backend functions: `addCoconutBatchEntry`, `getAllCoconutBatchEntries`, `getCoconutBatchEntry`, `updateCoconutBatchEntry`, `deleteCoconutBatchEntry`
- Report types for batch entries

### Modify
- NewEntry: save all item rows as a single batch entry (one API call instead of a loop)
- EntriesList: display batch entries; each card shows customer/vehicle/date with all items listed inside
- EntriesList edit sheet: allow editing multiple items per entry
- Reports: aggregate quantity across batch entry items

### Remove
- Nothing removed from backend (keep old single-entry APIs for backward compat)
- Remove the for-loop multi-call pattern from frontend NewEntry

## Implementation Plan
1. Add HuskItem, CoconutItem, HuskBatchEntry, CoconutBatchEntry types to Motoko backend
2. Add CRUD functions for both batch entry types
3. Add batch report query functions
4. Update backend.d.ts with new types and functions
5. Update useQueries hooks for batch entry operations
6. Update NewEntry.tsx to submit single batch entry
7. Update EntriesList.tsx to fetch/display/edit/delete batch entries
8. Update Reports.tsx to use batch entry report functions
