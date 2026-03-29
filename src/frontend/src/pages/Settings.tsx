import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Globe, KeyRound, LogOut, User } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAuthContext } from "../hooks/AuthContext";
import { useActor } from "../hooks/useActor";
import { updateLocalUserPin, verifyLocalPin } from "../hooks/useAuth";
import { useI18n } from "../i18n";

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

    // Verify current PIN locally (offline-first)
    if (!verifyLocalPin(user.username, currentPin)) {
      toast.error(lang === "ta" ? "தவறான தற்போதைய பின்" : "Incorrect current PIN");
      return;
    }

    // Update locally immediately
    updateLocalUserPin(user.username, newPin);
    updateStoredPin(newPin);

    toast.success(
      lang === "ta" ? "பின் மாற்றப்பட்டது!" : "PIN changed successfully!",
    );
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");

    // Background sync to backend (fire-and-forget)
    if (actor) {
      try {
        (actor as any)
          .changeOwnPin(user.username, currentPin, newPin)
          .catch(() => {
            // Ignore backend sync errors — local update already succeeded
          });
      } catch {
        // Ignore
      }
    }
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
