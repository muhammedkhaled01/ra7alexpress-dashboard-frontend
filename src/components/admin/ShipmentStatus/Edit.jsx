import React, { useState } from "react";
import PropTypes from 'prop-types';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { handleError } from "@/utils/helpers";
import { getStatuses } from "@/stores/features/ajaxFeature";
import { useDispatch } from "react-redux";
import { Textarea } from "@/components/ui/textarea";
import RequiredField from "@/components/misc/RequiredField";

function Edit({ onSubmitSuccess, record, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: record.label || '',
    description: record.description || ''
  });
  const [errors, setErrors] = useState({
    label: '',
    description: ''
  });
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const validateForm = () => {
    const newErrors = {
      label: formData.label ? '' : t('Name is required'),
      description: formData.description ? '' : t('Description is required')
    };

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);

      formData.append("id", record.id);

      const response = await axiosMerchant.post("statuses/update", formData);
      toast.success(response.data.message);
      await dispatch(getStatuses());
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
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[500px]">
        <DialogHeader id="no-print">
          <DialogTitle>{t("Update Status")}</DialogTitle>
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
                name="description"
                value={formData.description}
                placeholder={t("Enter description...")}
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

Edit.propTypes = {
  onSubmitSuccess: PropTypes.func,
  record: PropTypes.shape({
    id: PropTypes.number.isRequired,
    label: PropTypes.string,
    description: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

export default Edit;
