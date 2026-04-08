import { type ReactNode, createContext, useContext, useState } from "react";

type Lang = "en" | "ta";

const translations = {
  en: {
    dashboard: "Dashboard",
    addEntry: "Add Entry",
    entries: "Entries",
    customers: "Customers",
    reports: "Reports",
    vehicles: "Vehicles",
    notes: "Notes",
    settings: "Settings",
    quantity: "Quantity",
    itemType: "Item Type",
    vehicleNumber: "Vehicle Number",
    search: "Search",
    submit: "Submit",
    cancel: "Cancel",
    name: "Name",
    phone: "Phone",
    location: "Location",
    notes_label: "Notes",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    save: "Save",
    welcome: "Welcome",
    today: "Today",
    totalQuantity: "Total Quantity",
    loading: "Loading...",
    error: "Error",
    more: "More",
    customer: "Customer",
    date: "Date",
    filter: "Filter",
    generate: "Generate Report",
    noData: "No data found",
    logout: "Logout",
    role: "Role",
    language: "Language",
    profile: "Profile",
    entriesCount: "Entries Today",
    topVehicle: "Top Vehicle",
    totalCustomers: "Total Customers",
    recentEntries: "Recent Entries",
    last7Days: "Last 7 Days",
    addCustomer: "Add Customer",
    addNote: "Add Note",
    noteContent: "Note content...",
    usageCount: "Usage Count",
    setupProfile: "Setup Profile",
    enterName: "Enter your name",
    continue: "Continue",
    husk: "Husk",
    dry: "Dry",
    wet: "Wet",
    both: "Both",
    motta: "Motta",
    others: "Others",
    addItem: "Add Item",
    coconut: "Coconut",
    coconutEntry: "Coconut Entry",
    huskEntry: "Husk Entry",
    entryType: "Entry Type",
    coconutType: "Coconut Type",
    rasi: "Rasi",
    tallu: "Tallu",
    specifyType: "Specify Type",
    coconutEntries: "Coconut Entries",
    all: "All",
    thisWeek: "This Week",
    thisMonth: "This Month",
    results: "results",
    exportCSV: "Export CSV",
    printReport: "Print Report",
    shareReport: "Share Report",
    monthlyView: "Monthly View",
    hideMonthly: "Hide Monthly",
    monthlySummary: "Monthly Summary",
    resetPIN: "Reset PIN",
    changePIN: "Change PIN",
    huskCustomers: "Husk Customers",
    coconutCustomers: "Coconut Customers",
    quickEntry: "Quick Entry",
    syncData: "Sync Data",
    syncNow: "Sync Now",
    lastSynced: "Last Synced",
    syncing: "Syncing...",
    syncSuccess: "Data synced successfully",
    syncFailed: "Sync failed. Check connection.",
    unsyncedItems: "unsynced items",
    entryDate: "Entry Date",
    searchCustomers: "Search customers...",
    entryDetail: "Entry Detail",
    viewDetail: "View Detail",
    close: "Close",
    // New features
    duplicate: "Duplicate",
    customerSummary: "Customer Summary",
    vehicleSummary: "Vehicle Summary",
    vehicle: "Vehicle",
    auditLog: "Audit Log",
    action: "Action",
    details: "Details",
    clearLog: "Clear Log",
    noAuditLog: "No audit log entries yet",
  },
  ta: {
    dashboard: "\u0da1\u0dcf\u0dc2\u0dca\u0db4\u0ddd\u0dbb\u0dca\u0da1\u0dd4",
    addEntry:
      "\u0db4\u0dad\u0dd2\u0dc5\u0dd4 \u0dc3\u0dda\u0dbb\u0dca\u0d9a\u0dca\u0d9a",
    entries: "\u0db4\u0dad\u0dd2\u0dc5\u0dca\u0d9a\u0dc7\u0dca",
    customers:
      "\u0dc5\u0dcf\u0da1\u0dd2\u0d9a\u0dca\u0d9a\u0dba\u0dcf\u0dc7\u0dbb\u0dca\u0d9a\u0dc7\u0dca",
    reports:
      "\u0d85\u0dbb\u0dd2\u0d9a\u0dca\u0d9a\u0dda\u0d9c\u0dca\u0d9a\u0dc7\u0dca",
    vehicles: "\u0dc5\u0dcf\u0d9c\u0db1\u0d84\u0d9c\u0dc7\u0dca",
    notes: "\u0d9a\u0dd4\u0dbb\u0dd2\u0db4\u0dca\u0db4\u0dd4\u0d9a\u0dc7\u0dca",
    settings: "\u0d85\u0db8\u0dda\u0db4\u0dca\u0db4\u0dd4\u0d9a\u0dc7\u0dca",
    quantity: "\u0d85\u0dbb\u0dc0\u0dd4",
    itemType: "\u0db4\u0ddc\u0dbb\u0dd4\u0dca\u0dc5\u0dca \u0dc0\u0d9a\u0dda",
    vehicleNumber: "\u0dc5\u0dcf\u0d9c\u0db1 \u0dda\u0dab\u0dca",
    search: "\u0dad\u0dda\u0da1\u0dca\u0dab\u0dca",
    submit:
      "\u0dc3\u0db8\u0dbb\u0dca\u0db4\u0dca\u0db4\u0dd2\u0d9a\u0dca\u0d9a",
    cancel: "\u0dbb\u0dad\u0dca\u0da7\u0dd4 \u0dc3\u0dda\u0dba\u0dca",
    name: "\u0db4\u0dda\u0dba\u0dbb\u0dca",
    phone: "\u0dad\u0ddc\u0dab\u0dda\u0db4\u0dda\u0dc3\u0dd2",
    location: "\u0d89\u0da1\u0db8\u0dca",
    notes_label:
      "\u0d9a\u0dd4\u0dbb\u0dd2\u0db4\u0dca\u0db4\u0dd4\u0d9a\u0dc7\u0dca",
    delete: "\u0db1\u0ddc\u0d9a\u0dca\u0d9a\u0dd4",
    edit: "\u0dad\u0dd2\u0dbb\u0dd4\u0dad\u0dca\u0da7\u0dd4",
    add: "\u0dc3\u0dda\u0dbb\u0dca",
    save: "\u0dc3\u0dda\u0db8\u0dd2",
    welcome: "\u0dc5\u0dab\u0d9a\u0dca\u0d9a\u0db8\u0dca",
    today: "\u0d89\u0db1\u0dca\u0dbb\u0dd4",
    totalQuantity: "\u0db8\u0ddc\u0dad\u0dca\u0da7 \u0d85\u0dbb\u0dc0\u0dd4",
    loading: "\u0daf\u0dbb\u0dca\u0da7\u0dd4\u0d9a\u0dd2\u0dbb\u0dad\u0dd4...",
    error: "\u0db4\u0dd2\u0d9f\u0dda",
    more: "\u0db8\u0dda\u0dbb\u0dd4\u0db8\u0dca",
    customer:
      "\u0dc5\u0dcf\u0da1\u0dd2\u0d9a\u0dca\u0d9a\u0dba\u0dcf\u0dc7\u0dbb\u0dca",
    date: "\u0dad\u0dda\u0da7\u0dd2",
    filter: "\u0dc5\u0da1\u0dd2\u0d9a\u0da7\u0dca\u0da7\u0dd2",
    generate:
      "\u0d85\u0dbb\u0dd2\u0d9a\u0dca\u0d9a\u0dda \u0d8a\u0dbb\u0dd4\u0dc0\u0dcf\u0d9a\u0dca\u0d9a\u0dd4",
    noData: "\u0dad\u0dbb\u0dc5\u0dd4 \u0d89\u0dba\u0dca\u0dba\u0dda",
    logout: "\u0dc5\u0dda\u0dab\u0dd2\u0dba\u0dda\u0dbb\u0dd4",
    role: "\u0db4\u0d84\u0d9a\u0dd4",
    language: "\u0db8\u0ddc\u0d9f\u0dd2",
    profile: "\u0dc3\u0dd4\u0dba\u0dc5\u0dd2\u0dc0\u0dbb\u0db8\u0dca",
    entriesCount:
      "\u0d89\u0db1\u0dca\u0dbb\u0dda\u0dba \u0db4\u0dad\u0dd2\u0dc5\u0dca\u0d9a\u0dc7\u0dca",
    topVehicle:
      "\u0db8\u0dd4\u0dad\u0db1\u0dca\u0db8\u0dda \u0dc5\u0dcf\u0d9c\u0db1\u0db8\u0dca",
    totalCustomers:
      "\u0db8\u0ddc\u0dad\u0dca\u0da7 \u0dc5\u0dcf\u0da1\u0dd2\u0d9a\u0dca\u0d9a\u0dba\u0dcf\u0dc7\u0dbb\u0dca\u0d9a\u0dc7\u0dca",
    recentEntries:
      "\u0dc3\u0db8\u0ddc\u0db4\u0dca\u0db4\u0dad\u0dd2\u0dba \u0db4\u0dad\u0dd2\u0dc5\u0dca\u0d9a\u0dc7\u0dca",
    last7Days:
      "\u0d9a\u0da9\u0db1\u0dca\u0da7 7 \u0db1\u0dcf\u0da7\u0dca\u0d9a\u0dc7\u0dca",
    addCustomer:
      "\u0dc5\u0dcf\u0da1\u0dd2\u0d9a\u0dca\u0d9a\u0dba\u0dcf\u0dc7\u0dbb\u0dca \u0dc3\u0dda\u0dbb\u0dca",
    addNote:
      "\u0d9a\u0dd4\u0dbb\u0dd2\u0db4\u0dca\u0db4\u0dd4 \u0dc3\u0dda\u0dbb\u0dca",
    noteContent:
      "\u0d9a\u0dd4\u0dbb\u0dd2\u0db4\u0dca\u0db4\u0dd4 \u0d8a\u0dbb\u0dd4\u0dba \u0d85\u0dba\u0dca\u0dbd\u0da7\u0d9a\u0db8\u0dca...",
    usageCount:
      "\u0db4\u0dba\u0db1\u0dca\u0db4\u0dcf\u0da7\u0dca\u0da7\u0dd4 \u0dda\u0dab\u0dca\u0dab\u0dd2\u0d9a\u0dca\u0d9a\u0dda",
    setupProfile:
      "\u0dc3\u0dd4\u0dba\u0dc5\u0dd2\u0dc0\u0dbb\u0db8\u0dca \u0d85\u0db8\u0dda",
    enterName:
      "\u0d8a\u0d84\u0d9c\u0dc7\u0dca \u0db4\u0dda\u0dba\u0dbb\u0dda \u0d8a\u0dbb\u0dca\u0dbb\u0da0\u0dd2\u0da9\u0dc0\u0dd4\u0db8\u0dca",
    continue: "\u0dad\u0ddc\u0da9\u0dbb\u0dc5\u0dd4\u0db8\u0dca",
    husk: "\u0dad\u0dda\u0d84\u0d9a\u0dcf\u0dba\u0dca \u0db1\u0dcf\u0dbb\u0dca",
    dry: "\u0d8a\u0dbb\u0dca\u0db1\u0dca\u0dad\u0dad\u0dd4",
    wet: "\u0dad\u0db8\u0dca",
    both: "\u0d89\u0dbb\u0dd0\u0da8\u0dd4\u0db8\u0dca",
    motta: "\u0db8\u0ddc\u0da7\u0dca\u0da7\u0dda",
    others: "\u0db8\u0dbb\u0dca\u0dbb\u0dc0\u0dda",
    addItem:
      "\u0db4\u0ddc\u0dbb\u0dd4\u0dca\u0dc5\u0dca \u0dc3\u0dda\u0dbb\u0dca",
    coconut: "\u0dad\u0dda\u0d84\u0d9a\u0dcf\u0dba\u0dca",
    coconutEntry:
      "\u0dad\u0dda\u0d84\u0d9a\u0dcf\u0dba\u0dca \u0db4\u0dad\u0dd2\u0dc5\u0dd4",
    huskEntry: "\u0db1\u0dcf\u0dbb\u0dca \u0db4\u0dad\u0dd2\u0dc5\u0dd4",
    entryType: "\u0db4\u0dad\u0dd2\u0dc5\u0dd4 \u0dc0\u0d9a\u0dda",
    coconutType:
      "\u0dad\u0dda\u0d84\u0d9a\u0dcf\u0dba\u0dca \u0dc0\u0d9a\u0dda",
    rasi: "\u0dbb\u0dcf\u0dc3\u0dd2",
    tallu: "\u0dad\u0dc7\u0dca\u0dc7\u0dd4",
    specifyType:
      "\u0dc0\u0d9a\u0dda \u0d9a\u0dd4\u0dbb\u0dd2\u0db4\u0dca\u0db4\u0dd2\u0da9\u0dd4",
    coconutEntries:
      "\u0dad\u0dda\u0d84\u0d9a\u0dcf\u0dba\u0dca \u0db4\u0dad\u0dd2\u0dc5\u0dca\u0d9a\u0dc7\u0dca",
    all: "\u0d85\u0db1\u0dda\u0dad\u0dca\u0dad\u0dd4\u0db8\u0dca",
    thisWeek: "\u0d89\u0db1\u0dca\u0da7 \u0dc5\u0dcf\u0dbb\u0db8\u0dca",
    thisMonth: "\u0d89\u0db1\u0dca\u0da7 \u0db8\u0dcf\u0dad\u0db8\u0dca",
    results: "\u0db8\u0dd4\u0da1\u0dd2\u0dc5\u0dca\u0d9a\u0dc7\u0dca",
    exportCSV: "CSV \u0daf\u0dbb\u0dca\u0da7\u0dd4\u0db8\u0dad\u0dd2",
    printReport:
      "\u0d85\u0dbb\u0dd2\u0d9a\u0dca\u0d9a\u0dda \u0d85\u0da1\u0dca\u0dc3\u0dd2\u0da9\u0dd4",
    shareReport:
      "\u0d85\u0dbb\u0dd2\u0d9a\u0dca\u0d9a\u0dda \u0db4\u0d9a\u0dd2\u0dbb\u0dca",
    monthlyView:
      "\u0db8\u0dcf\u0dad\u0dcf\u0db1\u0dca\u0dad\u0dd2\u0dbb \u0db4\u0dcf\u0dbb\u0dca\u0dc0\u0dda",
    hideMonthly:
      "\u0db8\u0dcf\u0dad\u0dcf\u0db1\u0dca\u0dad\u0dd2\u0dbb\u0db8\u0dca \u0db8\u0dbb\u0dda",
    monthlySummary:
      "\u0db8\u0dcf\u0dad\u0dcf\u0db1\u0dca\u0dad\u0dd2\u0dbb \u0dc3\u0dd4\u0dbb\u0dd4\u0d9a\u0dca\u0d9a\u0db8\u0dca",
    resetPIN:
      "\u0db4\u0dd2\u0db1\u0dca \u0db8\u0ddc\u0da7\u0dca\u0da7\u0db8\u0dda",
    changePIN: "\u0db4\u0dd2\u0db1\u0dca \u0db8\u0dcf\u0dbb\u0dca\u0dbb\u0dd4",
    huskCustomers:
      "\u0db1\u0dcf\u0dbb\u0dca \u0dc5\u0dcf\u0da1\u0dd2\u0d9a\u0dca\u0d9a\u0dba\u0dcf\u0dc7\u0dbb\u0dca\u0d9a\u0dc7\u0dca",
    coconutCustomers:
      "\u0dad\u0dda\u0d84\u0d9a\u0dcf\u0dba\u0dca \u0dc5\u0dcf\u0da1\u0dd2\u0d9a\u0dca\u0d9a\u0dba\u0dcf\u0dc7\u0dbb\u0dca\u0d9a\u0dc7\u0dca",
    quickEntry:
      "\u0dc5\u0dd2\u0dbb\u0dda\u0dc0\u0dd4 \u0db4\u0dad\u0dd2\u0dc5\u0dd4",
    syncData:
      "\u0dad\u0dbb\u0dc5\u0dd4 \u0d94\u0dad\u0dca\u0dad\u0dd2\u0dc3\u0dda\u0dc0\u0dd4",
    syncNow:
      "\u0d89\u0db4\u0dca\u0db4\u0ddc\u0dad\u0dd4 \u0d94\u0dad\u0dca\u0dad\u0dd2\u0dc3\u0dda",
    lastSynced:
      "\u0d9a\u0da9\u0dda\u0dc3\u0dd2 \u0d94\u0dad\u0dca\u0dad\u0dd2\u0dc3\u0dda\u0dc0\u0dd4",
    syncing:
      "\u0d94\u0dad\u0dca\u0dad\u0dd2\u0dc3\u0dda\u0d9c\u0dd2\u0dbb\u0dad\u0dd4...",
    syncSuccess:
      "\u0dad\u0dbb\u0dc5\u0dd4 \u0dc5\u0dda\u0dbb\u0dca\u0dbb\u0dd2\u0d9a\u0dbb\u0db8\u0dcf\u0d9c \u0d94\u0dad\u0dca\u0dad\u0dd2\u0dc3\u0dda\u0d9a\u0dca\u0d9a\u0db4\u0dca\u0db4\u0da9\u0dca\u0da9\u0dad\u0dd4",
    syncFailed:
      "\u0d94\u0dad\u0dca\u0dad\u0dd2\u0dc3\u0dda\u0dc0\u0dd4 \u0dad\u0ddc\u0dba\u0dca\u0dc5\u0dd2. \u0d89\u0dab\u0dda\u0db4\u0dca\u0db4\u0dda \u0dc3\u0dbb\u0dd2\u0db4\u0dcf\u0dbb\u0dd4\u0d84\u0d9c\u0dc7\u0dca.",
    unsyncedItems:
      "\u0d94\u0dad\u0dca\u0dad\u0dd2\u0dc3\u0dda\u0d9a\u0dca\u0d9a\u0db4\u0dca\u0db4\u0da9\u0dcf\u0da7 \u0db4\u0dad\u0dd2\u0dc5\u0dca\u0d9a\u0dc7\u0dca",
    entryDate: "\u0db4\u0dad\u0dd2\u0dc5\u0dd4 \u0dad\u0dda\u0da7\u0dd2",
    searchCustomers:
      "\u0dc5\u0dcf\u0da1\u0dd2\u0d9a\u0dca\u0d9a\u0dba\u0dcf\u0dc7\u0dbb\u0dca \u0dad\u0dda\u0da1\u0dd4...",
    entryDetail:
      "\u0db4\u0dad\u0dd2\u0dc5\u0dd4 \u0dc5\u0dd2\u0dc0\u0dbb\u0db8\u0dca",
    viewDetail: "\u0dc5\u0dd2\u0dc0\u0dbb\u0db8\u0dca \u0db4\u0dcf\u0dbb\u0dca",
    close: "\u0db8\u0dd6\u0da9\u0dd4",
    // New features
    duplicate: "\u0db1\u0d9a\u0dbd\u0dda\u0da9\u0dd4",
    customerSummary:
      "\u0dc5\u0dcf\u0da1\u0dd2\u0d9a\u0dca\u0d9a\u0dba\u0dcf\u0dc7\u0dbb\u0dca \u0dc3\u0dd4\u0dbb\u0dd4\u0d9a\u0dca\u0d9a\u0db8\u0dca",
    vehicleSummary:
      "\u0dc5\u0dcf\u0d9c\u0db1 \u0dc3\u0dd4\u0dbb\u0dd4\u0d9a\u0dca\u0d9a\u0db8\u0dca",
    vehicle: "\u0dc5\u0dcf\u0d9c\u0db1\u0db8\u0dca",
    auditLog:
      "\u0dad\u0dad\u0dd2\u0d9a\u0dca\u0d9a\u0dda \u0db4\u0dad\u0dd2\u0dc5\u0dd4",
    action: "\u0dc3\u0dda\u0dba\u0dca\u0dba\u0dca",
    details: "\u0dc5\u0dd2\u0dc0\u0dbb\u0d84\u0d9c\u0dc7\u0dca",
    clearLog: "\u0db4\u0dad\u0dd2\u0dc5\u0dd6 \u0db8\u0d9a\u0dd2\u0dbb\u0dd4",
    noAuditLog:
      "\u0dad\u0dad\u0dd2\u0d9a\u0dca\u0d9a\u0dda \u0db4\u0dad\u0dd2\u0dc5\u0dca \u0d89\u0dba\u0dca\u0dba\u0dda",
  },
};

export type TranslationKeys = keyof typeof translations.en;

interface I18nContextType {
  t: (key: TranslationKeys) => string;
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("husktrack_lang");
    return (stored === "ta" ? "ta" : "en") as Lang;
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("husktrack_lang", newLang);
  };

  const t = (key: TranslationKeys): string => {
    return translations[lang][key] ?? translations.en[key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ t, lang, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
