import axiosMerchant from "@/axios";
import { default as Select } from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMerchants, getDrivers } from "@/stores/features/ajaxFeature";
import { driverName, handleError } from "@/utils/helpers";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

function Create({ onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    driver_id: '',
    merchant_id: '',
    no_of_shipments: '',
    note: ''
  });
  const [errors, setErrors] = useState({
    driver_id: '',
    merchant_id: '',
    no_of_shipments: ''
  });
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const merchants = useSelector((store) => store.ajax.merchants);
  const drivers = useSelector((store) => store.ajax.drivers);
  useEffect(() => {
    if (!merchants) dispatch(getMerchants());
    if (!drivers) {
      dispatch(getDrivers());
    }
  }, []);

  const validateForm = () => {
    const newErrors = {
      driver_id: formData.driver_id ? '' : t('Driver is required'),
      merchant_id: formData.merchant_id ? '' : t('Merchant is required'),
      no_of_shipments: formData.no_of_shipments ? '' : t('Number of shipments is required')
    };

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const form = new FormData();
      form.append('driver_id', formData.driver_id);
      form.append('merchant_id', formData.merchant_id);
      form.append('no_of_shipments', formData.no_of_shipments);
      form.append('note', formData.note);

      const response = await axiosMerchant.post("pickup_tasks/store", form);
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

  const setComplaintValue = (value) => {
    _setComplaintValue(value);
  };
  const setCrmAgentValue = (value) => {
    _setCrmAgentValue(value);
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{t("Create Pickup Task")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("Create Pickup Task")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="mt-2 input-container">
              <label htmlFor="merchant_id">{t("Merchant")} <RequiredField /></label>
              <Select
                name="merchant_id"
                placeholder={t("Merchant")}
                options={merchants?.map((merchant) => ({
                  value: merchant.id,
                  label: merchant.name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={{ value: formData.merchant_id, label: merchants?.find(merchant => merchant.id === formData.merchant_id)?.name || '' }}
                onChange={(selected) => setFormData(prev => ({ ...prev, merchant_id: selected?.value }))}
                error={errors.merchant_id}
              />
              {errors.merchant_id && (
                <p className="mt-1 text-sm text-red-500">{errors.merchant_id}</p>
              )}
            </div>
            <div className="w-full input-container">
              <label htmlFor="driver_id">{t("Driver")} <RequiredField /></label>
              <Select
                name="driver_id"
                placeholder={t("Driver")}
                options={drivers?.map((driver) => ({
                  value: driver.id,
                  label: driverName(driver),
                }))}
                className="w-full"
                value={{ value: formData.driver_id, label: drivers?.find(driver => driver.id === formData.driver_id)?.name || '' }}
                error={!!errors.driver_id}
                onChange={(selected) => setFormData(prev => ({ ...prev, driver_id: selected?.value }))}
              />
              {errors.driver_id && (
                <p className="mt-1 text-sm text-red-500">{errors.driver_id}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="no_of_shipments">{t("No Of Shipments")} <RequiredField /></label>
              <Input
                id="no_of_shipments"
                name="no_of_shipments"
                type="number"
                min="1"
                value={formData.no_of_shipments}
                onChange={(e) => setFormData(prev => ({ ...prev, no_of_shipments: e.target.value }))}
                error={errors.no_of_shipments}
              />
              {errors.no_of_shipments && (
                <p className="mt-1 text-sm text-red-500">{errors.no_of_shipments}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="note">{t("Note")}</label>
              <Textarea
                id="note"
                name="note"
                type="text"
                aria-label={t("Task Note")}
                placeholder={t("Task Note")}
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-x-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("Close")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("Save Changes")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Create;
