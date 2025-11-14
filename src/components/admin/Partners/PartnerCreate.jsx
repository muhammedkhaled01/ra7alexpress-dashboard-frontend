import { useState } from "react";
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
import RequiredField from "@/components/misc/RequiredField";
import { useTranslation } from "react-i18next";
import Select from "@/components/misc/Select";
import { Checkbox } from "@/components/ui/checkbox";

function Create({ onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    allowed_scopes: [],
    is_active: true,
    rate_limit: {
      requests_per_minute: '',
      requests_per_hour: '',
    }
  });
  const [errors, setErrors] = useState({
    name: '',
    contact_email: '',
  });

  const { t } = useTranslation();

  // Available scopes based on the seeder
  const scopeOptions = [
    { value: 'read:shipments', label: 'read:shipments' },
    { value: 'write:shipments', label: 'write:shipments' },
    { value: 'read:tracking', label: 'read:tracking' },
    { value: 'manage:webhooks', label: 'manage:webhooks' },
  ];

  const validateForm = () => {
    const newErrors = {
      name: formData.name ? '' : t('Name is required'),
      contact_email: formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email) 
        ? t('Invalid email address') 
        : '',
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const payload = {
        name: formData.name,
        contact_email: formData.contact_email || null,
        allowed_scopes: formData.allowed_scopes.length > 0 ? formData.allowed_scopes : null,
        is_active: formData.is_active,
        rate_limit: (formData.rate_limit.requests_per_minute || formData.rate_limit.requests_per_hour) 
          ? {
              requests_per_minute: formData.rate_limit.requests_per_minute ? parseInt(formData.rate_limit.requests_per_minute) : null,
              requests_per_hour: formData.rate_limit.requests_per_hour ? parseInt(formData.rate_limit.requests_per_hour) : null,
            }
          : null,
      };

      const response = await axiosMerchant.post("partners/store", payload);
      toast.success(response.data.message);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      setShowDialog(false);
      // Reset form
      setFormData({
        name: '',
        contact_email: '',
        allowed_scopes: [],
        is_active: true,
        rate_limit: {
          requests_per_minute: '',
          requests_per_hour: '',
        }
      });
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
        <Button
          type="button"
          className="flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>{t("Create Partner")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("Create Partner")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="name">{t("Name")} <RequiredField /></label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t("Enter Name...")}
                error={errors.name}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="input-container">
              <label htmlFor="contact_email">{t("Contact Email")}</label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder={t("Enter Contact Email...")}
                error={errors.contact_email}
              />
              {errors.contact_email && (
                <p className="mt-1 text-sm text-red-500">{errors.contact_email}</p>
              )}
            </div>

            <div className="input-container">
              <label htmlFor="allowed_scopes">{t("Allowed Scopes")}</label>
              <Select
                isMulti
                value={scopeOptions.filter(option => formData.allowed_scopes.includes(option.value))}
                onChange={(selectedOptions) => {
                  setFormData(prev => ({
                    ...prev,
                    allowed_scopes: selectedOptions ? selectedOptions.map(opt => opt.value) : []
                  }));
                }}
                options={scopeOptions}
                placeholder={t("Select Allowed Scopes...")}
                isSearchable={true}
              />
            </div>

            <div className="mt-2">
              <Checkbox 
                id="is_active" 
                checked={formData.is_active}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({ ...prev, is_active: checked }));
                }}
              />
              <label htmlFor="is_active" className="text-sm font-medium ml-2">
                {t("Active")}
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="input-container">
                <label htmlFor="requests_per_minute">{t("Requests Per Minute")}</label>
                <Input
                  id="requests_per_minute"
                  name="requests_per_minute"
                  type="number"
                  min="0"
                  value={formData.rate_limit.requests_per_minute}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    rate_limit: {
                      ...prev.rate_limit,
                      requests_per_minute: e.target.value
                    }
                  }))}
                  placeholder={t("Enter requests per minute...")}
                />
              </div>

              <div className="input-container">
                <label htmlFor="requests_per_hour">{t("Requests Per Hour")}</label>
                <Input
                  id="requests_per_hour"
                  name="requests_per_hour"
                  type="number"
                  min="0"
                  value={formData.rate_limit.requests_per_hour}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    rate_limit: {
                      ...prev.rate_limit,
                      requests_per_hour: e.target.value
                    }
                  }))}
                  placeholder={t("Enter requests per hour...")}
                />
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

