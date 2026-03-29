import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import Layout from "./components/Layout";
import { AuthProvider, useAuthContext } from "./hooks/AuthContext";
import { I18nProvider, useI18n } from "./i18n";
import Admin from "./pages/Admin";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import EntriesList from "./pages/EntriesList";
import NewEntry from "./pages/NewEntry";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || pin.length !== 6) {
      setLocalError(
        lang === "ta"
          ? "பயனர்பெயர் மற்றும் 6 இலக்க பின் தேவை"
          : "Enter username and 6-digit PIN",
      );
      return;
    }
    setLocalError("");
    try {
      await login(username.trim(), pin);
    } catch {
      // error handled by context
    }
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {lang === "ta" ? "பயனர்பெயர்" : "Username"}
                </Label>
                <Input
                  data-ocid="login.input"
                  placeholder={lang === "ta" ? "பயனர்பெயர்" : "Enter username"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="border-input"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {lang === "ta" ? "6 இலக்க பின்" : "6-Digit PIN"}
                </Label>
                <PinInput value={pin} onChange={setPin} id="login-pin" />
              </div>

              {displayError && (
                <p
                  className="text-xs text-destructive text-center"
                  data-ocid="login.error_state"
                >
                  {displayError === "Invalid username or PIN"
                    ? lang === "ta"
                      ? "தவறான பயனர்பெயர் அல்லது பின்"
                      : "Invalid username or PIN"
                    : displayError}
                </p>
              )}

              <Button
                data-ocid="login.primary_button"
                type="submit"
                className="w-full text-white font-semibold"
                style={{ backgroundColor: "#154A27" }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {lang === "ta" ? "உள்நுழைகிறது..." : "Signing in..."}
                  </>
                ) : lang === "ta" ? (
                  "உள்நுழை"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
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

  if (!user) {
    return <LoginScreen />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard userName={user.name} />;
      case "newEntry":
        return <NewEntry userName={user.name} />;
      case "entries":
        return <EntriesList />;
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
        return <Dashboard userName={user.name} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
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
