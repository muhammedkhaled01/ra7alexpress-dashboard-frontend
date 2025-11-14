import axiosMerchant from "@/axios";
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
import RequiredField from "@/components/misc/RequiredField";
import { handleError } from "@/utils/helpers";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

function Create({ onSubmitSuccess, feature }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    name_en: '',
    name_ar: ''
  });
  const { t } = useTranslation();

  const validateForm = (form) => {
    const newErrors = {
      name_en: form.get('name_en') ? '' : t('Name(EN) is required'),
      name_ar: form.get('name_ar') ? '' : t('Name(AR) is required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!validateForm(form)) return;
    setIsLoading(true);
    try {
      const response = await axiosMerchant.post(
        `${feature.baseEndpoint}/store`,
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

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{feature.createTitle}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{feature.createTitle}</DialogTitle>
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
