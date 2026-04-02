/**
 * Sync service: pushes local-only data to ICP backend,
 * then pulls all backend data and merges locally.
 */

const LAST_SYNC_KEY = "acw_last_sync";
const HUSK_KEY = "acw_husk_entries";
const COCONUT_KEY = "acw_coconut_entries";
const CUSTOMERS_KEY = "acw_customers";
const VEHICLE_KEY = "acw_local_vehicles";

// ---------- Stored shapes (must match useLocalEntries / useLocalCustomers) ----------

interface StoredHuskEntry {
  id: number;
  customerId: number;
  customerName: string;
  items: Array<{ itemType: string; quantity: number }>;
  vehicleNumber: string;
  notes: string;
  createdAtMs: number;
  createdByName: string;
  paymentPaid: boolean;
  paymentAmount: number | null;
  lastModifiedAtMs?: number;
  lastModifiedByName?: string;
  syncedBackendId?: number;
}

interface StoredCoconutEntry {
  id: number;
  customerId: number;
  customerName: string;
  items: Array<{ coconutType: string; specifyType: string; quantity: number }>;
  vehicleNumber: string;
  notes: string;
  createdAtMs: number;
  createdByName: string;
  paymentPaid: boolean;
  paymentAmount: number | null;
  lastModifiedAtMs?: number;
  lastModifiedByName?: string;
  syncedBackendId?: number;
}

interface LocalCustomer {
  id: number;
  name: string;
  phone: string;
  location: string;
  customerType: "husk" | "coconut";
  syncedBackendId?: number;
}

interface StoredVehicle {
  id: number;
  vehicleNumber: string;
  usageCount: number;
}

// ---------- Helpers ----------

function readLS<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeLS<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

function toItemTypeVariant(s: string): any {
  const map: Record<string, any> = {
    husk: { husk: null },
    dry: { dry: null },
    wet: { wet: null },
    both: { both: null },
    motta: { motta: null },
    others: { others: null },
  };
  return map[s] ?? { others: null };
}

function toCoconutTypeVariant(s: string): any {
  const map: Record<string, any> = {
    rasi: { rasi: null },
    tallu: { tallu: null },
    others: { others: null },
  };
  return map[s] ?? { others: null };
}

function fromItemTypeVariant(v: any): string {
  if ("husk" in v) return "husk";
  if ("dry" in v) return "dry";
  if ("wet" in v) return "wet";
  if ("both" in v) return "both";
  if ("motta" in v) return "motta";
  return "others";
}

function fromCoconutTypeVariant(v: any): string {
  if ("rasi" in v) return "rasi";
  if ("tallu" in v) return "tallu";
  return "others";
}

function nsToMs(ns: bigint): number {
  return Number(ns / 1_000_000n);
}

// ---------- Public API ----------

export function getLastSyncTime(): Date | null {
  const val = localStorage.getItem(LAST_SYNC_KEY);
  return val ? new Date(Number(val)) : null;
}

export function getUnsyncedCount(): number {
  const husk = readLS<StoredHuskEntry>(HUSK_KEY).filter(
    (e) => !e.syncedBackendId,
  ).length;
  const coconut = readLS<StoredCoconutEntry>(COCONUT_KEY).filter(
    (e) => !e.syncedBackendId,
  ).length;
  const customers = readLS<LocalCustomer>(CUSTOMERS_KEY).filter(
    (c) => !c.syncedBackendId,
  ).length;
  return husk + coconut + customers;
}

export async function syncAll(
  actor: any,
  username: string,
  pin: string,
): Promise<void> {
  // ── Push local-only customers ──────────────────────────────────────────
  {
    const customers = readLS<LocalCustomer>(CUSTOMERS_KEY);
    for (const c of customers) {
      if (c.syncedBackendId) continue;
      try {
        const backendId = await actor.addCustomer(username, pin, {
          name: c.name,
          phone: c.phone,
          location: c.location,
          customerType: c.customerType,
        });
        c.syncedBackendId = Number(backendId);
      } catch {
        /* skip on error, will retry next sync */
      }
    }
    writeLS(CUSTOMERS_KEY, customers);
  }

  // ── Pull customers from backend ────────────────────────────────────────
  {
    const backendCustomers = await actor.getAllCustomers(username, pin);
    const local = readLS<LocalCustomer>(CUSTOMERS_KEY);
    for (const bc of backendCustomers) {
      const backendId = Number(bc.id);
      const existing = local.find(
        (c: LocalCustomer) => c.syncedBackendId === backendId,
      );
      if (!existing) {
        local.push({
          id: Date.now() + Math.floor(Math.random() * 9999),
          name: bc.name,
          phone: bc.phone,
          location: bc.location,
          customerType: bc.customerType as "husk" | "coconut",
          syncedBackendId: backendId,
        });
      } else {
        existing.name = bc.name;
        existing.phone = bc.phone;
        existing.location = bc.location;
        existing.customerType = bc.customerType as "husk" | "coconut";
      }
    }
    writeLS(CUSTOMERS_KEY, local);
  }

  // ── Push local-only husk entries ──────────────────────────────────────
  {
    const entries = readLS<StoredHuskEntry>(HUSK_KEY);
    for (const e of entries) {
      if (e.syncedBackendId) continue;
      try {
        const backendId = await actor.addHuskBatchEntry(username, pin, {
          customerId: BigInt(e.customerId),
          customerName: e.customerName,
          items: e.items.map((i) => ({
            itemType: toItemTypeVariant(i.itemType),
            quantity: BigInt(i.quantity),
          })),
          vehicleNumber: e.vehicleNumber,
          notes: e.notes,
          createdByName: e.createdByName,
        });
        e.syncedBackendId = Number(backendId);
      } catch {
        /* skip */
      }
    }
    writeLS(HUSK_KEY, entries);
  }

  // ── Pull husk entries from backend ────────────────────────────────────
  {
    const backendEntries = await actor.getAllHuskBatchEntries(username, pin);
    const local = readLS<StoredHuskEntry>(HUSK_KEY);
    for (const be of backendEntries) {
      const backendId = Number(be.id);
      const existing = local.find(
        (e: StoredHuskEntry) => e.syncedBackendId === backendId,
      );
      const isPaid = "paid" in (be.paymentStatus as object);
      const payAmt =
        be.paymentAmount.length > 0 ? Number(be.paymentAmount[0]) : null;
      if (!existing) {
        local.push({
          id: Date.now() + Math.floor(Math.random() * 9999),
          customerId: Number(be.customerId),
          customerName: be.customerName,
          items: be.items.map((i: any) => ({
            itemType: fromItemTypeVariant(i.itemType),
            quantity: Number(i.quantity),
          })),
          vehicleNumber: be.vehicleNumber,
          notes: be.notes,
          createdAtMs: nsToMs(be.createdAt),
          createdByName: be.createdByName,
          paymentPaid: isPaid,
          paymentAmount: payAmt,
          syncedBackendId: backendId,
        });
      } else {
        existing.paymentPaid = isPaid;
        existing.paymentAmount = payAmt;
      }
    }
    writeLS(HUSK_KEY, local);
  }

  // ── Push local-only coconut entries ──────────────────────────────────
  {
    const entries = readLS<StoredCoconutEntry>(COCONUT_KEY);
    for (const e of entries) {
      if (e.syncedBackendId) continue;
      try {
        const backendId = await actor.addCoconutBatchEntry(username, pin, {
          customerId: BigInt(e.customerId),
          customerName: e.customerName,
          items: e.items.map((i) => ({
            coconutType: toCoconutTypeVariant(i.coconutType),
            specifyType: i.specifyType,
            quantity: BigInt(i.quantity),
          })),
          vehicleNumber: e.vehicleNumber,
          notes: e.notes,
          createdByName: e.createdByName,
        });
        e.syncedBackendId = Number(backendId);
      } catch {
        /* skip */
      }
    }
    writeLS(COCONUT_KEY, entries);
  }

  // ── Pull coconut entries from backend ────────────────────────────────
  {
    const backendEntries = await actor.getAllCoconutBatchEntries(username, pin);
    const local = readLS<StoredCoconutEntry>(COCONUT_KEY);
    for (const be of backendEntries) {
      const backendId = Number(be.id);
      const existing = local.find(
        (e: StoredCoconutEntry) => e.syncedBackendId === backendId,
      );
      const isPaid = "paid" in (be.paymentStatus as object);
      const payAmt =
        be.paymentAmount.length > 0 ? Number(be.paymentAmount[0]) : null;
      if (!existing) {
        local.push({
          id: Date.now() + Math.floor(Math.random() * 9999),
          customerId: Number(be.customerId),
          customerName: be.customerName,
          items: be.items.map((i: any) => ({
            coconutType: fromCoconutTypeVariant(i.coconutType),
            specifyType: i.specifyType,
            quantity: Number(i.quantity),
          })),
          vehicleNumber: be.vehicleNumber,
          notes: be.notes,
          createdAtMs: nsToMs(be.createdAt),
          createdByName: be.createdByName,
          paymentPaid: isPaid,
          paymentAmount: payAmt,
          syncedBackendId: backendId,
        });
      } else {
        existing.paymentPaid = isPaid;
        existing.paymentAmount = payAmt;
      }
    }
    writeLS(COCONUT_KEY, local);
  }

  // ── Pull vehicles ────────────────────────────────────────────────────────
  try {
    const backendVehicles = await actor.getAllVehicles(username, pin);
    const local = readLS<StoredVehicle>(VEHICLE_KEY);
    for (const bv of backendVehicles) {
      const exists = local.find(
        (v: StoredVehicle) =>
          v.vehicleNumber.toLowerCase() === bv.vehicleNumber.toLowerCase(),
      );
      if (!exists) {
        local.push({
          id: Date.now() + Math.floor(Math.random() * 9999),
          vehicleNumber: bv.vehicleNumber,
          usageCount: Number(bv.usageCount),
        });
      }
    }
    writeLS(VEHICLE_KEY, local);
  } catch {
    /* ignore vehicle pull errors */
  }

  // ── Record last sync time ──────────────────────────────────────────────
  localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
}
