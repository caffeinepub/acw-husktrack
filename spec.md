# ACW HuskTrack

## Current State
- NewEntry.tsx: multi-item entry for husk (itemRows) and coconut (coconutRows). No live quantity total shown.
- Reports.tsx: filters by date, customer, vehicle, item type, payment. Shows total quantity card, chart, entry table, monthly summary. No customer-wise breakdown.

## Requested Changes (Diff)

### Add
- **Quantity Running Total** (NewEntry.tsx): Below the items list, show a live running total of all quantities entered so far (sum of all rows' quantity fields). Update instantly as user types. Label: "Total: X Nos". Show for both husk and coconut modes.
- **Customer-wise Report** (Reports.tsx): After generating a report (when no specific customer is filtered), add a "Customer Summary" section showing a table with each customer's entry count and total quantity, sorted by total qty descending. When a specific customer IS selected in the filter, show their individual summary card prominently (name, total entries, total quantity, payment info for admins). Add Tamil translations for new labels.

### Modify
- NewEntry.tsx: Compute running total from itemRows (husk) or coconutRows (coconut) and display it.
- Reports.tsx: Add customerSummary computation from report.entries grouped by customerName, display as a collapsible/always-visible table section.

### Remove
- Nothing removed.

## Implementation Plan
1. In NewEntry.tsx, compute `huskTotal` = sum of itemRows quantities (parse as number, ignore empty), `coconutTotal` = same for coconutRows. Render a small green/brown badge/row below the items list showing "Total: X Nos".
2. In Reports.tsx, compute `customerSummary` (useMemo) from report.entries grouping by customerName → {entryCount, totalQty, totalPayment (admin)}. Render a "Customer Summary" card with a table. When a specific customer is selected in filter, highlight their row or show a summary card.
3. Add i18n keys: `customerSummary`, `customerWise`, `totalEntries` in both English and Tamil.
