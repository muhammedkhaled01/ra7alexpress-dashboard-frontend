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
import { Loader2, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import { getCountries } from "@/stores/features/ajaxFeature";

function Create({ onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const countries = useSelector((store) => store.ajax.countries);
  const [formData, setFormData] = useState({
    en_name: '',
    ar_name: '',
    country_id: countries?.find((country) => country.name === "Egypt")?.id || ''
  });
  const [errors, setErrors] = useState({
    en_name: '',
    ar_name: '',
    country_id: ''
  });
  const dispatch = useDispatch();
  const { t } = useTranslation();


  useEffect(() => {
    if (!countries) {
      dispatch(getCountries());
    }
  }, [countries, dispatch]);

  const validateForm = () => {
    const newErrors = {
      en_name: formData.en_name ? '' : t('English name is required'),
      ar_name: formData.ar_name ? '' : t('Arabic name is required'),
      country_id: formData.country_id ? '' : t('Country is required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      form.append("en_name", formData.en_name);
      form.append("ar_name", formData.ar_name);
      form.append("country_id", formData.country_id);

      const response = await axiosMerchant.post("governorates/store", form);
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

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{t("Governorate.create")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("Governorate.create")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="en_name">{t("englishName")} <RequiredField /></label>
              <Input
                value={formData.en_name}
                onChange={(e) => setFormData(prev => ({ ...prev, en_name: e.target.value }))}
                type="text"
                aria-label={t("englishName")}
                placeholder={t("Enter English name...")}
                error={errors.en_name}
              />
              {errors.en_name && (
                <p className="mt-1 text-sm text-red-500">{errors.en_name}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="ar_name">{t("arabicName")} <RequiredField /></label>
              <Input
                value={formData.ar_name}
                onChange={(e) => setFormData(prev => ({ ...prev, ar_name: e.target.value }))}
                type="text"
                aria-label={t("arabicName")}
                placeholder={t("Enter Arabic name...")}
                error={errors.ar_name}
              />
              {errors.ar_name && (
                <p className="mt-1 text-sm text-red-500">{errors.ar_name}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="country_id">{t("Country")} <RequiredField /></label>
              <Select
                name="country_id"
                options={countries?.map((country) => ({
                  value: country.id,
                  label: country.name,
                }))}
                defaultValue={{
                  value: formData.country_id,
                  label: countries?.find(country => country.id === formData.country_id)?.name || t("Select a Country")
                }}
                onChange={(selected) => setFormData(prev => ({ ...prev, country_id: selected?.value || '' }))}
                className="basic-multi-select"
                classNamePrefix="select"
                placeholder={t("Select a Country")}
                aria-label={t("Country")}
              />
              {errors.country_id && (
                <p className="mt-1 text-sm text-red-500">{errors.country_id}</p>
              )}
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
