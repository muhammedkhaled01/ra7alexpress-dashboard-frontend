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
              <label htmlFor="role_name">{t("Role Name")} <RequiredField /></label>
              <Input
                id="role_name"
                placeholder={t("Enter role name")}
                name="role_name"
                type="text"
                aria-label={t("Role Name")}
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
              />
            </div>
          </div>
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

export default Create;
