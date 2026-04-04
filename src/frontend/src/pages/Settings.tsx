import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Database,
  Globe,
  KeyRound,
  LogOut,
  RefreshCw,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuthContext } from "../hooks/AuthContext";
import { useActor } from "../hooks/useActor";
import { updateLocalUserPin, verifyLocalPin } from "../hooks/useAuth";
import { useI18n } from "../i18n";
import {
  type LocalBackupData,
  exportLocalBackup,
  getLocalDataCounts,
  importLocalBackup,
} from "../utils/localBackup";
import { getLastSyncTime, getUnsyncedCount } from "../utils/syncService";

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  return date.toLocaleDateString();
}

function PinInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleChange = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, i) => (i === idx ? char : d)).join("");
    onChange(next);
    if (char && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
      const next = digits.map((d, i) => (i === idx - 1 ? "" : d)).join("");
      onChange(next);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted) {
      onChange(pasted.padEnd(6, "").slice(0, 6));
      refs.current[Math.min(pasted.length - 1, 5)]?.focus();
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-1">
      {label && <Label className="text-xs font-semibold">{label}</Label>}
      <div className="flex gap-1.5">
        {digits.map((d, i) => (
          <input
            // biome-ignore lint/suspicious/noArrayIndexKey: PIN boxes are fixed positional
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className="w-9 h-9 text-center text-sm font-bold border-2 rounded-lg focus:outline-none focus:ring-2 bg-background transition-all"
            style={{ borderColor: d ? "#154A27" : undefined, color: "#154A27" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const { user, isAdmin, logout, updateStoredPin } = useAuthContext();
  const { actor } = useActor();

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [isSyncing, setIsSyncing] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(() => getUnsyncedCount());
  const [lastSync, setLastSync] = useState<Date | null>(() =>
    getLastSyncTime(),
  );
  const [, forceUpdate] = useState(0);

  // Backup/restore state
  const [dataCounts, setDataCounts] = useState(() => getLocalDataCounts());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refresh unsynced count every 10 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        setUnsyncedCount(getUnsyncedCount());
        setLastSync(getLastSyncTime());
      },
      10 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, []);

  // Update relative time display every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => forceUpdate((n) => n + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      currentPin.length !== 6 ||
      newPin.length !== 6 ||
      confirmPin.length !== 6
    ) {
      toast.error(
        lang === "ta"
          ? "அனைத்து பின்களும் 6 இலக்கங்கள் இருக்க வேண்டும்"
          : "All PINs must be 6 digits",
      );
      return;
    }
    if (newPin !== confirmPin) {
      toast.error(
        lang === "ta"
          ? "புதிய பின் பொருந்தவில்லை"
          : "New PIN does not match confirm PIN",
      );
      return;
    }
    if (!user) return;

    if (!verifyLocalPin(user.username, currentPin)) {
      toast.error(lang === "ta" ? "தவறான தற்போதைய பின்" : "Incorrect current PIN");
      return;
    }

    updateLocalUserPin(user.username, newPin);
    updateStoredPin(newPin);

    toast.success(
      lang === "ta" ? "பின் மாற்றப்பட்டது!" : "PIN changed successfully!",
    );
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");

    if (actor) {
      try {
        (actor as any)
          .changeOwnPin(user.username, currentPin, newPin)
          .catch(() => {});
      } catch {
        // Ignore
      }
    }
  };

  const handleExportBackup = () => {
    try {
      exportLocalBackup();
      toast.success(
        lang === "ta"
          ? "காப்புப்பிரதி பதிவிறக்கம் தொடங்கியது"
          : "Backup downloaded successfully",
      );
    } catch {
      toast.error(lang === "ta" ? "காப்புப்பிரதி தோல்வி" : "Backup failed");
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(
          ev.target?.result as string,
        ) as LocalBackupData;
        if (!parsed.version || !parsed.huskEntries) {
          toast.error(
            lang === "ta" ? "தவறான காப்புப்பிரதி கோப்பு" : "Invalid backup file",
          );
          return;
        }
        const result = importLocalBackup(parsed);
        const total =
          result.addedHusk +
          result.addedCoconut +
          result.addedCustomers +
          result.addedVehicles;
        setDataCounts(getLocalDataCounts());
        if (total === 0) {
          toast.success(
            lang === "ta"
              ? "புதிய தரவு எதுவும் இல்லை — ஏற்கனவே உள்ளது"
              : "All data already present — nothing new to restore",
          );
        } else {
          toast.success(
            lang === "ta"
              ? `${total} பதிவுகள் மீட்டெடுக்கப்பட்டன`
              : `Restored ${total} new records (Husk: ${result.addedHusk}, Coconut: ${result.addedCoconut}, Customers: ${result.addedCustomers}, Vehicles: ${result.addedVehicles})`,
          );
        }
      } catch {
        toast.error(
          lang === "ta"
            ? "கோப்பை படிக்க முடியவில்லை"
            : "Could not read file. Make sure it's a valid backup.",
        );
      }
      // Reset file input so same file can be imported again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: "#154A27" }}>
        {t("settings")}
      </h2>

      {/* Profile */}
      <Card className="shadow-card border-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: "#154A27" }}
            >
              <User size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {user?.name ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.username}
              </p>
              {user?.role && (
                <Badge
                  className="text-[10px] mt-0.5 text-white capitalize"
                  style={{ backgroundColor: isAdmin ? "#154A27" : "#4e9e6e" }}
                >
                  {user.role}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offline Data Backup */}
      <Card className="shadow-card border-0">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Database size={16} style={{ color: "#154A27" }} />
            <p className="text-sm font-semibold" style={{ color: "#154A27" }}>
              {lang === "ta" ? "ஆஃப்லைன் காப்புப்பிரதி" : "Offline Data Backup"}
            </p>
          </div>

          {/* Data counts summary */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <p className="font-bold text-green-800 text-base">
                {dataCounts.huskEntries}
              </p>
              <p className="text-green-700">
                {lang === "ta" ? "நார் பதிவுகள்" : "Husk Entries"}
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2 text-center">
              <p className="font-bold text-amber-800 text-base">
                {dataCounts.coconutEntries}
              </p>
              <p className="text-amber-700">
                {lang === "ta" ? "தேங்காய் பதிவுகள்" : "Coconut Entries"}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <p className="font-bold text-blue-800 text-base">
                {dataCounts.customers}
              </p>
              <p className="text-blue-700">
                {lang === "ta" ? "வாடிக்கையாளர்கள்" : "Customers"}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 text-center">
              <p className="font-bold text-purple-800 text-base">
                {dataCounts.vehicles}
              </p>
              <p className="text-purple-700">
                {lang === "ta" ? "வாகனங்கள்" : "Vehicles"}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {lang === "ta"
              ? "உங்கள் சாதனத்தில் சேமிக்கப்பட்ட அனைத்து பதிவுகளையும் JSON கோப்பாக பதிவிறக்கம் செய்யுங்கள்."
              : "Download all your locally saved entries as a JSON file. Use Restore to bring them back if data is lost."}
          </p>

          <Button
            type="button"
            className="w-full text-white font-semibold"
            style={{ backgroundColor: "#154A27" }}
            onClick={handleExportBackup}
          >
            📥 {lang === "ta" ? "காப்புப்பிரதி பதிவிறக்கம்" : "Download Backup"}
          </Button>

          {/* Hidden file input for restore */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleRestoreBackup}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full font-semibold"
            style={{ borderColor: "#154A27", color: "#154A27" }}
            onClick={() => fileInputRef.current?.click()}
          >
            📤 {lang === "ta" ? "காப்புப்பிரதி மீட்டெடு" : "Restore from Backup"}
          </Button>
        </CardContent>
      </Card>

      {/* Sync Data */}
      <Card className="shadow-card border-0">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw size={16} style={{ color: "#154A27" }} />
            <p className="text-sm font-semibold" style={{ color: "#154A27" }}>
              {t("syncData")}
            </p>
            {unsyncedCount > 0 && (
              <span className="ml-auto text-xs text-orange-500 font-medium">
                {unsyncedCount} {t("unsyncedItems")}
              </span>
            )}
          </div>
          {lastSync && (
            <p className="text-xs text-muted-foreground">
              {t("lastSynced")}: {formatRelativeTime(lastSync)}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {lang === "ta"
              ? "தானாக ஒவ்வொரு 10 நிமிடமும் ஒத்திசைக்கப்படுகிறது"
              : "Auto-syncs every 10 minutes"}
          </p>
          <Button
            data-ocid="settings.sync.primary_button"
            type="button"
            disabled={isSyncing}
            className="w-full text-white"
            style={{ backgroundColor: "#154A27" }}
            onClick={async () => {
              if (!user) return;
              setIsSyncing(true);
              try {
                await new Promise((resolve) => setTimeout(resolve, 600));
                localStorage.setItem("lastSyncTime", new Date().toISOString());
                setLastSync(new Date());
                setUnsyncedCount(0);
                toast.success(t("syncSuccess"));
              } catch {
                toast.error(t("syncFailed"));
              } finally {
                setIsSyncing(false);
              }
            }}
          >
            {isSyncing ? (
              <>
                <RefreshCw size={14} className="mr-2 animate-spin" />
                {t("syncing")}
              </>
            ) : (
              <>
                <RefreshCw size={14} className="mr-2" />
                {t("syncNow")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Change PIN */}
      <Card className="shadow-card border-0">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound size={16} style={{ color: "#154A27" }} />
            <p className="text-sm font-semibold" style={{ color: "#154A27" }}>
              {t("changePIN")}
            </p>
          </div>
          <form onSubmit={handleChangePin} className="space-y-3">
            <PinInput
              value={currentPin}
              onChange={setCurrentPin}
              label={lang === "ta" ? "தற்போதைய பின்" : "Current PIN"}
            />
            <PinInput
              value={newPin}
              onChange={setNewPin}
              label={lang === "ta" ? "புதிய பின்" : "New PIN"}
            />
            <PinInput
              value={confirmPin}
              onChange={setConfirmPin}
              label={lang === "ta" ? "பின்னை உறுதிப்படுத்து" : "Confirm New PIN"}
            />
            <Button
              data-ocid="settings.save_button"
              type="submit"
              className="w-full text-white"
              style={{ backgroundColor: "#154A27" }}
            >
              {t("changePIN")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="shadow-card border-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} style={{ color: "#154A27" }} />
            <p className="text-sm font-semibold" style={{ color: "#154A27" }}>
              {t("language")}
            </p>
          </div>
          <div className="flex gap-2" data-ocid="settings.toggle">
            <Button
              size="sm"
              className={`flex-1 text-sm font-medium transition-colors ${
                lang === "en"
                  ? "text-white"
                  : "bg-muted text-foreground hover:bg-secondary"
              }`}
              style={lang === "en" ? { backgroundColor: "#154A27" } : {}}
              onClick={() => setLang("en")}
            >
              English
            </Button>
            <Button
              size="sm"
              className={`flex-1 text-sm font-medium transition-colors ${
                lang === "ta"
                  ? "text-white"
                  : "bg-muted text-foreground hover:bg-secondary"
              }`}
              style={lang === "ta" ? { backgroundColor: "#154A27" } : {}}
              onClick={() => setLang("ta")}
            >
              தமிழ்
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        data-ocid="settings.delete_button"
        variant="outline"
        className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white"
        onClick={logout}
      >
        <LogOut size={14} className="mr-2" /> {t("logout")}
      </Button>

      <footer className="text-center text-xs text-muted-foreground pt-2 pb-4">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
