import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Layout from "./components/Layout";
import { AuthProvider, useAuthContext } from "./hooks/AuthContext";
import { useDataSync } from "./hooks/useQueries";
import { I18nProvider, useI18n } from "./i18n";
import Admin from "./pages/Admin";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import EntriesList from "./pages/EntriesList";
import NewEntry from "./pages/NewEntry";
import type { DuplicateEntryData } from "./pages/NewEntry";
import Notes from "./pages/Notes";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Vehicles from "./pages/Vehicles";

type Page =
  | "dashboard"
  | "newEntry"
  | "entries"
  | "customers"
  | "vehicles"
  | "reports"
  | "notes"
  | "settings"
  | "admin";

// 6-digit PIN input component
function PinInput({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
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
    if (char && idx < 5) {
      refs.current[idx + 1]?.focus();
    }
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
      const lastFilledIdx = Math.min(pasted.length - 1, 5);
      refs.current[lastFilledIdx]?.focus();
      e.preventDefault();
    }
  };

  return (
    <div className="flex gap-2 justify-center" id={id}>
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
          className="w-11 h-11 text-center text-lg font-bold border-2 rounded-xl focus:outline-none focus:ring-2 bg-background transition-all"
          style={{
            borderColor: d ? "#154A27" : undefined,
            color: "#154A27",
          }}
        />
      ))}
    </div>
  );
}

function LoginScreen() {
  const { login, isLoading, error } = useAuthContext();
  const { lang } = useI18n();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [localError, setLocalError] = useState("");

  // Auto-login when 6-digit PIN is fully entered and username is present
  useEffect(() => {
    if (pin.length === 6 && username.trim()) {
      setLocalError("");
      login(username.trim(), pin).catch(() => {
        // error handled by context
      });
    }
  }, [pin, username, login]);

  const handlePinChange = (v: string) => {
    setPin(v);
    setLocalError("");
  };

  const displayError = localError || error;

  return (
    <div className="app-shell flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-xs space-y-6">
        <div className="text-center space-y-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto"
            style={{ backgroundColor: "#154A27" }}
          >
            A
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#154A27" }}>
            ACW HuskTrack
          </h1>
          <p className="text-sm text-muted-foreground">Ananda Coir Works</p>
        </div>

        <Card className="shadow-card border-0">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {lang === "ta"
                    ? "\u0db4\u0dba\u0db1\u0dbb\u0dca\u0db4\u0dda\u0dba\u0dbb\u0dca"
                    : "Username"}
                </Label>
                <Input
                  data-ocid="login.input"
                  placeholder={
                    lang === "ta"
                      ? "\u0db4\u0dba\u0db1\u0dbb\u0dca\u0db4\u0dda\u0dba\u0dbb\u0dca"
                      : "Enter username"
                  }
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="border-input"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {lang === "ta"
                    ? "6 \u0d89\u0dbd\u0d9a\u0dca\u0d9a \u0db4\u0dd2\u0db1\u0dca"
                    : "6-Digit PIN"}
                </Label>
                <PinInput
                  value={pin}
                  onChange={handlePinChange}
                  id="login-pin"
                />
              </div>

              {isLoading && (
                <div
                  className="flex items-center justify-center gap-2 text-sm"
                  style={{ color: "#154A27" }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {lang === "ta"
                      ? "\u0d8a\u0dbc\u0dba\u0dda\u0dc6\u0dd2\u0d9c\u0dd2\u0dbb\u0dad\u0dd4..."
                      : "Signing in..."}
                  </span>
                </div>
              )}

              {displayError && (
                <p
                  className="text-xs text-destructive text-center"
                  data-ocid="login.error_state"
                >
                  {displayError === "PIN is invalid"
                    ? lang === "ta"
                      ? "\u0db4\u0dd2\u0db1\u0dca \u0dad\u0dc0\u0dbb\u0dcf\u0db1\u0dad\u0dd4"
                      : "PIN is invalid"
                    : displayError}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()}. Built with &#10084;&#65039; using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

function AppShell() {
  const { user } = useAuthContext();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [newEntryMode, setNewEntryMode] = useState<"husk" | "coconut">("husk");
  const [duplicateData, setDuplicateData] = useState<DuplicateEntryData | null>(
    null,
  );

  // Pull fresh data from backend on login and every 30s so all users see updates
  useDataSync();

  const navigateToEntry = (mode: "husk" | "coconut") => {
    setDuplicateData(null);
    setNewEntryMode(mode);
    setCurrentPage("newEntry");
  };

  const navigateToDuplicate = (data: DuplicateEntryData) => {
    setDuplicateData(data);
    setNewEntryMode(data.entryType);
    setCurrentPage("newEntry");
  };

  const handleNavigate = (page: Page) => {
    if (page !== "newEntry") {
      setDuplicateData(null);
    }
    setCurrentPage(page);
  };

  if (!user) {
    return <LoginScreen />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard userName={user.name} onNavigateToEntry={navigateToEntry} />
        );
      case "newEntry":
        return (
          <NewEntry
            userName={user.name}
            initialMode={newEntryMode}
            duplicateData={duplicateData}
          />
        );
      case "entries":
        return <EntriesList onDuplicate={navigateToDuplicate} />;
      case "customers":
        return <Customers />;
      case "vehicles":
        return <Vehicles />;
      case "reports":
        return <Reports />;
      case "notes":
        return <Notes />;
      case "settings":
        return <Settings />;
      case "admin":
        return <Admin />;
      default:
        return (
          <Dashboard userName={user.name} onNavigateToEntry={navigateToEntry} />
        );
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      userName={user.name}
    >
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppShell />
        <Toaster />
      </AuthProvider>
    </I18nProvider>
  );
}
