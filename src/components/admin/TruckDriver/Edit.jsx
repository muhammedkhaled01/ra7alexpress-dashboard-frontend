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
import { handleError } from "@/utils/helpers";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import PhoneInput from '@/components/misc/PhoneInput';
function Edit({ onSubmitSuccess, record, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: record?.user.name,
    email: record?.user.email,
    phone_number: String(record?.country_code ?? "") + String(record?.phone_number ?? ""),
    id_card_number: record?.id_card_number,
    company: record?.company,
    status: record?.status
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone_number: '',
    id_card_number: '',
    company: '',
    status: ''
  });
  const { t } = useTranslation();

  const statusOptions = [
    { value: 'active', label: t('Active') },
    { value: 'inactive', label: t('Inactive') }
  ];

  const validateForm = () => {
    const newErrors = {
      name: formData.name ? '' : t('Name is required'),
      email: formData.email ? '' : t('Email is required'),
      phone_number: formData.phone_number ? '' : t('Phone Number is required'),
      id_card_number: formData.id_card_number ? '' : t('ID Card Number is required'),
      company: formData.company ? '' : t('Company is required'),
      status: formData.status ? '' : t('Status is required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when input changes
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Validate form before submission
    const isValid = validateForm();
    if (!isValid) return;
    setIsLoading(true);
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value);
      });
      form.append('id', record?.id);
      form.append("phone_number", formData.phone_number);
      const response = await axiosMerchant.post(`truck_drivers/update`, form);
      toast.success(response.data.message);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("Edit Truck Driver")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="name">{t("Name")} <RequiredField /></label>
              <Input
                value={formData.name}
                onChange={handleChange}
                id="name"
                name="name"
                type="text"
                aria-label={t("Name")}
                placeholder={t("Enter name...")}
                error={errors.name}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="email">{t("Email")} </label>
              <Input
                value={formData.email}
                onChange={handleChange}
                id="email"
                name="email"
                type="email"
                aria-label={t("Email")}
                placeholder={t("Enter email...")}
                error={errors.email}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="phone_number">{t("Phone Number")} <RequiredField /></label>
              <PhoneInput
                country={'eg'}
                value={formData.phone_number}
                onChange={(phone) => setFormData(prev => ({ ...prev, phone_number: phone }))}
                enableSearch={true}
                inputClass="!bg-background !text-foreground"
                buttonClass="!bg-muted"
              />
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-500">{errors.phone_number}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="id_card_number">{t("ID Card Number")} <RequiredField /></label>
              <Input
                value={formData.id_card_number}
                onChange={handleChange}
                id="id_card_number"
                name="id_card_number"
                type="text"
                aria-label={t("ID Card Number")}
                placeholder={t("Enter ID card number...")}
                error={errors.id_card_number}
              />
              {errors.id_card_number && (
                <p className="mt-1 text-sm text-red-500">{errors.id_card_number}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="company">{t("Company")} <RequiredField /></label>
              <Input
                value={formData.company}
                onChange={handleChange}
                id="company"
                name="company"
                type="text"
                aria-label={t("Company")}
                placeholder={t("Enter company...")}
                error={errors.company}
              />
              {errors.company && (
                <p className="mt-1 text-sm text-red-500">{errors.company}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="status">{t("Status")} <RequiredField /></label>
              <Select
                options={statusOptions}
                name="status"
                placeholder={t("Select status...")}
                isClearable={false}
                value={statusOptions.find(status => status.value === formData.status)}
                onChange={(selectedOption) => {
                  setFormData(prev => ({
                    ...prev,
                    status: selectedOption.value
                  }));
                  setErrors(prev => ({
                    ...prev,
                    status: ''
                  }));
                }}
                error={errors.status}
              />
              {errors.status && (
                <p className="mt-1 text-sm text-red-500">{errors.status}</p>
              )}
            </div>
          </div>
          <input type="hidden" name="id" value={record?.id} />
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
