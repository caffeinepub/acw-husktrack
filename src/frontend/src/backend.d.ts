import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface HuskItem {
    itemType: ItemType;
    quantity: bigint;
}
export type VehicleId = bigint;
export type Time = bigint;
export interface CustomerV2 {
    id: CustomerId;
    customerType: string;
    name: string;
    createdAt: Time;
    phone: string;
    location: string;
}
export interface CoconutBatchEntryInput {
    customerName: string;
    vehicleNumber: string;
    createdByName: string;
    notes: string;
    customerId: CustomerId;
    items: Array<CoconutItem>;
}
export interface HuskBatchReport {
    pendingCount: bigint;
    totalPaymentAmount: bigint;
    entries: Array<HuskBatchEntry>;
    paidCount: bigint;
    totalQuantity: bigint;
}
export interface Vehicle {
    id: VehicleId;
    vehicleNumber: string;
    usageCount: bigint;
    lastUsed: Time;
}
export interface ReportFilter {
    paymentStatus?: PaymentStatus;
    endDate?: Time;
    userId?: string;
    vehicleNumber?: string;
    itemType?: ItemType;
    customerId?: CustomerId;
    startDate?: Time;
}
export interface HuskBatchEntryInput {
    customerName: string;
    vehicleNumber: string;
    createdByName: string;
    notes: string;
    customerId: CustomerId;
    items: Array<HuskItem>;
}
export interface CustomerInputV2 {
    customerType: string;
    name: string;
    phone: string;
    location: string;
}
export interface CoconutItem {
    specifyType: string;
    coconutType: CoconutType;
    quantity: bigint;
}
export type EntryId = bigint;
export type CustomerId = bigint;
export interface HuskBatchEntry {
    id: EntryId;
    customerName: string;
    paymentStatus: PaymentStatus;
    vehicleNumber: string;
    createdAt: Time;
    createdBy: Principal;
    createdByName: string;
    notes: string;
    lastModifiedAt?: Time;
    customerId: CustomerId;
    items: Array<HuskItem>;
    paymentAmount?: bigint;
    lastModifiedByName?: string;
}
export interface CoconutBatchReport {
    pendingCount: bigint;
    totalPaymentAmount: bigint;
    entries: Array<CoconutBatchEntry>;
    paidCount: bigint;
    totalQuantity: bigint;
}
export interface CoconutBatchReportFilter {
    paymentStatus?: PaymentStatus;
    endDate?: Time;
    coconutType?: CoconutType;
    vehicleNumber?: string;
    customerId?: CustomerId;
    startDate?: Time;
}
export interface CoconutBatchEntry {
    id: EntryId;
    customerName: string;
    paymentStatus: PaymentStatus;
    vehicleNumber: string;
    createdAt: Time;
    createdBy: Principal;
    createdByName: string;
    notes: string;
    lastModifiedAt?: Time;
    customerId: CustomerId;
    items: Array<CoconutItem>;
    paymentAmount?: bigint;
    lastModifiedByName?: string;
}
export interface Note {
    id: bigint;
    content: string;
    createdAt: Time;
    createdBy: Principal;
}
export enum CoconutType {
    tallu = "tallu",
    rasi = "rasi",
    others = "others"
}
export enum ItemType {
    dry = "dry",
    wet = "wet",
    motta = "motta",
    both = "both",
    husk = "husk",
    others = "others"
}
export enum PaymentStatus {
    pending = "pending",
    paid = "paid"
}
export enum UserRole {
    admin = "admin",
    staff = "staff",
    driver = "driver"
}
export interface backendInterface {
    addCoconutBatchEntry(username: string, pin: string, input: CoconutBatchEntryInput): Promise<EntryId>;
    addCoconutBatchEntryWithDate(username: string, pin: string, input: CoconutBatchEntryInput, createdAtMs: bigint): Promise<EntryId>;
    addCustomer(username: string, pin: string, input: CustomerInputV2): Promise<CustomerId>;
    addHuskBatchEntry(username: string, pin: string, input: HuskBatchEntryInput): Promise<EntryId>;
    addHuskBatchEntryWithDate(username: string, pin: string, input: HuskBatchEntryInput, createdAtMs: bigint): Promise<EntryId>;
    addNote(username: string, pin: string, content: string): Promise<bigint>;
    adminChangeUserPin(adminUsername: string, adminPin: string, targetUsername: string, newPin: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminChangeUserRole(adminUsername: string, adminPin: string, targetUsername: string, newRole: UserRole): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminCreateUser(adminUsername: string, adminPin: string, newUsername: string, newPin: string, name: string, role: UserRole): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminDeleteUser(adminUsername: string, adminPin: string, targetUsername: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminListUsers(adminUsername: string, adminPin: string): Promise<Array<{
        username: string;
        name: string;
        role: UserRole;
    }> | null>;
    changeOwnPin(username: string, oldPin: string, newPin: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteCoconutBatchEntry(username: string, pin: string, id: EntryId): Promise<void>;
    deleteCustomer(username: string, pin: string, id: CustomerId): Promise<void>;
    deleteHuskBatchEntry(username: string, pin: string, id: EntryId): Promise<void>;
    deleteVehicle(username: string, pin: string, id: VehicleId): Promise<void>;
    getAllCoconutBatchEntries(username: string, pin: string): Promise<Array<CoconutBatchEntry>>;
    getAllCoconutCustomers(username: string, pin: string): Promise<Array<CustomerV2>>;
    getAllCustomers(username: string, pin: string): Promise<Array<CustomerV2>>;
    getAllHuskBatchEntries(username: string, pin: string): Promise<Array<HuskBatchEntry>>;
    getAllHuskCustomers(username: string, pin: string): Promise<Array<CustomerV2>>;
    getAllNotes(username: string, pin: string): Promise<Array<Note>>;
    getAllVehicles(username: string, pin: string): Promise<Array<Vehicle>>;
    getCoconutBatchReport(username: string, pin: string, filter: CoconutBatchReportFilter): Promise<CoconutBatchReport>;
    getHuskBatchReport(username: string, pin: string, filter: ReportFilter): Promise<HuskBatchReport>;
    loginUser(username: string, pin: string): Promise<{
        username: string;
        name: string;
        role: UserRole;
    } | null>;
    updateCoconutBatchEntry(username: string, pin: string, id: EntryId, input: CoconutBatchEntryInput): Promise<void>;
    updateCoconutBatchPayment(username: string, pin: string, id: EntryId, status: PaymentStatus, amount: bigint | null): Promise<void>;
    updateCustomer(username: string, pin: string, id: CustomerId, input: CustomerInputV2): Promise<void>;
    updateHuskBatchEntry(username: string, pin: string, id: EntryId, input: HuskBatchEntryInput): Promise<void>;
    updateHuskBatchPayment(username: string, pin: string, id: EntryId, status: PaymentStatus, amount: bigint | null): Promise<void>;
}
