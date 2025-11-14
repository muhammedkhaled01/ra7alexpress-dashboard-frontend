import React, { useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from 'react-hot-toast';
import { Loader2 } from "lucide-react";

function Edit({ onSubmitSuccess, record, onClose }) {

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget)
      const response = await axiosMerchant.post("api/company/permissions/update", formData,);
      toast.success(response.data.message);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        errorMessages.forEach((errorMessage) => {
          toast.error(errorMessage);
        });
      } else {
        toast.error("An error occurred while submitting the form.");
      }
      console.error("Failed to submit data:", error);
      // No need to set setShowDialog(true) here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader id="no-print">
          <DialogTitle>Update Permission :: {record.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="name">Name</label>
              <Input
                id="name"
                name="name"
                type="text"
                defaultValue={record.name}
              />
            </div>
            <div className="input-container">
              <label htmlFor="guard_name">Guard name</label>
              <Input
                id="guard_name"
                name="guard_name"
                type="guard_name"
                defaultValue={record.guard_name}
                disabled
              />
            </div>
            <div>
              <Input
                id="id"
                name="id"
                type="hidden"
                value={record.id}
              />
            </div>
          </div>
          <div className="flex justify-end gap-x-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
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

export default Edit;
