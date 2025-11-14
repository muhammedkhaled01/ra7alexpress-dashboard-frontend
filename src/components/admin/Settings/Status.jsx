import React, { useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import axiosMerchant from "@/axios";
import { toast } from 'react-hot-toast';
import { Loader2 } from "lucide-react";
import { default as Select } from "@/components/misc/Select"
import { useDispatch } from "react-redux";
import { handleError } from "@/utils/helpers";

function Status({ onSubmitSuccess, record, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusValue, setStatusValue] = useState({ value: record.status, label: record.status == "active" ? 'Active' : "Inactive" })
  const dispatch = useDispatch()

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget)
      if (new Boolean(statusValue.value) == new Boolean(formData.get('status'))) {
        toast.error("Please select different status.");
      } else {
        const response = await axiosMerchant.post("settings/change_status", formData);
        toast.success(response.data.message);
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
        onClose();
      }
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false);
    }
  };

  const statuses = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "In active" },
  ]

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
              options={statuses?.map(status => ({ value: status.value, label: status.label }))}
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