import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

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
import { CheckCircle, Loader2, } from "lucide-react";
import { driverName, formatDecimalValue, handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";

function ConfirmDialog({ runsheet, codTotal, onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [bankTransfer, setBankTransfer] = useState(false);
  const [cash, setCash] = useState(false);
  const [isPaymentValid, setIsPaymentValid] = useState(false);
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
      form.append("driver_runsheet_id", runsheet.id);
      form.append("total_amount", codTotal);
      const response = await axiosMerchant.post("cod_collection/store", form);
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
    const bankTransferValue = parseFloat(bankTransfer) || 0;
    const totalPayment = cashValue + bankTransferValue;
    setIsPaymentValid(totalPayment === Number(codTotal));
  }, [cash, bankTransfer, codTotal]);

  const validateDecimalInput = (value) => {
    const regex = new RegExp(`^\\d*\\.?\\d{0,${decimalPrecision || 3}}$`);
    return regex.test(value);
  };

  const handleInputChange = (value, setter) => {
    if (!validateDecimalInput(value)) {
      return; 
    }
    const parts = value.split('.');
    if (parts.length === 2 && parts[1].length > (decimalPrecision || 3)) {
      value = `${parts[0]}.${parts[1].substring(0, decimalPrecision || 3)}`;
    }
    setter(value);
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="confirm"><CheckCircle /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {
              `${t("Confirm Payment")} | ${t("Runsheet")}: ${runsheet.id} ${t("Driver")}: ${driverName(
                runsheet.driver
              )}`
            }
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="paid_by_cash">{t("Cash")}:</label>
              <Input
                id="paid_by_cash"
                name="paid_by_cash"
                type="text"
                value={cash}
                placeholder={t("Cash Placeholder")}
                onChange={(e) => handleInputChange(e.target.value, setCash)}
                onBlur={(e) => {
                  setCash(formatDecimalValue(e.target.value, decimalPrecision));
                }}
              />
            </div>
            <div className="input-container">
              <label htmlFor="paid_by_bank">{t("Bank Transfer")}:</label>
              <Input
                id="paid_by_bank"
                name="paid_by_bank"
                type="text"
                value={bankTransfer}
                placeholder={t("Bank Transfer Placeholder")}
                onChange={(e) => handleInputChange(e.target.value, setBankTransfer)}
                onBlur={(e) => {
                  setBankTransfer(formatDecimalValue(e.target.value, decimalPrecision));
                }}
              />
            </div>
            <div className="input-container">
              <label htmlFor="notes">{t("Notes")}:</label>
              <Textarea
                name="notes"
                placeholder={t("Notes Placeholder")}
              />
            </div>
          </div>
          <br />
          <div className="mt-2">
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="flex gap-x-2">
                <span>{t("Total Amount:")}</span>
                <strong>{formatDecimalValue(codTotal, decimalPrecision)}</strong>
              </div>
              <div className="flex gap-x-2">
                <span>{t("Payment")}:</span>
                <strong>
                  {formatDecimalValue(parseFloat(bankTransfer || 0) + parseFloat(cash || 0), decimalPrecision)}
                </strong>
              </div>
              <div className="flex gap-x-2">
                <span>{t("Difference")}:</span>
                <strong>
                  {formatDecimalValue(
                    (parseFloat(bankTransfer || 0) +
                      parseFloat(cash || 0) -
                      codTotal), decimalPrecision
                  )}
                </strong>
              </div>
              {runsheet?.difference_shipments_count > 0 &&
                <div className="flex gap-x-2">
                  <span>{t("Difference Parcels")}:</span>
                  <strong>
                    {runsheet?.difference_shipments_count}
                  </strong>
                </div>}
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
              disabled={isLoading || !isPaymentValid || runsheet?.difference_shipments_count > 0}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("Confirm")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;