import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { formatCurrentCurrency, handleError } from "@/utils/helpers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useLanguage } from "@/contexts/LanguageProvider";

const Create = ({ onSubmitSuccess }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();
  const { currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting)
  const { language } = useLanguage();

  const [warehouseOpts, setWarehouseOpts] = useState([]); // [{value:'first_warehouse',label:'First warehouse'}, ...]
  const [warehouse, setWarehouse] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosMerchant.get("/transfer-fees/options");
        // Expecting: { data: { warehouses: [{value,label}, ...] } }
        setWarehouseOpts(data?.data?.warehouses ?? [
          { value: "first_warehouse", label: t("First warehouse") },
          { value: "other_warehouse", label: t("Other warehouse") },
        ]);
      } catch (e) {
        // Fallback to hardcoded options if /options fails
        setWarehouseOpts([
          { value: "first_warehouse", label: t("First warehouse") },
          { value: "other_warehouse", label: t("Other warehouse") },
        ]);
      }
    })();
  }, []);

  const resetForm = () => {
    setWarehouse("");
    setAmount("");
  };

  const onSave = async () => {
    if (!warehouse || amount === "") {
      toast.error(t("Please select a warehouse and enter the amount."));
      return;
    }
    setSaving(true);
    try {
      await axiosMerchant.post("/transfer-fees/store", {
        warehouse,
        amount: Number(amount),
      });
      toast.success(t("Transfer fee created successfully."));
      onSubmitSuccess?.();
      resetForm();
      setOpen(false);
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          {t("Add Transfer Fee")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("Add Transfer Fee")}</DialogTitle>
        </DialogHeader>

        {/* Warehouse */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("Warehouse")} <span className="text-red-500">*</span></label>
          <Select value={warehouse} onValueChange={setWarehouse}>
            <SelectTrigger>
              <SelectValue placeholder={t("Select warehouse...")} />
            </SelectTrigger>
            <SelectContent>
              {warehouseOpts.map((w) => (
                <SelectItem key={w.value} value={w.value}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("Fee")} ({formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)}) <span className="text-red-500">*</span></label>
          <Input
            type="number"
            step="0.001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.000"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="secondary" disabled={saving}>{t("Close")}</Button>
          </DialogClose>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {t("Save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

Create.propTypes = { onSubmitSuccess: PropTypes.func };
export default Create;
