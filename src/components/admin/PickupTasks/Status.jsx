import { useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import axiosMerchant from "@/axios";
import { default as Select } from "@/components/misc/Select";
import { Button } from "@/components/ui/button";
import { handleError } from "@/utils/helpers";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

function Status({ onSubmitSuccess, record, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const statuses = [
    { value: "to_pickup", label: "To Pickup" },
    { value: "pending", label: "Pending" },
    { value: "picked", label: "Picked" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];
  console.log(record,'record')
  const [statusValue, setStatusValue] = useState({
    value: record.status,
    label:
      statuses.find((status) => status.value === record.status)?.label || "",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      if (
        new Boolean(statusValue.value) == new Boolean(formData.get("status"))
      ) {
        toast.error("Please select different status.");
      } else {
        const response = await axiosMerchant.post(
          "pickup_tasks/change_status",
          formData
        );
        toast.success(response.data.message);
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
        onClose();
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };
  const { t } = useTranslation();
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] min-h-[300px]">
        <DialogHeader id="no-print">
          <DialogTitle>{t("Update Status")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className=" flex flex-col justify-between h-full" encType="multipart/form-data">
          <div>
            <label htmlFor="status">Status</label>
            <Select
              name="status"
              options={statuses?.map((status) => ({
                value: status.value,
                label: status.label,
              }))}
              className="basic-multi-select"
              classNamePrefix="select"
              defaultValue={statusValue}
            />
          </div>
          <input type="hidden" name="id" value={record.id} />
          <div className="flex justify-end gap-x-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Status;
