import React, { useEffect, useState } from "react";
import { useSelector } from 'react-redux';

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
import { CheckCircle, Loader2, Plus, TestTubeDiagonalIcon } from "lucide-react";
import { driverName, formatDecimalValue, handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";

function HoldingConfirmDialog({ runsheet, codTotal, onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [bankTransfer, setBankTransfer] = useState(0);
  const [cash, setCash] = useState(0);
  const [isPaymentValid, setIsPaymentValid] = useState(true);
  const { decimalPrecision } = useSelector((state) => state.setting);

  const { t } = useTranslation();

  useEffect(() => {
    if (showDialog) {
      setCash(formatDecimalValue(cash, decimalPrecision));
      setBankTransfer(formatDecimalValue(bankTransfer, decimalPrecision));
    }
  }, [decimalPrecision, showDialog]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      form.append("paid_by_cash", cash || 0);
      form.append("paid_by_bank", bankTransfer || 0);
      form.append("driver_runsheet_id", runsheet.id);
      form.append("total_amount", codTotal);
      form.append("remaining_amount", remaining);
      form.append("driver_id", runsheet.driver_id);
      const response = await axiosMerchant.post("cod_collection/store_holding", form);
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

  const totalAmount = parseFloat(runsheet?.submission?.total_amount) || 0;
  const paidAmount = parseFloat(runsheet?.submission?.paid_amount) || 0;
  const remaining = totalAmount - paidAmount;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="confirm"><CheckCircle /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t(
              `Confirm Payment | Runsheet: ${runsheet.id} Driver: ${driverName(
                runsheet.driver
              )}`
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {remaining !== 0 && <>
            <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
              <div>
                <label htmlFor="paid_by_cash">{t("Cash")}:</label>
                <Input
                  id="paid_by_cash"
                  name="paid_by_cash"
                  type="number"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="paid_by_bank">{t("Bank Transfer")}:</label>
                <Input
                  id="paid_by_bank"
                  name="paid_by_bank"
                  type="number"
                  value={bankTransfer}
                  onChange={(e) => setBankTransfer(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="notes">{t("Notes")}:</label>
                <Textarea name="notes" />
              </div>
            </div>
            <br />
          </>}
          <div className="mt-2">
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="flex gap-x-2">
                <span>{t("Total Amount:")}</span>
                <strong>{formatDecimalValue(totalAmount, decimalPrecision)}</strong>
              </div>
              {/* <div className="flex gap-x-2">
                <span>{t("Payment")}:</span>
                <strong>
                  {formatDecimalValue(parseFloat(bankTransfer || 0) + parseFloat(cash || 0))}
                </strong>
              </div> */}
              <div className="flex gap-x-2">
                <span>{t("Paid Amount")}:</span>
                <strong>
                  {formatDecimalValue(paidAmount, decimalPrecision)}
                </strong>
              </div>
              <div className="flex gap-x-2">
                <span>{t("Remaining")}:</span>
                <strong>
                  {formatDecimalValue(remaining, decimalPrecision)}
                </strong>
              </div>
              {/* <div className="flex gap-x-2">
                <span>{t("Difference")}:</span>
                <strong>
                  {formatDecimalValue(
                    parseFloat(bankTransfer || 0) +
                    parseFloat(cash || 0) -
                    codTotal, decimalPrecision
                  )}
                </strong>
              </div> */}
              {/* {runsheet?.difference_shipments_count > 0 && */}
              <div className="flex gap-x-2">
                <span>{t("Difference Parcels")}:</span>
                <strong>
                  {runsheet?.difference_shipments_count}
                </strong>
              </div>
              {/* } */}
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

export default HoldingConfirmDialog;