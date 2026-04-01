import type { ActorSubclass } from "@icp-sdk/core";

export type UserRole = { admin: null } | { staff: null };
export type PaymentStatus = { paid: null } | { pending: null };
export type ItemType =
  | { husk: null }
  | { dry: null }
  | { wet: null }
  | { both: null }
  | { motta: null }
  | { others: null };
export type CoconutType = { rasi: null } | { tallu: null } | { others: null };

export interface Customer {
  id: bigint;
  name: string;
  phone: string;
  location: string;
  customerType: string;
  createdAt: bigint;
}

export interface CustomerInput {
  name: string;
  phone: string;
  location: string;
  customerType: string;
}

export interface Vehicle {
  id: bigint;
  vehicleNumber: string;
  usageCount: bigint;
  lastUsed: bigint;
}

export interface Note {
  id: bigint;
  content: string;
  createdAt: bigint;
  createdBy: unknown;
}

export interface HuskItem {
  itemType: ItemType;
  quantity: bigint;
}

export interface CoconutItem {
  coconutType: CoconutType;
  specifyType: string;
  quantity: bigint;
}

export interface HuskBatchEntry {
  id: bigint;
  customerId: bigint;
  customerName: string;
  items: HuskItem[];
  vehicleNumber: string;
  notes: string;
  createdAt: bigint;
  createdBy: unknown;
  createdByName: string;
  paymentStatus: PaymentStatus;
  paymentAmount: [] | [bigint];
}

export interface HuskBatchEntryInput {
  customerId: bigint;
  customerName: string;
  items: HuskItem[];
  vehicleNumber: string;
  notes: string;
  createdByName: string;
}

export interface CoconutBatchEntry {
  id: bigint;
  customerId: bigint;
  customerName: string;
  items: CoconutItem[];
  vehicleNumber: string;
  notes: string;
  createdAt: bigint;
  createdBy: unknown;
  createdByName: string;
  paymentStatus: PaymentStatus;
  paymentAmount: [] | [bigint];
}

export interface CoconutBatchEntryInput {
  customerId: bigint;
  customerName: string;
  items: CoconutItem[];
  vehicleNumber: string;
  notes: string;
  createdByName: string;
}

export interface ReportFilter {
  startDate: [] | [bigint];
  endDate: [] | [bigint];
  customerId: [] | [bigint];
  vehicleNumber: [] | [string];
  itemType: [] | [ItemType];
  userId: [] | [string];
  paymentStatus: [] | [PaymentStatus];
}

export interface HuskBatchReport {
  entries: HuskBatchEntry[];
  totalQuantity: bigint;
  paidCount: bigint;
  pendingCount: bigint;
  totalPaymentAmount: bigint;
}

export interface CoconutBatchReportFilter {
  startDate: [] | [bigint];
  endDate: [] | [bigint];
  customerId: [] | [bigint];
  vehicleNumber: [] | [string];
  coconutType: [] | [CoconutType];
  paymentStatus: [] | [PaymentStatus];
}

export interface CoconutBatchReport {
  entries: CoconutBatchEntry[];
  totalQuantity: bigint;
  paidCount: bigint;
  pendingCount: bigint;
  totalPaymentAmount: bigint;
}

export interface AppUserPublic {
  username: string;
  name: string;
  role: UserRole;
}

export interface BackendActor {
  // Auth / User Management
  loginUser(
    username: string,
    pin: string,
  ): Promise<[] | [{ username: string; name: string; role: UserRole }]>;
  adminCreateUser(
    adminUsername: string,
    adminPin: string,
    newUsername: string,
    newPin: string,
    name: string,
    role: UserRole,
  ): Promise<{ ok: null } | { err: string }>;
  adminChangeUserRole(
    adminUsername: string,
    adminPin: string,
    targetUsername: string,
    newRole: UserRole,
  ): Promise<{ ok: null } | { err: string }>;
  adminChangeUserPin(
    adminUsername: string,
    adminPin: string,
    targetUsername: string,
    newPin: string,
  ): Promise<{ ok: null } | { err: string }>;
  adminListUsers(
    adminUsername: string,
    adminPin: string,
  ): Promise<[] | [AppUserPublic[]]>;
  adminDeleteUser(
    adminUsername: string,
    adminPin: string,
    targetUsername: string,
  ): Promise<{ ok: null } | { err: string }>;
  changeOwnPin(
    username: string,
    oldPin: string,
    newPin: string,
  ): Promise<{ ok: null } | { err: string }>;

  // Customers
  addCustomer(
    username: string,
    pin: string,
    input: CustomerInput,
  ): Promise<bigint>;
  updateCustomer(
    username: string,
    pin: string,
    id: bigint,
    input: CustomerInput,
  ): Promise<void>;
  deleteCustomer(
    username: string,
    pin: string,
    id: bigint,
  ): Promise<void>;
  getAllCustomers(username: string, pin: string): Promise<Customer[]>;
  getAllHuskCustomers(username: string, pin: string): Promise<Customer[]>;
  getAllCoconutCustomers(username: string, pin: string): Promise<Customer[]>;

  // Vehicles
  getAllVehicles(username: string, pin: string): Promise<Vehicle[]>;
  deleteVehicle(username: string, pin: string, id: bigint): Promise<void>;

  // Husk Batch Entries
  addHuskBatchEntry(
    username: string,
    pin: string,
    input: HuskBatchEntryInput,
  ): Promise<bigint>;
  getAllHuskBatchEntries(
    username: string,
    pin: string,
  ): Promise<HuskBatchEntry[]>;
  updateHuskBatchEntry(
    username: string,
    pin: string,
    id: bigint,
    input: HuskBatchEntryInput,
  ): Promise<void>;
  deleteHuskBatchEntry(
    username: string,
    pin: string,
    id: bigint,
  ): Promise<void>;
  updateHuskBatchPayment(
    username: string,
    pin: string,
    id: bigint,
    status: PaymentStatus,
    amount: [] | [bigint],
  ): Promise<void>;
  getHuskBatchReport(
    username: string,
    pin: string,
    filter: ReportFilter,
  ): Promise<HuskBatchReport>;

  // Coconut Batch Entries
  addCoconutBatchEntry(
    username: string,
    pin: string,
    input: CoconutBatchEntryInput,
  ): Promise<bigint>;
  getAllCoconutBatchEntries(
    username: string,
    pin: string,
  ): Promise<CoconutBatchEntry[]>;
  updateCoconutBatchEntry(
    username: string,
    pin: string,
    id: bigint,
    input: CoconutBatchEntryInput,
  ): Promise<void>;
  deleteCoconutBatchEntry(
    username: string,
    pin: string,
    id: bigint,
  ): Promise<void>;
  updateCoconutBatchPayment(
    username: string,
    pin: string,
    id: bigint,
    status: PaymentStatus,
    amount: [] | [bigint],
  ): Promise<void>;
  getCoconutBatchReport(
    username: string,
    pin: string,
    filter: CoconutBatchReportFilter,
  ): Promise<CoconutBatchReport>;

  // Notes
  addNote(username: string, pin: string, content: string): Promise<bigint>;
  getAllNotes(username: string, pin: string): Promise<Note[]>;
}

export { UserRole };

declare const backend: ActorSubclass<BackendActor>;
export default backend;
