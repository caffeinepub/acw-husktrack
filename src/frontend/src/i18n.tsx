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
  },
  ta: {
    dashboard: "டாஷ்போர்டு",
    addEntry: "பதிவு சேர்க்க",
    entries: "பதிவுகள்",
    customers: "வாடிக்கையாளர்கள்",
    reports: "அறிக்கைகள்",
    vehicles: "வாகனங்கள்",
    notes: "குறிப்புகள்",
    settings: "அமைப்புகள்",
    quantity: "அளவு",
    itemType: "பொருள் வகை",
    vehicleNumber: "வாகன எண்",
    search: "தேடல்",
    submit: "சமர்ப்பிக்க",
    cancel: "ரத்து செய்",
    name: "பெயர்",
    phone: "தொலைபேசி",
    location: "இடம்",
    notes_label: "குறிப்புகள்",
    delete: "நீக்கு",
    edit: "திருத்து",
    add: "சேர்",
    save: "சேமி",
    welcome: "வணக்கம்",
    today: "இன்று",
    totalQuantity: "மொத்த அளவு",
    loading: "ஏற்றுகிறது...",
    error: "பிழை",
    more: "மேலும்",
    customer: "வாடிக்கையாளர்",
    date: "தேதி",
    filter: "வடிகட்டி",
    generate: "அறிக்கை உருவாக்கு",
    noData: "தரவு இல்லை",
    logout: "வெளியேறு",
    role: "பங்கு",
    language: "மொழி",
    profile: "சுயவிவரம்",
    entriesCount: "இன்றைய பதிவுகள்",
    topVehicle: "முதன்மை வாகனம்",
    totalCustomers: "மொத்த வாடிக்கையாளர்கள்",
    recentEntries: "சமீபத்திய பதிவுகள்",
    last7Days: "கடந்த 7 நாட்கள்",
    addCustomer: "வாடிக்கையாளர் சேர்",
    addNote: "குறிப்பு சேர்",
    noteContent: "குறிப்பு உள்ளடக்கம்...",
    usageCount: "பயன்பாட்டு எண்ணிக்கை",
    setupProfile: "சுயவிவரம் அமை",
    enterName: "உங்கள் பெயரை உள்ளிடவும்",
    continue: "தொடரவும்",
    husk: "தேங்காய் நார்",
    dry: "உலர்ந்தது",
    wet: "ஈரமான",
    both: "இரண்டும்",
    motta: "மொட்டை",
    others: "மற்றவை",
    addItem: "பொருள் சேர்",
    coconut: "தேங்காய்",
    coconutEntry: "தேங்காய் பதிவு",
    huskEntry: "நார் பதிவு",
    entryType: "பதிவு வகை",
    coconutType: "தேங்காய் வகை",
    rasi: "ராசி",
    tallu: "தள்ளு",
    specifyType: "வகை குறிப்பிடு",
    coconutEntries: "தேங்காய் பதிவுகள்",
    all: "அனைத்தும்",
    thisWeek: "இந்த வாரம்",
    thisMonth: "இந்த மாதம்",
    results: "முடிவுகள்",
    exportCSV: "CSV ஏற்றுமதி",
    printReport: "அறிக்கை அச்சிடு",
    shareReport: "அறிக்கை பகிர்",
    monthlyView: "மாதாந்திர பார்வை",
    hideMonthly: "மாதாந்திரம் மறை",
    monthlySummary: "மாதாந்திர சுருக்கம்",
    resetPIN: "பின் மீட்டமை",
    changePIN: "பின் மாற்று",
    huskCustomers: "நார் வாடிக்கையாளர்கள்",
    coconutCustomers: "தேங்காய் வாடிக்கையாளர்கள்",
    quickEntry: "விரைவு பதிவு",
    syncData: "தரவு ஒத்திசைவு",
    syncNow: "இப்போது ஒத்திசை",
    lastSynced: "கடைசி ஒத்திசைவு",
    syncing: "ஒத்திசைகிறது...",
    syncSuccess: "தரவு வெற்றிகரமாக ஒத்திசைக்கப்பட்டது",
    syncFailed: "ஒத்திசைவு தோல்வி. இணைப்பை சரிபாருங்கள்.",
    unsyncedItems: "ஒத்திசைக்கப்படாத பதிவுகள்",
    entryDate: "பதிவு தேதி",
    searchCustomers: "வாடிக்கையாளர் தேடு...",
    entryDetail: "பதிவு விவரம்",
    viewDetail: "விவரம் பார்",
    close: "மூடு",
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
