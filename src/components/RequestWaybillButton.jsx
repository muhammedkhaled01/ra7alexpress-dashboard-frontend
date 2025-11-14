import { useState } from "react";
import axiosMerchant from "@/axios";
import toast from "react-hot-toast";
import { Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

export default function RequestWaybillButton({ className, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const { t } = useTranslation()
  const [shipmentsCount, setShipmentsCount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!scheduledAt) {
      toast.error(t("Please select a pickup date/time"));
      return;
    }
    const count = Number(shipmentsCount);
    if (!count || count < 1) {
      toast.error(t("The number of shipments must be a number greater than 0"));
      return;
    }

    setSubmitting(true);
    try {
      await axiosMerchant.post("/waybill-request", {
        scheduled_at: scheduledAt,
        waybills_count: count,
      });
      toast.success(t("Pickup request sent successfully ✅"));
      setOpen(false);
      setScheduledAt("");
      setShipmentsCount("");
      onSuccess && onSuccess();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors &&
          Object.values(err.response.data.errors)[0][0]) ||
        t("Failed to send request, please try again");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && setOpen(o)}>
      <DialogTrigger asChild>
        <Button className={className} onClick={() => setOpen(true)}>
          <Clipboard className="mr-2 h-4 w-4" />
          {t("Request Waybill")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("New Pickup Request")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="scheduledAt">{t("Pickup Date and Time")}</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="shipmentsCount">{t("Number of Shipments")}</Label>
            <Input
              id="shipmentsCount"
              type="number"
              min={1}
              placeholder={t("Example: 10")}
              value={shipmentsCount}
              onChange={(e) => setShipmentsCount(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            {t("Cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? t("Submitting...") : t("Send Request")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}