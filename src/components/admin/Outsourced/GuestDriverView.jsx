import React, { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ImagePreview from "@/components/misc/ImagePreview";
import { useTranslation } from "react-i18next";
import axiosMerchant from "@/axios";
import { handleError } from "@/utils/helpers";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
// لو عندك textarea جاهزة في ui، استوردها. لو لأ، استخدم <textarea> العادي:
import { Textarea } from "@/components/ui/textarea"; // لو غير موجود، استبدلها بـ <textarea>

function GuestDriverView({ record, onClose }) {
  const { t } = useTranslation();

  const [btnLoading, setBtnLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const canApproveOrReject = record?.driver?.status === "pending";

  const handleApprove = async () => {
    setBtnLoading(true);
    try {
      const response = await axiosMerchant.post(`guest-drivers/approve`, {
        driver_id: record?.driver?.id,
      });
      toast.success(response.data.message);
      onClose();
    } catch (error) {
      handleError(error);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason?.trim()) {
      toast.error(t("Please provide a rejection reason"));
      return;
    }
    setRejectLoading(true);
    try {
      const response = await axiosMerchant.post(`guest-drivers/reject`, {
        driver_id: record?.driver?.id,
        reason: rejectReason,
      });
      toast.success(response.data.message);
      onClose();
    } catch (error) {
      handleError(error);
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader id="no-print">
          <DialogTitle>{t("Guest Driver Details")}</DialogTitle>
          <DialogDescription>
            {t("View complete information about this guest driver")}
          </DialogDescription>
        </DialogHeader>
        <Separator />

        <div className="grid grid-cols-1 gap-4">
          {/* Basic Info */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg mb-3">
                {t("Basic Information")}
              </h3>
            </div>
            <ul className="grid gap-3">
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">
                  {t("Name")}
                </span>
                <span className="text-right">{record?.name || "-"}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">
                  {t("Email")}
                </span>
                <span className="text-right">{record?.email || "-"}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">
                  {t("Phone")}
                </span>
                <span className="text-right">
                  {record?.driver?.phone || "-"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">
                  {t("Company Name")}
                </span>
                <span className="text-right">
                  {record?.driver?.company_name || "-"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">
                  {t("Role")}
                </span>
                <span className="text-right">
                  {record?.roles?.[0]?.name || "Guest Driver"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">
                  {t("Created At")}
                </span>
                <span className="text-right">
                  {record?.created_at
                    ? new Date(record.created_at).toLocaleString()
                    : "-"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">
                  {t("Status")}
                </span>
                <span className="text-right">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      record?.driver?.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : record?.driver?.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {record?.driver?.status === "approved"
                      ? t("Approved")
                      : record?.driver?.status === "rejected"
                      ? t("Rejected")
                      : t("Pending")}
                  </span>
                </span>
              </li>

              {/* Show reason if rejected */}
              {record?.driver?.status === "rejected" &&
                record?.driver?.rejection_reason && (
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">
                      {t("Rejection Reason")}
                    </span>
                    <span className="text-right max-w-[65%]">
                      {record?.driver?.rejection_reason}
                    </span>
                  </li>
                )}
            </ul>
          </div>

          {/* Profile Image */}
          {record?.driver?.profile_image && (
            <div>
              <Separator className="my-4" />
              <h3 className="font-semibold text-lg mb-3">
                {t("Profile Image")}
              </h3>
              <div className="flex justify-center">
                <ImagePreview
                  src={record.driver.profile_image}
                  alt={t("Profile Image")}
                  className="max-w-32 max-h-32 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Documents */}
          <div>
            <Separator className="my-4" />
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg mb-3">{t("Documents")}</h3>

              {canApproveOrReject && (
                <div className="flex gap-2">
                  {/* Approve */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApprove}
                    disabled={
                      btnLoading ||
                      !(
                        record?.driver?.id_card &&
                        record?.driver?.license &&
                        record?.driver?.car_ownership_id
                      )
                    }
                  >
                    {btnLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t("Approve")
                    )}
                  </Button>

                  {/* Reject */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRejectOpen((v) => !v)}
                    disabled={rejectLoading}
                  >
                    {rejectLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t("Reject")
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <ul className="grid gap-3">
              {record?.driver?.license && (
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">
                    {t("License")}
                  </span>
                  <span>
                    <ImagePreview
                      src={record.driver.license}
                      alt={t("License")}
                      className="max-w-20 max-h-20"
                    />
                  </span>
                </li>
              )}

              {record?.driver?.id_card && (
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">
                    {t("ID Card")}
                  </span>
                  <span>
                    <ImagePreview
                      src={record.driver.id_card}
                      alt={t("ID Card")}
                      className="max-w-20 max-h-20"
                    />
                  </span>
                </li>
              )}

              {record?.driver?.car_ownership_id && (
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">
                    {t("Car Ownership ID")}
                  </span>
                  <span>
                    <ImagePreview
                      src={record.driver.car_ownership_id}
                      alt={t("Car Ownership ID")}
                      className="max-w-20 max-h-20"
                    />
                  </span>
                </li>
              )}
            </ul>

            {!record?.driver?.license &&
              !record?.driver?.id_card &&
              !record?.driver?.car_ownership_id && (
                <p className="text-muted-foreground text-center py-4">
                  {t("No documents uploaded")}
                </p>
              )}

            {/* Reject Panel (toggeled inline) */}
            {rejectOpen && canApproveOrReject && (
              <div className="mt-4 p-3 border rounded-lg">
                <label className="block text-sm font-medium mb-2">
                  {t("Rejection Reason (required)")}
                </label>
                {Textarea ? (
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t("Type the reason here...")}
                    className="min-h-[100px]"
                  />
                ) : (
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t("Type the reason here...")}
                    className="w-full min-h-[100px] border rounded p-2"
                  />
                )}
                <div className="flex justify-end gap-2 mt-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setRejectOpen(false);
                      setRejectReason("");
                    }}
                  >
                    {t("Cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={rejectLoading}
                  >
                    {rejectLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t("Confirm Reject")
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t("Close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GuestDriverView;
