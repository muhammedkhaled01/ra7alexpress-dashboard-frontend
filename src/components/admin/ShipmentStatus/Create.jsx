import React, { useState } from "react";

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
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { getStatuses } from "@/stores/features/ajaxFeature";
import { useDispatch } from "react-redux";
import { Textarea } from "@/components/ui/textarea";
import RequiredField from "@/components/misc/RequiredField";

function Create({ onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    description: ''
  });
  const [errors, setErrors] = useState({
    label: '',
    description: ''
  });
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const validateForm = () => {
    const newErrors = {
      label: formData.label ? '' : t('Name is required'),
      description: formData.description ? '' : t('Description is required')
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
      const response = await axiosMerchant.post("statuses/store", form);
      toast.success(response.data.message);
      await dispatch(getStatuses());
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
          <span>{t("Create Status")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("Create Status")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="label" className="block mb-2">{t("Name")} <RequiredField /></label>
              <Input
                id="label"
                name="label"
                type="text"
                value={formData.label}
                placeholder={t("Enter label...")}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                error={errors.label}
              />
              {errors.label && (
                <p className="mt-1 text-sm text-red-500">{errors.label}</p>
              )}
            </div>

            <div className="input-container">
              <label htmlFor="description" className="block mb-2">{t("Description")} <RequiredField /></label>
              <Textarea
                id="description"
                placeholder={t("Enter description...")}
                name="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                error={errors.description}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
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
                t("Save")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Create;
