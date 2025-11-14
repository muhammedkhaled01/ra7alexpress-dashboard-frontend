import { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import axiosMerchant from "@/axios";
import Select from "@/components/misc/Select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { handleError } from "@/utils/helpers";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";

const statuses = [
  { value: "RTO", label: "RTO" },
  { value: "CANCELLED", label: "Cancel" },
  { value: "RESCHEDULE", label: "Reschedule" },
  { value: "MOVE_TO_DISPATCH", label: "Dispatch" },
];

const statusMapping = {
  RTO: "closed",
  CANCELLED: "closed",
  RESCHEDULE: "hold",
  MOVE_TO_DISPATCH: "to_call",
};

const reverseStatusMapping = Object.fromEntries(
  Object.entries(statusMapping).map(([k, v]) => [v, k])
);

function EditTask({ onSubmitSuccess, isOpen, task, onClose }) {
  const { t } = useTranslation();
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      setStatus(reverseStatusMapping[task?.status] || "");
      setDate("");
    }
  }, [isOpen, task]);

  const resetForm = () => {
    setNote("");
    setStatus("");
    setDate("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      shipment_id: task?.shipment?.id,
      note,
      status: status,
      date: status === "RESCHEDULE" ? date : null,
    };

    try {
      setIsLoading(true);
      const { data } = await axiosMerchant.post(
        "crm_tasks/change_shipment_status",
        payload
      );
      toast.success(data.message);
      onSubmitSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-[500px] sm:max-w-[500px] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{t("Update Task Status")}</DialogTitle>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="px-6 input-container pb-4 space-y-4 max-h-[65vh] ">
          <div>
            <Label>{t("Note")}</Label>
            <Textarea
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("Write a note")}
            />
          </div>

          {/* Status (with high z-index wrapper) */}
          <div className="relative input-container z-[70]">
            <Label>{t("Status")}</Label>
            <Select
              name="status"
              options={statuses}
              value={statuses.find((opt) => opt.value === status) || null}
              onChange={(opt) => setStatus(opt?.value || "")}
              className="w-full"
            />
          </div>

          {status === "RESCHEDULE" && (
            <div className="grid gap-2">
              <Label>{t("Date")}</Label>
              <Input
                type="date"
                name="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          )}

          {/* زرار السبميت جوه الفورم لكن الفوتر sticky تحت */}
          <form
            onSubmit={handleSubmit}
            className="hidden"
            id="edit-task-form"
          />
        </div>

        {/* Sticky footer */}
        <DialogFooter className="mt-auto px-6 py-4 border-t bg-background sticky bottom-0 z-[60]">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t("Close")}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="edit-task-form"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("Update")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditTask;
