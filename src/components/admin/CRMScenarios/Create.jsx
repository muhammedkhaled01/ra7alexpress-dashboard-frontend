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
import Select from "@/components/misc/Select";
import { handleError } from "@/utils/helpers";
import { Loader2, Plus } from "lucide-react";
import RequiredField from "@/components/misc/RequiredField";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

function Create({ onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [],
    category: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const formPayload = new FormData();
      formPayload.append('title', formData.title);
      formPayload.append('description', formData.description);
      // Convert tags array into individual form data entries
      formData.tags.forEach((tag, index) => {
        formPayload.append('tags[]', tag);
      });
      formPayload.append('category', formData.category);

      const response = await axiosMerchant.post('scenarios', formPayload);
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

  const categories = [
    { value: '', label: t('Select Category') },
    { value: 'delivery', label: t('Delivery Issues') },
    { value: 'payment', label: t('Payment Issues') },
    { value: 'account', label: t('Account Issues') },
    { value: 'other', label: t('Other') }
  ];

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{t("Create Scenario")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("Create Scenario")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label className="block mb-2">{t("Enter Title")} <RequiredField /></label>
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
              <label className="block mb-2">{t("Description")} <RequiredField /></label>
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
              <label className="block mb-2">{t("Tags")} <RequiredField /></label>
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
              <label className="block mb-2">{t("Category")} <RequiredField /></label>
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
