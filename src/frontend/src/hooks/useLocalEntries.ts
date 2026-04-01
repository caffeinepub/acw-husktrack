/**
 * Offline-first entry store (localStorage).
 * Data is stored as plain JSON (numbers) and returned as BigInt-typed
 * objects that match the HuskBatchEntry / CoconutBatchEntry backend shapes.
 */

import type {
  CoconutBatchEntry,
  CoconutBatchEntryInput,
  CoconutItem,
  HuskBatchEntry,
  HuskBatchEntryInput,
  HuskItem,
} from "../backend";

export type LocalPaymentStatus = { paid: null } | { pending: null };

const HUSK_KEY = "acw_husk_entries";
const COCONUT_KEY = "acw_coconut_entries";
const VEHICLE_KEY = "acw_local_vehicles";

// Serialised shapes (JSON-safe)
interface StoredHuskEntry {
  id: number;
  customerId: number;
  customerName: string;
  items: Array<{ itemType: string; quantity: number }>;
  vehicleNumber: string;
  notes: string;
  createdAtMs: number; // milliseconds
  createdByName: string;
  paymentPaid: boolean;
  paymentAmount: number | null;
  lastModifiedAtMs?: number;
  lastModifiedByName?: string;
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
}

interface StoredVehicle {
  id: number;
  vehicleNumber: string;
  usageCount: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function readAll<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeAll<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

function msToBigIntNs(ms: number): bigint {
  return BigInt(ms) * 1_000_000n;
}

function toPaymentStatus(paid: boolean): LocalPaymentStatus {
  return paid ? { paid: null } : { pending: null };
}

// ── Husk entries ─────────────────────────────────────────────────────────────

function readHusk(): StoredHuskEntry[] {
  return readAll<StoredHuskEntry>(HUSK_KEY);
}

function storedToHusk(s: StoredHuskEntry): HuskBatchEntry {
  return {
    id: BigInt(s.id),
    customerId: BigInt(s.customerId),
    customerName: s.customerName,
    items: s.items.map(
      (i) =>
        ({
          itemType: i.itemType as HuskItem["itemType"],
          quantity: BigInt(i.quantity),
        }) as HuskItem,
    ),
    vehicleNumber: s.vehicleNumber,
    notes: s.notes,
    createdAt: msToBigIntNs(s.createdAtMs),
    createdBy: null,
    createdByName: s.createdByName,
    paymentStatus: toPaymentStatus(s.paymentPaid),
    paymentAmount: s.paymentAmount !== null ? [BigInt(s.paymentAmount)] : [],
    lastModifiedAt:
      s.lastModifiedAtMs !== undefined
        ? [msToBigIntNs(s.lastModifiedAtMs)]
        : [],
    lastModifiedByName:
      s.lastModifiedByName !== undefined ? [s.lastModifiedByName] : [],
  } as unknown as HuskBatchEntry;
}

export function getAllLocalHuskEntries(): HuskBatchEntry[] {
  return readHusk().map(storedToHusk);
}

export function addLocalHuskEntry(input: HuskBatchEntryInput): HuskBatchEntry {
  const all = readHusk();
  const id = Date.now() + Math.floor(Math.random() * 999);
  const stored: StoredHuskEntry = {
    id,
    customerId: Number(input.customerId),
    customerName: input.customerName,
    items: input.items.map((i) => ({
      itemType: i.itemType as string,
      quantity: Number(i.quantity),
    })),
    vehicleNumber: input.vehicleNumber,
    notes: input.notes,
    createdAtMs: Date.now(),
    createdByName: input.createdByName,
    paymentPaid: false,
    paymentAmount: null,
  };
  all.push(stored);
  writeAll(HUSK_KEY, all);
  upsertLocalVehicle(input.vehicleNumber);
  return storedToHusk(stored);
}

export function updateLocalHuskEntry(
  id: bigint,
  input: HuskBatchEntryInput,
  editorName?: string,
): void {
  const all = readHusk();
  const idx = all.findIndex((e) => e.id === Number(id));
  if (idx === -1) return;
  const existing = all[idx];
  all[idx] = {
    ...existing,
    customerId: Number(input.customerId),
    customerName: input.customerName,
    items: input.items.map((i) => ({
      itemType: i.itemType as string,
      quantity: Number(i.quantity),
    })),
    vehicleNumber: input.vehicleNumber,
    notes: input.notes,
    ...(editorName
      ? { lastModifiedAtMs: Date.now(), lastModifiedByName: editorName }
      : {}),
  };
  writeAll(HUSK_KEY, all);
  upsertLocalVehicle(input.vehicleNumber);
}

export function deleteLocalHuskEntry(id: bigint): void {
  writeAll(
    HUSK_KEY,
    readHusk().filter((e) => e.id !== Number(id)),
  );
}

export function updateLocalHuskPayment(
  id: bigint,
  status: LocalPaymentStatus,
  amount: [] | [bigint],
): void {
  const all = readHusk();
  const idx = all.findIndex((e) => e.id === Number(id));
  if (idx === -1) return;
  all[idx] = {
    ...all[idx],
    paymentPaid: "paid" in status,
    paymentAmount: amount.length > 0 ? Number(amount[0]) : null,
  };
  writeAll(HUSK_KEY, all);
}

// ── Coconut entries ───────────────────────────────────────────────────────────

function readCoconut(): StoredCoconutEntry[] {
  return readAll<StoredCoconutEntry>(COCONUT_KEY);
}

function storedToCoconut(s: StoredCoconutEntry): CoconutBatchEntry {
  return {
    id: BigInt(s.id),
    customerId: BigInt(s.customerId),
    customerName: s.customerName,
    items: s.items.map(
      (i) =>
        ({
          coconutType: i.coconutType as CoconutItem["coconutType"],
          specifyType: i.specifyType,
          quantity: BigInt(i.quantity),
        }) as CoconutItem,
    ),
    vehicleNumber: s.vehicleNumber,
    notes: s.notes,
    createdAt: msToBigIntNs(s.createdAtMs),
    createdBy: null,
    createdByName: s.createdByName,
    paymentStatus: toPaymentStatus(s.paymentPaid),
    paymentAmount: s.paymentAmount !== null ? [BigInt(s.paymentAmount)] : [],
    lastModifiedAt:
      s.lastModifiedAtMs !== undefined
        ? [msToBigIntNs(s.lastModifiedAtMs)]
        : [],
    lastModifiedByName:
      s.lastModifiedByName !== undefined ? [s.lastModifiedByName] : [],
  } as unknown as CoconutBatchEntry;
}

export function getAllLocalCoconutEntries(): CoconutBatchEntry[] {
  return readCoconut().map(storedToCoconut);
}

export function addLocalCoconutEntry(
  input: CoconutBatchEntryInput,
): CoconutBatchEntry {
  const all = readCoconut();
  const id = Date.now() + Math.floor(Math.random() * 999);
  const stored: StoredCoconutEntry = {
    id,
    customerId: Number(input.customerId),
    customerName: input.customerName,
    items: input.items.map((i) => ({
      coconutType: i.coconutType as string,
      specifyType: i.specifyType,
      quantity: Number(i.quantity),
    })),
    vehicleNumber: input.vehicleNumber,
    notes: input.notes,
    createdAtMs: Date.now(),
    createdByName: input.createdByName,
    paymentPaid: false,
    paymentAmount: null,
  };
  all.push(stored);
  writeAll(COCONUT_KEY, all);
  upsertLocalVehicle(input.vehicleNumber);
  return storedToCoconut(stored);
}

export function updateLocalCoconutEntry(
  id: bigint,
  input: CoconutBatchEntryInput,
  editorName?: string,
): void {
  const all = readCoconut();
  const idx = all.findIndex((e) => e.id === Number(id));
  if (idx === -1) return;
  const existing = all[idx];
  all[idx] = {
    ...existing,
    customerId: Number(input.customerId),
    customerName: input.customerName,
    items: input.items.map((i) => ({
      coconutType: i.coconutType as string,
      specifyType: i.specifyType,
      quantity: Number(i.quantity),
    })),
    vehicleNumber: input.vehicleNumber,
    notes: input.notes,
    ...(editorName
      ? { lastModifiedAtMs: Date.now(), lastModifiedByName: editorName }
      : {}),
  };
  writeAll(COCONUT_KEY, all);
  upsertLocalVehicle(input.vehicleNumber);
}

export function deleteLocalCoconutEntry(id: bigint): void {
  writeAll(
    COCONUT_KEY,
    readCoconut().filter((e) => e.id !== Number(id)),
  );
}

export function updateLocalCoconutPayment(
  id: bigint,
  status: LocalPaymentStatus,
  amount: [] | [bigint],
): void {
  const all = readCoconut();
  const idx = all.findIndex((e) => e.id === Number(id));
  if (idx === -1) return;
  all[idx] = {
    ...all[idx],
    paymentPaid: "paid" in status,
    paymentAmount: amount.length > 0 ? Number(amount[0]) : null,
  };
  writeAll(COCONUT_KEY, all);
}

// ── Local vehicles (fallback for dropdown) ───────────────────────────────────

function readVehicles(): StoredVehicle[] {
  return readAll<StoredVehicle>(VEHICLE_KEY);
}

function upsertLocalVehicle(vehicleNumber: string) {
  if (!vehicleNumber.trim()) return;
  const all = readVehicles();
  const idx = all.findIndex(
    (v) => v.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase(),
  );
  if (idx >= 0) {
    all[idx].usageCount++;
  } else {
    all.push({
      id: Date.now() + Math.floor(Math.random() * 999),
      vehicleNumber,
      usageCount: 1,
    });
  }
  writeAll(VEHICLE_KEY, all);
}

export function getLocalVehicles() {
  return readVehicles().map((v) => ({
    id: BigInt(v.id),
    vehicleNumber: v.vehicleNumber,
    usageCount: BigInt(v.usageCount),
  }));
}
