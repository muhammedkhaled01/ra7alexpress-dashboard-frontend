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
import { Textarea } from "@/components/ui/textarea";
import RequiredField from "@/components/misc/RequiredField";
import { handleError } from "@/utils/helpers";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

function Edit({ onSubmitSuccess, record, onClose, feature }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    role_name: '',
    level: ''
  });
  const { t } = useTranslation();

  const validateForm = (form) => {
    const newErrors = {
      role_name: form.get('role_name') ? '' : t('Role Name is required'),
      level: form.get('level') ? '' : t('Level Num is required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
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
              <label htmlFor="role_name">{t("Role Name")} <RequiredField /></label>
              <Input
                id="role_name"
                placeholder={t("Enter role name")}
                name="role_name"
                type="text"
                aria-label={t("Role Name")}
                defaultValue={record.role_name}
                error={errors.role_name}
              />
              {errors.role_name && (
                <p className="mt-1 text-sm text-red-500">{errors.role_name}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="level">{t("Level Num")} <RequiredField /></label>
              <Input
                id="level"
                placeholder={t("Enter level number")}
                name="level"
                type="number"
                aria-label={t("Level Num")}
                defaultValue={record.level}
                error={errors.level}
              />
              {errors.level && (
                <p className="mt-1 text-sm text-red-500">{errors.level}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="description">{t("Description")}</label>
              <Textarea
                id="description"
                placeholder={t("Enter description")}
                name="description"
                type="text"
                aria-label={t("Description")}
                defaultValue={record.description}
              />
            </div>
          </div>
          <input type="hidden" name="id" value={record.id} />
          <div className="flex justify-end gap-x-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {/* Close button translation already handled by t('Close') */}
                {t("Close")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {/* Save Changes translation already handled by t('Save Changes') */}
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
