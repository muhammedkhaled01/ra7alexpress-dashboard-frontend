import { useState } from "react";
import { useSelector } from "react-redux";
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

export default function RequestPickupButton({ className, onSuccess }) {
  const user = useSelector(state => state.auth.user);
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [shipmentsCount, setShipmentsCount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!scheduledAt) {
      toast.error("من فضلك اختر تاريخ/وقت الاستلام");
      return;
    }
    const count = Number(shipmentsCount);
    if (!count || count < 1) {
      toast.error("عدد الأوردرات لازم يكون رقم أكبر من 0");
      return;
    }

    setSubmitting(true);
    try {
      // 👇 اختَر واحدة من السطرين دول حسب إعداد axiosMerchant عندك:
      await axiosMerchant.post("/pickups", {
        scheduled_at: scheduledAt,
        shipments_count: count,
        sender_id: user?.id,
        sender_name: user?.name
      });

      toast.success("تم إرسال شحنة الاستلام بنجاح ✅");
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
        "تعذر إرسال الشحنة، حاول مرة أخرى";
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
          شحنة استلام (Request Pickup)
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>شحنة استلام جديد</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="scheduledAt">تاريخ ووقت الاستلام</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="shipmentsCount">عدد الأوردرات</Label>
            <Input
              id="shipmentsCount"
              type="number"
              min={1}
              placeholder="مثال: 10"
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
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "جاري الإرسال..." : "إرسال الشحنة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
