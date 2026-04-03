import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Pencil, Phone, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuthContext } from "../hooks/AuthContext";
import {
  type LocalCustomer,
  addLocalCustomer,
  deleteLocalCustomer,
  getCoconutCustomers,
  getHuskCustomers,
  updateLocalCustomer,
} from "../hooks/useLocalCustomers";
import { useI18n } from "../i18n";

type CustomerTab = "husk" | "coconut";

export default function Customers() {
  const { t } = useI18n();
  const { isAdmin } = useAuthContext();

  const [activeTab, setActiveTab] = useState<CustomerTab>("husk");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<LocalCustomer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const getCustomers = () =>
    activeTab === "husk" ? getHuskCustomers() : getCoconutCustomers();

  const [customers, setCustomers] = useState<LocalCustomer[]>(() =>
    getCustomers(),
  );

  const refresh = () => setCustomers(getCustomers());

  const filtered = useMemo(
    () =>
      customers.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [customers, search],
  );

  const openAdd = () => {
    setEditCustomer(null);
    setName("");
    setPhone("");
    setLocation("");
    setDialogOpen(true);
  };

  const openEdit = (c: LocalCustomer) => {
    setEditCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setLocation(c.location);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (editCustomer) {
      updateLocalCustomer(editCustomer.id, { name, phone, location });
      toast.success("Customer updated!");
    } else {
      addLocalCustomer(name, phone, location, activeTab);
      toast.success("Customer added!");
    }
    setDialogOpen(false);
    refresh();
  };

  const handleDelete = (id: number) => {
    deleteLocalCustomer(id);
    toast.success("Customer deleted");
    refresh();
  };

  const isHusk = activeTab === "husk";
  const tabColor = isHusk ? "#154A27" : "#8B5E3C";

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: tabColor }}>
          {t("customers")}
        </h2>
        <Button
          size="sm"
          data-ocid="customers.primary_button"
          className="text-white text-xs"
          style={{ backgroundColor: tabColor }}
          onClick={openAdd}
        >
          <Plus size={14} className="mr-1" /> {t("addCustomer")}
        </Button>
      </div>

      {/* Husk / Coconut Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setActiveTab("husk");
            setSearch("");
            setTimeout(() => setCustomers(getHuskCustomers()), 0);
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "husk"
              ? "bg-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
          style={activeTab === "husk" ? { color: "#154A27" } : {}}
        >
          <img
            src="/assets/chatgpt_image_apr_1_2026_10_59_53_am-019d4787-a100-755d-a253-139059ad4aeb.png"
            alt="husk"
            className="w-6 h-6 object-contain inline-block"
          />{" "}
          {t("huskCustomers")}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("coconut");
            setSearch("");
            setTimeout(() => setCustomers(getCoconutCustomers()), 0);
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "coconut"
              ? "bg-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
          style={activeTab === "coconut" ? { color: "#8B5E3C" } : {}}
        >
          🥥 {t("coconutCustomers")}
        </button>
      </div>

      <div className="relative">
        <Input
          data-ocid="customers.search_input"
          placeholder={t("searchCustomers")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-input pr-8"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent
            className="p-6 text-center text-sm text-muted-foreground"
            data-ocid="customers.empty_state"
          >
            {t("noData")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((c, idx) => (
            <Card
              key={c.id}
              className="shadow-card border-0"
              data-ocid={`customers.item.${idx + 1}`}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{c.name}</p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      {c.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone size={10} /> {c.phone}
                        </p>
                      )}
                      {c.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin size={10} /> {c.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      data-ocid={`customers.edit_button.${idx + 1}`}
                      className="h-7 w-7 p-0"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil size={12} />
                    </Button>
                    {isAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-ocid={`customers.delete_button.${idx + 1}`}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete {c.name}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="customers.cancel_button">
                              {t("cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              data-ocid="customers.confirm_button"
                              onClick={() => handleDelete(c.id)}
                              className="bg-destructive text-white"
                            >
                              {t("delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-[390px] rounded-2xl"
          data-ocid="customers.dialog"
        >
          <DialogHeader>
            <DialogTitle style={{ color: tabColor }}>
              {editCustomer ? t("edit") : t("add")} {t("customer")} (
              {isHusk ? t("huskCustomers") : t("coconutCustomers")})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("name")} *</Label>
              <Input
                data-ocid="customers.input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("name")}
                className="border-input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("phone")}</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("phone")}
                type="tel"
                className="border-input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("location")}</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("location")}
                className="border-input"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="customers.cancel_button"
              onClick={() => setDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              data-ocid="customers.save_button"
              onClick={handleSave}
              className="text-white"
              style={{ backgroundColor: tabColor }}
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
