import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BarChart2,
  FileText,
  LayoutDashboard,
  List,
  MoreHorizontal,
  PlusCircle,
  Settings,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { useAuthContext } from "../hooks/AuthContext";
import { useI18n } from "../i18n";
import { getUnsyncedCount } from "../utils/syncService";

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

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  userName: string;
}

export default function Layout({
  children,
  currentPage,
  onNavigate,
  userName,
}: LayoutProps) {
  const { t } = useI18n();
  const [moreOpen, setMoreOpen] = useState(false);
  const { isAdmin } = useAuthContext();
  const [unsyncedCount] = useState(() => getUnsyncedCount());

  const initials =
    userName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const mainTabs: { id: Page; icon: ReactNode; label: string }[] = [
    {
      id: "dashboard",
      icon: <LayoutDashboard size={20} />,
      label: t("dashboard"),
    },
    { id: "newEntry", icon: <PlusCircle size={20} />, label: t("addEntry") },
    { id: "entries", icon: <List size={20} />, label: t("entries") },
  ];

  const moreItems: { id: Page; icon: ReactNode; label: string }[] = [
    { id: "customers", icon: <Users size={20} />, label: t("customers") },
    { id: "vehicles", icon: <Truck size={20} />, label: t("vehicles") },
    { id: "reports", icon: <BarChart2 size={20} />, label: t("reports") },
    { id: "notes", icon: <FileText size={20} />, label: t("notes") },
    { id: "settings", icon: <Settings size={20} />, label: t("settings") },
    ...(isAdmin
      ? [
          {
            id: "admin" as Page,
            icon: <ShieldCheck size={20} />,
            label: "Admin",
          },
        ]
      : []),
  ];

  const morePageIds = moreItems.map((m) => m.id);
  const isMoreActive = morePageIds.includes(currentPage);

  return (
    <div className="app-shell flex flex-col">
      <header
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-50"
        style={{ backgroundColor: "#BFD8A8" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: "#154A27" }}
          >
            A
          </div>
          <span
            className="font-semibold text-base"
            style={{ color: "#154A27" }}
          >
            ACW HuskTrack
          </span>
        </div>
        <button
          type="button"
          data-ocid="settings.link"
          onClick={() => onNavigate("settings")}
          className="focus:outline-none"
          aria-label="Settings / Profile"
        >
          <div className="relative">
            <Avatar className="w-8 h-8">
              <AvatarFallback
                className="text-xs font-semibold text-white"
                style={{ backgroundColor: "#154A27" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            {unsyncedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-background" />
            )}
          </div>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] border-t border-border bg-card z-50"
        style={{ boxShadow: "0 -2px 12px rgba(21,74,39,0.08)" }}
      >
        <div className="flex">
          {mainTabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              data-ocid={`nav.${tab.id}.link`}
              onClick={() => onNavigate(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                currentPage === tab.id
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {tab.icon}
              <span className="text-[10px]">{tab.label}</span>
            </button>
          ))}

          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                data-ocid="nav.more.button"
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                  isMoreActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                <MoreHorizontal size={20} />
                <span className="text-[10px]">{t("more")}</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-w-[430px] mx-auto rounded-t-2xl pb-8"
            >
              <SheetHeader>
                <SheetTitle
                  className="text-left text-sm font-semibold"
                  style={{ color: "#154A27" }}
                >
                  {t("more")}
                </SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {moreItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    data-ocid={`more.${item.id}.link`}
                    onClick={() => {
                      onNavigate(item.id);
                      setMoreOpen(false);
                    }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${
                      currentPage === item.id
                        ? "text-white"
                        : "bg-muted text-foreground hover:bg-secondary"
                    }`}
                    style={
                      currentPage === item.id
                        ? { backgroundColor: "#154A27" }
                        : undefined
                    }
                  >
                    {item.icon}
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}
