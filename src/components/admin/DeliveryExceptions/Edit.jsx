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
import { getDeliveryExceptions } from "@/stores/features/ajaxFeature";
import { useDispatch } from "react-redux";
import { handleError } from "@/utils/helpers";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import { useTranslation } from "react-i18next";

function Edit({ onSubmitSuccess, record, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectOptions, setSelectOptions] = useState([]);
  const [formData, setFormData] = useState({
    name: record.name,
    description: record.description,
    action: record.action,
    proof_required: Boolean(record.proof_required),
    move_to_crm: Boolean(record.move_to_crm)
  });
  const [errors, setErrors] = useState({
    name: '',
    description: '',
    action: ''
  });

  const dispatch = useDispatch();
  const { t } = useTranslation();

  const validateForm = () => {
    const newErrors = {
      name: formData.name ? '' : t('Name is required'),
      description: formData.description ? '' : t('Description is required'),
      action: formData.action ? '' : t('Action is required')
    };
    
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  useEffect(() => {
    // Fetch select options just like in Create
    axiosMerchant.get("setting_select_options").then((res) => {
      setSelectOptions(res.data.data);
      setActionValue(res.data?.data?.find((option) => option.value === record.action))
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      form.set("proof_required", formData.proof_required ? "1" : "0");
      form.set("move_to_crm", formData.move_to_crm ? "1" : "0");

      const response = await axiosMerchant.post("delivery_exceptions/update", form);
      toast.success(response.data.message);
      dispatch(getDeliveryExceptions());

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
  console.log(record,'record')
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("Update Delivery Exception")}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
          {/* ID hidden field to let your backend know which record to update */}
          <input type="hidden" name="id" value={record.id} />

          <div className="input-container">
            <label htmlFor="name">{t("Name")} <RequiredField /></label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={errors.name}
              placeholder={t("Enter name...")}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="input-container">
            <label htmlFor="description">{t("Description")} <RequiredField /></label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t("Enter description...")}
              error={errors.description}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="input-container">
            <label htmlFor="action">{t("Action")} <RequiredField /></label>
            <Select
              id="action"
              name="action"
              className="basic-multi-select"
              classNamePrefix="select"
              options={selectOptions.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
              value={selectOptions.find(opt => opt.value === formData.action)}
              onChange={(opt) => setFormData(prev => ({ ...prev, action: opt.value }))}
              error={errors.action}
            />
            {errors.action && (
              <p className="mt-1 text-sm text-red-500">{errors.action}</p>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Checkbox
              name="proof_required"
              id="proof_required"
              checked={formData.proof_required}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, proof_required: checked }))}
            />
            <label htmlFor="proof_required" className="text-sm font-medium">
              {t("Proof Required")}
            </label>
          </div>

          {/* Move to CRM Checkbox */}
          <div className="mt-2 flex items-center gap-2">
            <Checkbox
              name="move_to_crm"
              id="move_to_crm"
              checked={formData.move_to_crm}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, move_to_crm: checked }))}
            />
            <label htmlFor="move_to_crm" className="text-sm font-medium">
              {t("Move to CRM")}
            </label>
          </div>
          <div className="flex justify-end gap-x-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("Close")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                t("Save Changes")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog >
  );
}

export default Edit;
