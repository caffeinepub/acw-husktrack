import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { Globe, Loader2, LogOut, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerRole,
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";
import { useI18n } from "../i18n";

export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const { clear } = useInternetIdentity();
  const qc = useQueryClient();
  const { data: profile } = useGetCallerUserProfile();
  const { data: role } = useGetCallerRole();
  const saveProfile = useSaveCallerUserProfile();

  const [editName, setEditName] = useState(false);
  const [name, setName] = useState("");

  const handleEditName = () => {
    setName(profile?.name ?? "");
    setEditName(true);
  };

  const handleSaveName = async () => {
    if (!name.trim()) return;
    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      toast.success("Profile updated!");
      setEditName(false);
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const handleLogout = async () => {
    await clear();
    qc.clear();
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: "#154A27" }}>
        {t("settings")}
      </h2>

      {/* Profile */}
      <Card className="shadow-card border-0">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: "#154A27" }}
            >
              <User size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {profile?.name ?? "—"}
              </p>
              {role && (
                <Badge
                  className="text-[10px] mt-0.5 text-white capitalize"
                  style={{
                    backgroundColor: role === "admin" ? "#154A27" : "#4e9e6e",
                  }}
                >
                  {role}
                </Badge>
              )}
            </div>
          </div>

          {editName ? (
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t("name")}</Label>
              <Input
                data-ocid="settings.input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-input"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="settings.cancel_button"
                  onClick={() => setEditName(false)}
                  className="flex-1"
                >
                  {t("cancel")}
                </Button>
                <Button
                  size="sm"
                  data-ocid="settings.save_button"
                  onClick={handleSaveName}
                  disabled={saveProfile.isPending}
                  className="flex-1 text-white"
                  style={{ backgroundColor: "#154A27" }}
                >
                  {saveProfile.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    t("save")
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              data-ocid="settings.edit_button"
              onClick={handleEditName}
              className="w-full border-border"
            >
              Edit Name
            </Button>
          )}
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
        onClick={handleLogout}
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
