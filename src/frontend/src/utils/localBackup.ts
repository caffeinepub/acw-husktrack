/**
 * Local data backup/restore utility.
 * Exports all offline data (entries, customers, vehicles) as a JSON file.
 * Restore imports a previously exported JSON and merges into localStorage.
 */

const HUSK_KEY = "acw_husk_entries";
const COCONUT_KEY = "acw_coconut_entries";
const CUSTOMERS_KEY = "acw_customers";
const VEHICLE_KEY = "acw_local_vehicles";

const BACKUP_VERSION = 1;

export interface LocalBackupData {
  version: number;
  exportedAt: string;
  huskEntries: unknown[];
  coconutEntries: unknown[];
  customers: unknown[];
  vehicles: unknown[];
}

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

/**
 * Export all offline data as a downloadable JSON file.
 */
export function exportLocalBackup(): void {
  const data: LocalBackupData = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    huskEntries: readLS(HUSK_KEY),
    coconutEntries: readLS(COCONUT_KEY),
    customers: readLS(CUSTOMERS_KEY),
    vehicles: readLS(VEHICLE_KEY),
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `acw-husktrack-backup-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Returns counts of data in current localStorage.
 */
export function getLocalDataCounts() {
  return {
    huskEntries: readLS(HUSK_KEY).length,
    coconutEntries: readLS(COCONUT_KEY).length,
    customers: readLS(CUSTOMERS_KEY).length,
    vehicles: readLS(VEHICLE_KEY).length,
  };
}

/**
 * Import/restore backup from a JSON file.
 * Merges: existing records are kept; new records from backup are added if not already present (by id).
 * Returns a summary of what was added.
 */
export function importLocalBackup(data: LocalBackupData): {
  addedHusk: number;
  addedCoconut: number;
  addedCustomers: number;
  addedVehicles: number;
} {
  let addedHusk = 0;
  let addedCoconut = 0;
  let addedCustomers = 0;
  let addedVehicles = 0;

  // Merge husk entries
  {
    const existing = readLS<{ id: number }>(HUSK_KEY);
    const existingIds = new Set(existing.map((e) => e.id));
    const toAdd = (data.huskEntries as Array<{ id: number }>).filter(
      (e) => !existingIds.has(e.id),
    );
    if (toAdd.length > 0) {
      writeLS(HUSK_KEY, [...existing, ...toAdd]);
      addedHusk = toAdd.length;
    }
  }

  // Merge coconut entries
  {
    const existing = readLS<{ id: number }>(COCONUT_KEY);
    const existingIds = new Set(existing.map((e) => e.id));
    const toAdd = (data.coconutEntries as Array<{ id: number }>).filter(
      (e) => !existingIds.has(e.id),
    );
    if (toAdd.length > 0) {
      writeLS(COCONUT_KEY, [...existing, ...toAdd]);
      addedCoconut = toAdd.length;
    }
  }

  // Merge customers
  {
    const existing = readLS<{ id: number }>(CUSTOMERS_KEY);
    const existingIds = new Set(existing.map((c) => c.id));
    const toAdd = (data.customers as Array<{ id: number }>).filter(
      (c) => !existingIds.has(c.id),
    );
    if (toAdd.length > 0) {
      writeLS(CUSTOMERS_KEY, [...existing, ...toAdd]);
      addedCustomers = toAdd.length;
    }
  }

  // Merge vehicles
  {
    const existing = readLS<{ vehicleNumber: string }>(VEHICLE_KEY);
    const existingNums = new Set(
      existing.map((v) => v.vehicleNumber.toLowerCase()),
    );
    const toAdd = (data.vehicles as Array<{ vehicleNumber: string }>).filter(
      (v) => !existingNums.has(v.vehicleNumber.toLowerCase()),
    );
    if (toAdd.length > 0) {
      writeLS(VEHICLE_KEY, [...existing, ...toAdd]);
      addedVehicles = toAdd.length;
    }
  }

  return { addedHusk, addedCoconut, addedCustomers, addedVehicles };
}
