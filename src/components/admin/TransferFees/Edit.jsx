import React, { useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrentCurrency, handleError } from "@/utils/helpers";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useLanguage } from "@/contexts/LanguageProvider";

const labelForWarehouse = (w) => {
  if (w === "first_warehouse") return "First warehouse";
  if (w === "other_warehouse") return "Other warehouse";
  return w ?? "-";
};

function Edit({ onSubmitSuccess, record, onClose }) {
  const { t } = useTranslation();
  const { currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting)
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState(record.amount ?? 0);
  const [amountErr, setAmountErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amount === "" || Number.isNaN(Number(amount))) {
      setAmountErr(t("Amount is required"));
      return;
    }
    setAmountErr("");
    setIsLoading(true);
    try {
      await axiosMerchant.post("/transfer-fees/update", { id: record.id, amount: Number(amount) });
      toast.success(t("Updated successfully"));
      onSubmitSuccess?.();
      onClose();
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader><DialogTitle>{t("Edit Transfer Fee")}</DialogTitle></DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mt-2">
            <div>
              <label className="mb-1">{t("Warehouse")}</label>
              <div className="px-3 py-2 bg-muted rounded-md">{labelForWarehouse(record.warehouse)}</div>
            </div>

            <div className="input-container">
              <label htmlFor="amount">{t(`Fee`)} ({formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)}) <span className="text-red-500">*</span></label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {amountErr && <p className="mt-1 text-sm text-red-600">{amountErr}</p>}
            </div>
          </div>

          <input type="hidden" name="id" value={record.id} />
          <div className="flex justify-end gap-2 mt-4">
            <DialogClose asChild><Button variant="secondary">{t("Close")}</Button></DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Save Changes")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

Edit.propTypes = {
  onSubmitSuccess: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  record: PropTypes.shape({
    id: PropTypes.number.isRequired,
    amount: PropTypes.number.isRequired,
    warehouse: PropTypes.string, // now a simple string key
  }).isRequired,
};

export default Edit;
