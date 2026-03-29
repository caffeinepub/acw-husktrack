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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { useAuthContext } from "../hooks/AuthContext";
import { useActor } from "../hooks/useActor";
import {
  addLocalUser,
  deleteLocalUser,
  listLocalUsers,
  updateLocalUserPin,
  updateLocalUserRole,
} from "../hooks/useAuth";
import { useI18n } from "../i18n";

type RoleKey = "admin" | "staff";

function roleToBackend(r: RoleKey): Record<string, null> {
  if (r === "admin") return { admin: null };
  return { staff: null };
}

function getRoleBadgeStyle(role: RoleKey) {
  if (role === "admin")
    return { bg: "#154A27", text: "#ffffff", label: "Admin" };
  return { bg: "#2563eb", text: "#ffffff", label: "Staff" };
}

function PinInput({
  value,
  onChange,
}: { value: string; onChange: (v: string) => void }) {
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
      onChange(digits.map((d, i) => (i === idx - 1 ? "" : d)).join(""));
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
    <div className="flex gap-1.5 justify-start">
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
  );
}

export default function Admin() {
  const { t } = useI18n();
  const { user, pin, isAdmin } = useAuthContext();
  const { actor } = useActor();

  const [users, setUsers] = useState(() => listLocalUsers());

  // Create user form
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<RoleKey>("staff");
  const [newPin, setNewPin] = useState("");
  const [creating, setCreating] = useState(false);

  // Inline role change state
  const [changingRoleFor, setChangingRoleFor] = useState<string | null>(null);
  const [newRoleForUser, setNewRoleForUser] = useState<RoleKey>("staff");

  // Reset PIN state
  const [resetPinFor, setResetPinFor] = useState<string | null>(null);
  const [resetPinValue, setResetPinValue] = useState("");
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  const refreshUsers = () => setUsers(listLocalUsers());

  if (!isAdmin) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6"
        data-ocid="admin.error_state"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "#FEF2F2" }}
        >
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold" style={{ color: "#154A27" }}>
            Access Denied
          </h2>
          <p className="text-sm text-muted-foreground">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim() || newPin.length !== 6) {
      toast.error("Fill all fields and enter a 6-digit PIN");
      return;
    }
    const existing = listLocalUsers().find(
      (u) => u.username === newUsername.trim(),
    );
    if (existing) {
      toast.error("Username already exists");
      return;
    }
    setCreating(true);
    try {
      // Save locally first
      addLocalUser(newUsername.trim(), newPin, newName.trim(), newRole);
      // Sync to backend in background
      if (actor && user) {
        try {
          await (actor as any).adminCreateUser(
            user.username,
            pin,
            newUsername.trim(),
            newPin,
            newName.trim(),
            roleToBackend(newRole),
          );
        } catch {
          // local save succeeded, backend sync optional
        }
      }
      toast.success("User created successfully!");
      setNewName("");
      setNewUsername("");
      setNewPin("");
      setNewRole("staff");
      refreshUsers();
    } finally {
      setCreating(false);
    }
  };

  const handleChangeRole = async (targetUsername: string) => {
    updateLocalUserRole(targetUsername, newRoleForUser);
    if (actor && user) {
      try {
        await (actor as any).adminChangeUserRole(
          user.username,
          pin,
          targetUsername,
          roleToBackend(newRoleForUser),
        );
      } catch {
        /* local update already done */
      }
    }
    toast.success("Role updated!");
    setChangingRoleFor(null);
    refreshUsers();
  };

  const handleResetPin = async (targetUsername: string) => {
    if (resetPinValue.length !== 6) {
      toast.error("PIN must be 6 digits");
      return;
    }
    updateLocalUserPin(targetUsername, resetPinValue);
    if (actor && user) {
      try {
        await (actor as any).adminChangeUserPin(
          user.username,
          pin,
          targetUsername,
          resetPinValue,
        );
      } catch {
        /* local update already done */
      }
    }
    toast.success("PIN reset!");
    setResetPinFor(null);
    setResetPinValue("");
  };

  const handleDeleteUser = async (targetUsername: string) => {
    if (targetUsername === user?.username) {
      toast.error("Cannot delete your own account");
      return;
    }
    setDeletingUser(targetUsername);
    try {
      deleteLocalUser(targetUsername);
      if (actor && user) {
        try {
          await (actor as any).adminDeleteUser(
            user.username,
            pin,
            targetUsername,
          );
        } catch {
          /* local delete already done */
        }
      }
      toast.success("User deleted");
      refreshUsers();
    } finally {
      setDeletingUser(null);
    }
  };

  return (
    <div className="px-4 py-5 space-y-5" data-ocid="admin.page">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "#BFD8A8" }}
        >
          <ShieldCheck className="h-5 w-5" style={{ color: "#154A27" }} />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "#154A27" }}>
            Admin Panel
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage users and roles
          </p>
        </div>
      </div>

      {/* Create User */}
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-sm font-semibold flex items-center gap-2"
            style={{ color: "#154A27" }}
          >
            <UserPlus className="h-4 w-4" />
            Create New User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreateUser}
            className="space-y-3"
            data-ocid="admin.panel"
          >
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Full Name *</Label>
              <Input
                data-ocid="admin.input"
                placeholder="Enter full name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border-input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Username *</Label>
              <Input
                placeholder="Enter username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="border-input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Role *</Label>
              <Select
                value={newRole}
                onValueChange={(v) => setNewRole(v as RoleKey)}
              >
                <SelectTrigger
                  data-ocid="admin.select"
                  className="border-input"
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">6-Digit PIN *</Label>
              <PinInput value={newPin} onChange={setNewPin} />
            </div>
            <Button
              data-ocid="admin.submit_button"
              type="submit"
              className="w-full text-white font-semibold"
              style={{ backgroundColor: "#154A27" }}
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-sm font-semibold flex items-center gap-2"
            style={{ color: "#154A27" }}
          >
            <Users className="h-4 w-4" />
            Registered Users
            {users.length > 0 && (
              <span
                className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#BFD8A8", color: "#154A27" }}
              >
                {users.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div
              className="text-center py-6"
              data-ocid="admin.users.empty_state"
            >
              <p className="text-xs text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <div className="space-y-3" data-ocid="admin.users.list">
              {users.map((u, i) => {
                const badge = getRoleBadgeStyle(u.role);
                const isSelf = u.username === user?.username;
                return (
                  <div
                    key={u.username}
                    className="p-3 rounded-xl bg-muted space-y-2"
                    data-ocid={`admin.users.item.${i + 1}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{u.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {u.username}
                        </p>
                      </div>
                      <Badge
                        className="text-[10px] font-semibold border-0"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {badge.label}
                      </Badge>
                    </div>

                    {changingRoleFor === u.username ? (
                      <div className="flex gap-2 items-center">
                        <Select
                          value={newRoleForUser}
                          onValueChange={(v) => setNewRoleForUser(v as RoleKey)}
                        >
                          <SelectTrigger className="flex-1 h-8 text-xs border-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="h-8 text-xs text-white"
                          style={{ backgroundColor: "#154A27" }}
                          onClick={() => handleChangeRole(u.username)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => setChangingRoleFor(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : resetPinFor === u.username ? (
                      <div className="space-y-2">
                        <PinInput
                          value={resetPinValue}
                          onChange={setResetPinValue}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs text-white"
                            style={{ backgroundColor: "#154A27" }}
                            onClick={() => handleResetPin(u.username)}
                          >
                            Save PIN
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs"
                            onClick={() => {
                              setResetPinFor(null);
                              setResetPinValue("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs"
                          data-ocid={`admin.users.edit_button.${i + 1}`}
                          onClick={() => {
                            setChangingRoleFor(u.username);
                            setNewRoleForUser(u.role);
                          }}
                        >
                          Change Role
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs"
                          data-ocid={`admin.users.secondary_button.${i + 1}`}
                          onClick={() => {
                            setResetPinFor(u.username);
                            setResetPinValue("");
                          }}
                        >
                          {t("resetPIN")}
                        </Button>
                        {!isSelf && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-destructive border-destructive"
                                data-ocid={`admin.users.delete_button.${i + 1}`}
                                disabled={deletingUser === u.username}
                              >
                                {deletingUser === u.username ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Delete"
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete {u.name}?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-ocid="admin.cancel_button">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  data-ocid="admin.confirm_button"
                                  onClick={() => handleDeleteUser(u.username)}
                                  className="bg-destructive text-white"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-4">
          <h3
            className="text-xs font-semibold mb-3"
            style={{ color: "#154A27" }}
          >
            Role Permissions
          </h3>
          <div className="space-y-2">
            {[
              {
                role: "Admin",
                desc: "Full access — entries, deletions, payments, user management",
                color: "#154A27",
              },
              {
                role: "Staff",
                desc: "Create and view entries, manage customers and vehicles",
                color: "#2563eb",
              },
            ].map((item, i) => (
              <div
                key={item.role}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted"
                data-ocid={`admin.item.${i + 1}`}
              >
                <div
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: item.color }}
                  >
                    {item.role}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
