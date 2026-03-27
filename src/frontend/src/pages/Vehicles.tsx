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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Truck } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  useDeleteVehicle,
  useGetAllVehicles,
  useIsAdmin,
} from "../hooks/useQueries";
import { useI18n } from "../i18n";

export default function Vehicles() {
  const { t } = useI18n();
  const { data: vehicles, isLoading } = useGetAllVehicles();
  const { data: isAdmin } = useIsAdmin();
  const deleteVehicle = useDeleteVehicle();

  const sorted = useMemo(
    () =>
      [...(vehicles ?? [])].sort((a, b) => Number(b.usageCount - a.usageCount)),
    [vehicles],
  );

  const handleDelete = async (id: bigint) => {
    try {
      await deleteVehicle.mutateAsync(id);
      toast.success("Vehicle deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: "#154A27" }}>
        {t("vehicles")}
      </h2>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent
            className="p-6 text-center text-sm text-muted-foreground"
            data-ocid="vehicles.empty_state"
          >
            {t("noData")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((v, idx) => (
            <Card
              key={v.id.toString()}
              className="shadow-card border-0"
              data-ocid={`vehicles.item.${idx + 1}`}
            >
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: "#154A27" }}
                  >
                    <Truck size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{v.vehicleNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("usageCount")}: {v.usageCount.toString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className="text-white text-xs font-semibold"
                    style={{ backgroundColor: "#154A27" }}
                  >
                    {v.usageCount.toString()}x
                  </Badge>
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-ocid={`vehicles.delete_button.${idx + 1}`}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete {v.vehicleNumber}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the vehicle record.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-ocid="vehicles.cancel_button">
                            {t("cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            data-ocid="vehicles.confirm_button"
                            onClick={() => handleDelete(v.id)}
                            className="bg-destructive text-white"
                          >
                            {t("delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
