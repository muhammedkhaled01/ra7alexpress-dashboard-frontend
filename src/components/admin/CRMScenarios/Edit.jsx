import { useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import axiosMerchant from "@/axios";
import Select from "@/components/misc/Select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { handleError } from "@/utils/helpers";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

function Edit({ onSubmitSuccess, record, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    title: record.title || '',
    description: record.description || '',
    tags: record.tags || [],
    category: record.category || ''
  });
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    tags: '',
    category: ''
  });

  const validateForm = () => {
    const newErrors = {
      title: formData.title ? '' : t('Title is required'),
      description: formData.description ? '' : t('Description is required'),
      category: formData.category ? '' : t('Category is required'),
      tags: formData.tags.length > 0 ? '' : t('Tags are required')
    };

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Create a plain object to send the data
      const updateData = {
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        category: formData.category
      };

      const response = await axiosMerchant.put(`scenarios/${record.id}`, updateData);
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

  const categories = [
    { value: '', label: t('Select Category') },
    { value: 'delivery', label: t('Delivery Issues') },
    { value: 'payment', label: t('Payment Issues') },
    { value: 'account', label: t('Account Issues') },
    { value: 'other', label: t('Other') }
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader id="no-print">
          <DialogTitle>{t("Update Scenario")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label className="block mb-2">{t("Enter Title")}</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                error={errors.title}
                placeholder={t("Enter scenario title")}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>
            <div className="input-container">
              <label className="block mb-2">{t("Description")}</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                error={errors.description}
                placeholder={t("Describe the scenario in detail")}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>
            <div className="input-container">
              <label className="block mb-2">{t("Tags")}</label>
              <Input
                value={formData.tags.join(',')}
                onChange={(e) => {
                  const newTags = e.target.value.split(',').map(tag => tag.trim());
                  setFormData(prev => ({ ...prev, tags: newTags }));
                }}
                placeholder={t("Enter relevant tags (e.g., urgent, high-priority, customer-service)")}
                error={errors.tags}
              />
              {errors.tags && (
                <p className="mt-1 text-sm text-red-500">{errors.tags}</p>
              )}
            </div>
            <div className="input-container">
              <label className="block mb-2">{t("Category")}</label>
              <Select
                options={categories.map(cat => ({
                  value: cat.value,
                  label: cat.label
                }))}
                value={categories.find(cat => cat.value === formData.category)}
                onChange={(opt) => {
                  setFormData(prev => ({ ...prev, category: opt.value }));
                }}
                error={errors.category}
              />
              {errors.category && (
                <p className="mt-1 text-sm text-red-500">{errors.category}</p>
              )}
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
