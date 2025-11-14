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
import { Loader2, PauseCircle } from "lucide-react";
import { driverName, handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";

function HoldDialog({ runsheet, codTotal, onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");

  const [bankTransfer, setBankTransfer] = useState("");
  const [cash, setCash] = useState("");
  const [isPaymentValid, setIsPaymentValid] = useState(false);

  const { t } = useTranslation();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      form.append("driver_runsheet_id", runsheet.id);
      form.append("total_amount", codTotal);
      form.append("driver_id", runsheet.driver_id);
      form.set("hold_driver", holdDriver ? "1" : "0"); 
      const response = await axiosMerchant.post("cod_collection/hold", form);
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
    const bankValue = parseFloat(bankTransfer) || 0;
    const totalPayment = cashValue + bankValue;

    // 1. Determine payment rules based on difference shipments
    const hasDifferenceShipments = runsheet.difference_shipments_count > 0;
    let amountValid;

    if (hasDifferenceShipments) {
      // With difference shipments: total must be <= codTotal
      amountValid = totalPayment <= codTotal;
    } else {
      // Without difference shipments: total must be < codTotal
      amountValid = totalPayment < codTotal;
    }

    // 2. Check other validity requirements
    const isReasonValid = reason.trim() !== '';
    const hasPaymentValues = cashValue > 0 || bankValue > 0;

    // 3. Final validation state
    const isValid = amountValid && isReasonValid && hasPaymentValues;

    setIsPaymentValid(isValid);

    // // 4. Auto-correct overpayments
    // if (totalPayment > codTotal) {
    //   if (hasDifferenceShipments) {
    //     // For difference shipments, clamp to codTotal
    //     const remaining = codTotal - (hasDifferenceShipments ? bankValue : cashValue);
    //     if (cashValue > remaining) {
    //       setCash(formatDecimalValue(remaining,decimalPrecision));
    //     } else {
    //       setBankTransfer(formatDecimalValue((codTotal - cashValue),decimalPrecision));
    //     }
    //   } else {
    //     // For non-difference shipments, cap at 1 unit below codTotal
    //     const maxPayment = codTotal - 0.01;
    //     if (cashValue > maxPayment - bankValue) {
    //       setCash(formatDecimalValue((maxPayment - bankValue),decimalPrecision));
    //     } else {
    //       setBankTransfer(formatDecimalValue((maxPayment - cashValue),decimalPrecision));
    //     }
    //   }
    // }
  }, [cash, bankTransfer, codTotal, reason, runsheet.difference_shipments_count]);

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="hold"><PauseCircle /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {`${t("Hold")} | ${t("Runsheet")}: ${runsheet.id} ${t("Driver")}: ${driverName(
              runsheet.driver
            )}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="paid_by_cash">{t("Cash")}:</label>
              <Input
                id="paid_by_cash"
                name="paid_by_cash"
                type="number"
                value={cash}
                placeholder={t("Cash Placeholder")}
                onChange={(e) => setCash(e.target.value)}
              />
            </div>
            <div className="input-container">
              <label htmlFor="paid_by_bank">{t("Bank Transfer")}:</label>
              <Input
                id="paid_by_bank"
                name="paid_by_bank"
                type="number"
                value={bankTransfer}
                placeholder={t("Bank Transfer Placeholder")}
                onChange={(e) => setBankTransfer(e.target.value)}
              />
            </div>
            <div className="input-container">
              <label htmlFor="notes">{t("Notes")}:</label>
              <Textarea
                name="notes"
                value={reason}
                placeholder={t("Notes Placeholder")}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <br />
          <div className="mt-2">
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="flex gap-x-2">
                <span>{t("Total Amount:")}</span>
                <strong>{Math.round(codTotal)}</strong>
              </div>
              <div className="flex gap-x-2">
                <span>{t("Payment")}:</span>
                <strong>
                  {Math.round(parseFloat(bankTransfer || 0) + parseFloat(cash || 0))}
                </strong>
              </div>
              {runsheet?.difference_shipments_count > 0 &&
                <div className="flex gap-x-2">
                  <span>{t("Difference Parcels")}:</span>
                  <strong>
                    {runsheet?.difference_shipments_count}
                  </strong>
                </div>}
              <div className="flex gap-x-2">
                <span>{t("Difference")}:</span>
                <strong>
                  {Math.round(parseFloat(bankTransfer || 0) + parseFloat(cash || 0) - codTotal)}
                </strong>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("Close")}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className=""
              disabled={isLoading || !isPaymentValid}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("Confirm Hold")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default HoldDialog;