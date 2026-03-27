import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import Layout from "./components/Layout";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "./hooks/useQueries";
import { I18nProvider } from "./i18n";
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
  | "settings";

function LoginScreen() {
  const { login, isLoggingIn, isLoginError } = useInternetIdentity();

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
            <p className="text-sm text-center text-muted-foreground">
              Sign in to continue tracking husk purchases
            </p>
            {isLoginError && (
              <p
                className="text-xs text-destructive text-center"
                data-ocid="login.error_state"
              >
                Login failed. Please try again.
              </p>
            )}
            <Button
              data-ocid="login.primary_button"
              className="w-full text-white font-semibold"
              style={{ backgroundColor: "#154A27" }}
              onClick={login}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing
                  in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
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

function SetupProfile({ onDone }: { onDone: () => void }) {
  const saveProfile = useSaveCallerUserProfile();
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await saveProfile.mutateAsync({ name: name.trim() });
    onDone();
  };

  return (
    <div className="app-shell flex flex-col items-center justify-center min-h-screen px-6">
      <Card className="w-full max-w-xs shadow-card border-0">
        <CardContent className="p-6 space-y-5">
          <div className="text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-3"
              style={{ backgroundColor: "#154A27" }}
            >
              U
            </div>
            <h2 className="text-lg font-bold" style={{ color: "#154A27" }}>
              Setup Profile
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Enter your name to get started
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Your Name *</Label>
              <Input
                data-ocid="setup.input"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="border-input"
              />
            </div>
            <Button
              data-ocid="setup.submit_button"
              type="submit"
              className="w-full text-white font-semibold"
              style={{ backgroundColor: "#154A27" }}
              disabled={saveProfile.isPending || !name.trim()}
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function AppShell() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const {
    data: profile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const qc = useQueryClient();

  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  if (isInitializing) {
    return (
      <div
        className="app-shell flex items-center justify-center min-h-screen"
        data-ocid="app.loading_state"
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: "#154A27" }}
          >
            A
          </div>
          <Loader2
            className="h-5 w-5 animate-spin"
            style={{ color: "#154A27" }}
          />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (profileLoading || !isFetched) {
    return (
      <div
        className="app-shell flex items-center justify-center min-h-screen"
        data-ocid="app.loading_state"
      >
        <Loader2
          className="h-6 w-6 animate-spin"
          style={{ color: "#154A27" }}
        />
      </div>
    );
  }

  // profile is null means no profile set yet; undefined means loading
  if (profile === null || profile === undefined) {
    if (profile === null) {
      return (
        <SetupProfile
          onDone={() =>
            qc.invalidateQueries({ queryKey: ["currentUserProfile"] })
          }
        />
      );
    }
    return (
      <div
        className="app-shell flex items-center justify-center min-h-screen"
        data-ocid="app.loading_state"
      >
        <Loader2
          className="h-6 w-6 animate-spin"
          style={{ color: "#154A27" }}
        />
      </div>
    );
  }

  const userName = profile.name;

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard userName={userName} />;
      case "newEntry":
        return <NewEntry userName={userName} />;
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
      default:
        return <Dashboard userName={userName} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      userName={userName}
    >
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppShell />
      <Toaster />
    </I18nProvider>
  );
}
