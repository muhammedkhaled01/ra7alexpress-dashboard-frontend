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
import { Textarea } from "@/components/ui/textarea";

function Status({ onSubmitSuccess, record, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const statuses = [
    { value: "to_call", label: "To Call" },
    { value: "hold", label: "Hold" },
    { value: "closed", label: "Closed" },
  ];

  const [statusValue, setStatusValue] = useState({
    value: record.status,
    label: statuses.find((status) => status.value === record.status)?.label || "",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);

      if (
        new Boolean(statusValue.value) === new Boolean(formData.get("status"))
      ) {
        toast.error("Please select a different status.");
      } else {
        const response = await axiosMerchant.post(
          "crm_tasks/change_status",
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
console.log("here")
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader id="no-print">
          <DialogTitle>Update Status</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div>
            <label htmlFor="status">Status</label>
            <Select
              name="status"
              options={statuses.map((status) => ({
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
