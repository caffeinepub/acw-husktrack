import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CoconutBatchReportFilter {
    endDate?: Time;
    coconutType?: CoconutType;
    vehicleNumber?: string;
    customerId?: CustomerId;
    startDate?: Time;
}
export interface HuskItem {
    itemType: ItemType;
    quantity: bigint;
}
export interface CoconutBatchReport {
    entries: Array<CoconutBatchEntry>;
    totalQuantity: bigint;
}
export type VehicleId = bigint;
export type Time = bigint;
export interface CoconutBatchEntryInput {
    customerName: string;
    vehicleNumber: string;
    createdByName: string;
    notes: string;
    customerId: CustomerId;
    items: Array<CoconutItem>;
}
export interface CoconutBatchEntry {
    id: EntryId;
    customerName: string;
    vehicleNumber: string;
    createdAt: Time;
    createdBy: Principal;
    createdByName: string;
    notes: string;
    customerId: CustomerId;
    items: Array<CoconutItem>;
}
export interface HuskEntryInput {
    customerName: string;
    vehicleNumber: string;
    createdByName: string;
    notes: string;
    itemType: ItemType;
    quantity: bigint;
    customerId: CustomerId;
}
export interface HuskBatchReport {
    entries: Array<HuskBatchEntry>;
    totalQuantity: bigint;
}
export interface Vehicle {
    id: VehicleId;
    vehicleNumber: string;
    usageCount: bigint;
    lastUsed: Time;
}
export interface ReportFilter {
    endDate?: Time;
    userId?: Principal;
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
export interface CustomerInput {
    name: string;
    phone: string;
    location: string;
}
export interface Customer {
    id: CustomerId;
    name: string;
    createdAt: Time;
    phone: string;
    location: string;
}
export interface CoconutReport {
    entries: Array<CoconutEntry>;
    totalQuantity: bigint;
}
export type EntryId = bigint;
export interface CoconutItem {
    specifyType: string;
    coconutType: CoconutType;
    quantity: bigint;
}
export type CustomerId = bigint;
export interface CoconutEntryInput {
    customerName: string;
    specifyType: string;
    coconutType: CoconutType;
    vehicleNumber: string;
    createdByName: string;
    notes: string;
    quantity: bigint;
    customerId: CustomerId;
}
export interface HuskBatchEntry {
    id: EntryId;
    customerName: string;
    vehicleNumber: string;
    createdAt: Time;
    createdBy: Principal;
    createdByName: string;
    notes: string;
    customerId: CustomerId;
    items: Array<HuskItem>;
}
export interface HuskEntry {
    id: EntryId;
    customerName: string;
    vehicleNumber: string;
    createdAt: Time;
    createdBy: Principal;
    createdByName: string;
    notes: string;
    itemType: ItemType;
    quantity: bigint;
    customerId: CustomerId;
}
export interface CoconutEntry {
    id: EntryId;
    customerName: string;
    specifyType: string;
    coconutType: CoconutType;
    vehicleNumber: string;
    createdAt: Time;
    createdBy: Principal;
    createdByName: string;
    notes: string;
    quantity: bigint;
    customerId: CustomerId;
}
export interface UserProfile {
    name: string;
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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCoconutBatchEntry(input: CoconutBatchEntryInput): Promise<EntryId>;
    addCoconutEntry(input: CoconutEntryInput): Promise<EntryId>;
    addCustomer(input: CustomerInput): Promise<CustomerId>;
    addEntry(input: HuskEntryInput): Promise<EntryId>;
    addHuskBatchEntry(input: HuskBatchEntryInput): Promise<EntryId>;
    addNote(content: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteCoconutBatchEntry(id: EntryId): Promise<void>;
    deleteCoconutEntry(id: EntryId): Promise<void>;
    deleteCustomer(id: CustomerId): Promise<void>;
    deleteEntry(id: EntryId): Promise<void>;
    deleteHuskBatchEntry(id: EntryId): Promise<void>;
    deleteVehicle(id: VehicleId): Promise<void>;
    getAllCoconutBatchEntries(): Promise<Array<CoconutBatchEntry>>;
    getAllCoconutEntries(): Promise<Array<CoconutEntry>>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllEntries(): Promise<Array<HuskEntry>>;
    getAllHuskBatchEntries(): Promise<Array<HuskBatchEntry>>;
    getAllNotes(): Promise<Array<Note>>;
    getAllVehicles(): Promise<Array<Vehicle>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCoconutBatchEntry(id: EntryId): Promise<CoconutBatchEntry>;
    getCoconutBatchReport(filter: CoconutBatchReportFilter): Promise<CoconutBatchReport>;
    getCoconutEntry(id: EntryId): Promise<CoconutEntry>;
    getCoconutReport(filter: {
        endDate?: Time;
        coconutType?: CoconutType;
        vehicleNumber?: string;
        customerId?: CustomerId;
        startDate?: Time;
    }): Promise<CoconutReport>;
    getCustomer(id: CustomerId): Promise<Customer>;
    getEntry(id: EntryId): Promise<HuskEntry>;
    getHuskBatchEntry(id: EntryId): Promise<HuskBatchEntry>;
    getHuskBatchReport(filter: ReportFilter): Promise<HuskBatchReport>;
    getReport(filter: ReportFilter): Promise<{
        entries: Array<HuskEntry>;
        totalQuantity: bigint;
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCoconutBatchEntry(id: EntryId, input: CoconutBatchEntryInput): Promise<void>;
    updateCoconutEntry(id: EntryId, input: CoconutEntryInput): Promise<void>;
    updateCustomer(id: CustomerId, input: CustomerInput): Promise<void>;
    updateEntry(id: EntryId, input: HuskEntryInput): Promise<void>;
    updateHuskBatchEntry(id: EntryId, input: HuskBatchEntryInput): Promise<void>;
}
