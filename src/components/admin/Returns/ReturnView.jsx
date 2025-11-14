import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const ReturnView = ({ returnData, isOpen, setIsOpen, onClose }) => {
  const { t } = useTranslation();

  if (!returnData) return null;


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t("Return Request Details")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400">
                {t("Shipment ID")}
              </h3>
              <p className="font-medium">{returnData.return_id}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400">
                {t("Status")}
              </h3>
              <Badge variant={
                returnData.status === "CREATED"
                  ? "created"
                  : returnData.status === "DELIVERED"
                    ? "delivered"
                    : returnData.status === "DELIVERY_EXCEPTION"
                      ? "exception"
                      : "outline"
              }>
                {returnData.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400">
                {t("Tracking Number")}
              </h3>
              <p className="font-medium">{returnData.shipment_tracking_no}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400">
                {t("Customer Name")}
              </h3>
              <p className="font-medium">{returnData.customer_name}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400">
              {t("Reason for Return")}
            </h3>
            <p className="font-medium">{returnData.reason}</p>
          </div>

          {returnData.notes && (
            <div>
              <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400">
                {t("Additional Notes")}
              </h3>
              <p className="font-medium">{returnData.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400">
                {t("Date Initiated")}
              </h3>
              <p className="font-medium">
                {new Date(returnData.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400">
                {t("Last Updated")}
              </h3>
              <p className="font-medium">
                {new Date(returnData.updated_at).toLocaleString()}
              </p>
            </div>
          </div>

          {returnData.images && returnData.images.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 mb-2">
                {t("Images")}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {JSON.parse(returnData.images).map((image, index) => (
                  <img
                    key={index}
                    src={`/storage/${image}`}
                    alt={`Return image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnView;
