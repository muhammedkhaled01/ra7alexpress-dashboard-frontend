import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Select from "@/components/misc/Select";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import axiosMerchant from "@/axios";
import { handleError } from "@/utils/helpers";

const ReturnEdit = ({ returnData, isOpen, setIsOpen, onClose, onSubmitSuccess }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(returnData?.status || "Pending");
  const [note, setNote] = useState("");
  const [shipmentStatuses, setShipmentStatuses] = useState([]);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    fetchShipmentStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchShipmentStatuses = async () => {
    setStatusLoading(true);
    try {
      const response = await axiosMerchant.get('statuses/all');

      // Combine system and static statuses from the API response
      const systemStatuses = response.data.data.system || [];
      const staticStatuses = response.data.data.static || [];

      // Format statuses for the dropdown and ensure no empty values
      const formattedStatuses = [...systemStatuses, ...staticStatuses]
        .filter(status => status.label && status.label.trim() !== '') // Filter out empty labels
        .map(status => ({
          value: status.label || `status-${status.id}`,
          label: t(status.label)
        }));

      setShipmentStatuses(formattedStatuses);
    } catch (error) {
      handleError(error);
      setShipmentStatuses([
        { value: "Pending", label: t("Pending") },
        { value: "In Progress", label: t("In Progress") },
        { value: "Completed", label: t("Completed") }
      ]);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("id", returnData.id);
      formData.append("status", status);
      if (note.trim()) {
        formData.append("note", note);
      }

      await axiosMerchant.post("returns/update", formData);

      setIsLoading(false);
      onSubmitSuccess();
      onClose();
    } catch (error) {
      setIsLoading(false);
      handleError(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t("Update Return Request")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="return-id">{t("Shipment ID")}</label>
                <p className="font-medium mt-1">{returnData?.return_id}</p>
              </div>
              <div>
                <label htmlFor="shipment-id">{t("Tracking Number")}</label>
                <p className="font-medium mt-1">{returnData?.shipment_tracking_no}</p>
              </div>
            </div>

            <div className="input-container">
              <label htmlFor="customer-name">{t("Customer Name")}</label>
              <p className="font-medium mt-1">{returnData?.customer_name}</p>
            </div>

            <div className="input-container">
              <label htmlFor="reason">{t("Reason for Return")}</label>
              <p className="font-medium mt-1">{returnData?.reason}</p>
            </div>

            <div className="input-container">
              <label htmlFor="status">{t("Status")}</label>
              <Select
                className="basic-multi-select"
                classNamePrefix="select"
                isDisabled={statusLoading}
                value={shipmentStatuses.find(option => option.value === status) || null}
                onChange={(selectedOption) => setStatus(selectedOption.value)}
                options={shipmentStatuses}
                placeholder={statusLoading ? t("Loading statuses...") : t("Select status...")}
                noOptionsMessage={() => t("No statuses available")}
              />
            </div>
            <div className="input-container">
              <label htmlFor="note">{`${t("Note")} (${t("optional")})`}</label>
              <textarea
                id="note"
                className="w-full p-2 border rounded-md mt-1"
                rows="3"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("Enter a note for this status change...")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("Updating...")}
                </>
              ) : (
                t("Update Shipment")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnEdit;
