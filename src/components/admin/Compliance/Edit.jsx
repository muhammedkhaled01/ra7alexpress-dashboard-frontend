import React, { useEffect, useState } from "react";

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
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import { handleError } from "@/utils/helpers";

// Category options
const categories = [
  { value: 'Vehicle Safety', label: 'Vehicle Safety' },
  { value: 'Warehouse Safety', label: 'Warehouse Safety' },
  { value: 'Equipment Safety', label: 'Equipment Safety' },
  { value: 'Personal Safety', label: 'Personal Safety' },
  { value: 'Fire Safety', label: 'Fire Safety' },
  { value: 'Health & Safety', label: 'Health & Safety' },
  { value: 'Environmental Safety', label: 'Environmental Safety' },
  { value: 'Quality Control', label: 'Quality Control' },
];

function Edit({ record, onSubmitSuccess, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    status: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    category: '',
    status: ''
  });

  const { t } = useTranslation();

  useEffect(() => {
    if (record) {
      setFormData({
        name: record.name || '',
        category: record.category || '',
        status: record.status || ''
      });
    }
  }, [record]);

  const validateForm = () => {
    const newErrors = {
      name: formData.name.trim() ? '' : t('Checklist name is required'),
      category: formData.category ? '' : t('Category is required'),
      status: formData.status ? '' : t('Status is required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form before submission
      if (!validateForm()) {
        setIsLoading(false);
        return;
      }

      const data = {
        id: record.id,
        name: formData.name,
        category: formData.category,
        status: formData.status
      };

      const response = await axiosMerchant.post("compliance-checklists/update", data);
      
      if (response.data.success) {
        toast.success(response.data.message || t('Compliance Checklist updated successfully'));
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
        onClose();
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("Edit Compliance Checklist")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="name">{t("Checklist Name")} <RequiredField /></label>
              <Input 
                id="name" 
                name="name" 
                type="text" 
                value={formData.name}
                onChange={(e) => {
                  handleInputChange('name', e.target.value);
                  setErrors(prev => ({
                    ...prev,
                    name: ''
                  }));
                }}
                placeholder={t("Enter checklist name...")} 
                error={errors.name}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="input-container">
              <label htmlFor="category">{t("Category")} <RequiredField /></label>
              <Select
                name="category"
                value={categories.find(cat => cat.value === formData.category)}
                onChange={(option) => {
                  handleInputChange('category', option?.value || '');
                  setErrors(prev => ({
                    ...prev,
                    category: ''
                  }));
                }}
                options={categories}
                className="basic-multi-select"
                classNamePrefix="select"
                placeholder={t("Select Category")}
                aria-label={t("Category")}
                error={errors.category}
              />
              {errors.category && (
                <p className="mt-1 text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            <div className="input-container">
              <label htmlFor="status">{t("Status")} <RequiredField /></label>
              <Select
                name="status"
                value={[{ value: 'Compliant', label: t('Compliant') }, { value: 'Non-Compliant', label: t('Non-Compliant') }].find(status => status.value === formData.status)}
                onChange={(option) => {
                  handleInputChange('status', option?.value || '');
                  setErrors(prev => ({
                    ...prev,
                    status: ''
                  }));
                }}
                options={[{ value: 'Compliant', label: t('Compliant') }, { value: 'Non-Compliant', label: t('Non-Compliant') }]}
                className="basic-multi-select"
                classNamePrefix="select"
                placeholder={t("Select Status")}
                aria-label={t("Status")}
                error={errors.status}
              />
              {errors.status && (
                <p className="mt-1 text-sm text-red-500">{errors.status}</p>
              )}
            </div>

            <div className="input-container">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>{t("Note")}:</strong> {t("To manage checklist items and mark them as complete, use the 'View Items' action from the checklist list.")}
                </p>
              </div>
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
                t("Update")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Edit; 