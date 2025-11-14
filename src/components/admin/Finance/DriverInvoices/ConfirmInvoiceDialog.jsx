import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { CheckCircle, Loader2 } from "lucide-react";
import { driverName, formatDecimalValue, handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";
import { useSelector } from "react-redux";

function ConfirmInvoiceDialog({ invoice, onSubmitSuccess }) {
  const {decimalPrecision} = useSelector((state) => state.setting);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentValid, setIsPaymentValid] = useState(false);

  const [cash, setCash] = useState(false);

  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      form.append("invoice_id", invoice?.id);
      form.append("runsheet_id", invoice?.runsheet?.id);
      const response = await axiosMerchant.post(
        "driver_invoices/confirm_invoice",
        form
      );
      toast.success(response.data.message);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      setShowDialog(false);
    } catch (error) {
      handleError(error);
      setShowDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const cashValue = parseFloat(cash) || 0;
    const invoiceTotal = parseFloat(invoice?.driver_total_commission) || 0;

    const isValid = formatDecimalValue(cashValue, decimalPrecision) === formatDecimalValue(invoiceTotal, decimalPrecision);

    const shouldEnable = isValid && cashValue > 0;

    setIsPaymentValid(shouldEnable);
  }, [cash, invoice?.driver_total_commission, decimalPrecision]);
  useEffect(() => {
    if (showDialog) {
      setCash(
        invoice?.driver_total_commission != null
          ? String(invoice.driver_total_commission)
          : ""
      );
    }
  }, [showDialog, invoice?.driver_total_commission]);

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button size="sm" variant="confirm">
          <CheckCircle />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirm Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <strong>
            {t("Total Amount to be paid:")} {invoice.driver_total_commission}
          </strong>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="paid_to_driver">{t("Paid to Driver")}:</label>
              <Input
                id="paid_to_driver"
                name="paid_to_driver"
                type="number"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
              />
            </div>
            <div className="input-container">
              <label htmlFor="notes">{t("Notes")}:</label>
              <Textarea name="notes" />
            </div>
          </div>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t("Close")}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            className="mt-2 ml-2"
            disabled={isLoading || !isPaymentValid}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("Confirm")
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmInvoiceDialog;
