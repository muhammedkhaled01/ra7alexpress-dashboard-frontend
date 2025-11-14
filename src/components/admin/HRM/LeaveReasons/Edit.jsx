import { useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import axiosMerchant from "@/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import RequiredField from "@/components/misc/RequiredField";
import { Textarea } from "@/components/ui/textarea";
import { handleError } from "@/utils/helpers";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

function Edit({ onSubmitSuccess, record, onClose, feature }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    name_en: '',
    name_ar: ''
  });
  const [isActive, setIsActive] = useState(record.is_active === 1);
  const { t } = useTranslation();

  const validateForm = (form) => {
    const newErrors = {
      name_en: form.get('name_en') ? '' : t('Name(EN) is required'),
      name_ar: form.get('name_ar') ? '' : t('Name(AR) is required'),
      // is_active: form.get('is_active') ? '' : t('Active Status is required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set('is_active', isActive ? 1 : 0);
    if (!validateForm(formData)) return;
    setIsLoading(true);
    try {
      const response = await axiosMerchant.post(
        `${feature.baseEndpoint}/update`,
        formData
      );
      toast.success(response.data.message);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      handleError(error);
      console.error("Failed to submit data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader id="no-print">
          <DialogTitle>{feature.editTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="name_en">{t("Name(EN)")} <RequiredField /></label>
              <Input
                id="name_en"
                name="name_en"
                type="text"
                aria-label={t("Name(EN)")}
                placeholder={t("Enter name in English")}
                defaultValue={record.name_en}
                error={errors.name_en}
              />
              {errors.name_en && (
                <p className="mt-1 text-sm text-red-500">{errors.name_en}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="name_ar">{t("Name(AR)")} <RequiredField /></label>
              <Input
                id="name_ar"
                name="name_ar"
                type="text"
                aria-label={t("Name(AR)")}
                placeholder={t("Enter name in Arabic")}
                defaultValue={record.name_ar}
                error={errors.name_ar}
              />
              {errors.name_ar && (
                <p className="mt-1 text-sm text-red-500">{errors.name_ar}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="description">{t("Description")}</label>
              <Textarea
                id="description"
                name="description"
                type="text"
                aria-label={t("Description")}
                placeholder={t("Enter description")}
                defaultValue={record.description}
              />
            </div>
            <div className="input-container">
              <label htmlFor="is_active">{t("Is Active")}</label>
              <Switch
                id="is_active"
                name="is_active"
                aria-label={t("Is Active")}
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          <input type="hidden" name="id" value={record.id} />
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

export default Edit;
