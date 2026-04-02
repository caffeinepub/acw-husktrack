// Offline-first customer store (localStorage) -- same pattern as auth.

const CUSTOMERS_KEY = "acw_customers";

export interface LocalCustomer {
  id: number;
  name: string;
  phone: string;
  location: string;
  customerType: "husk" | "coconut";
  syncedBackendId?: number;
}

function readAll(): LocalCustomer[] {
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    return raw ? (JSON.parse(raw) as LocalCustomer[]) : [];
  } catch {
    return [];
  }
}

function writeAll(customers: LocalCustomer[]) {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

export function getAllCustomers(): LocalCustomer[] {
  return readAll();
}

export function getHuskCustomers(): LocalCustomer[] {
  return readAll().filter((c) => c.customerType === "husk");
}

export function getCoconutCustomers(): LocalCustomer[] {
  return readAll().filter((c) => c.customerType === "coconut");
}

export function addLocalCustomer(
  name: string,
  phone: string,
  location: string,
  customerType: "husk" | "coconut",
): LocalCustomer {
  const all = readAll();
  const id = Date.now() + Math.floor(Math.random() * 1000);
  const customer: LocalCustomer = { id, name, phone, location, customerType };
  all.push(customer);
  writeAll(all);
  return customer;
}

export function updateLocalCustomer(
  id: number,
  patch: Partial<Omit<LocalCustomer, "id">>,
): void {
  const all = readAll().map((c) => (c.id === id ? { ...c, ...patch } : c));
  writeAll(all);
}

export function deleteLocalCustomer(id: number): void {
  writeAll(readAll().filter((c) => c.id !== id));
}

export function deleteAllCustomers(): void {
  writeAll([]);
}
