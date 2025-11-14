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
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";

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

function Create({ onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([{ description: '' }]);
  const [formData, setFormData] = useState({
    name: '',
    category: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    category: '',
    items: ''
  });

  const { t } = useTranslation();

  const validateForm = () => {
    const newErrors = {
      name: formData.name.trim() ? '' : t('Checklist name is required'),
      category: formData.category ? '' : t('Category is required'),
      items: items.some(item => item.description.trim()) ? '' : t('At least one checklist item is required')
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

      // Prepare the data
      const data = {
        name: formData.name,
        category: formData.category,
        items: items.filter(item => item.description.trim() !== '')
      };

      const response = await axiosMerchant.post("compliance-checklists/store", data);
      
      if (response.data.success) {
        toast.success(response.data.message || t('Compliance Checklist created successfully'));
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
        handleDialogClose();
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { description: '' }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, description) => {
    const updatedItems = [...items];
    updatedItems[index] = { description };
    setItems(updatedItems);
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    // Reset form data
    setFormData({
      name: '',
      category: ''
    });
    setItems([{ description: '' }]);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog
      open={showDialog}
      onOpenChange={(open) => {
        if (open) {
          setShowDialog(true);
        } else {
          handleDialogClose();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{t("Create Compliance Checklist")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Create Compliance Checklist")}</DialogTitle>
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
                error={errors.name}
                placeholder={t("Enter checklist name...")} 
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
              <label>{t("Checklist Items")} <RequiredField /></label>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={item.description}
                      onChange={(e) => {
                        updateItem(index, e.target.value);
                        // Clear items error when any item changes
                        setErrors(prev => ({
                          ...prev,
                          items: ''
                        }));
                      }}
                      placeholder={t("Enter checklist item description...")}
                      error={errors.items}
                    />
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          removeItem(index);
                          // Clear items error when item is removed
                          setErrors(prev => ({
                            ...prev,
                            items: ''
                          }));
                        }}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {errors.items && (
                <p className="mt-1 text-sm text-red-500">{errors.items}</p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("Add Item")}
              </Button>
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
                t("Create")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Create; 