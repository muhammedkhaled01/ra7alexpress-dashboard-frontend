import { useEffect, useState } from "react";

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
import { toast } from 'react-hot-toast';
import { Loader2, Plus } from "lucide-react";
import { getDeliveryExceptions } from "@/stores/features/ajaxFeature";
import { useDispatch } from "react-redux";
import { handleError } from "@/utils/helpers";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Select from "@/components/misc/Select"
import RequiredField from "@/components/misc/RequiredField";
import { useTranslation } from "react-i18next";

function Create({ onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectOptions, setSelectOptions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    action: '',
    proof_required: false,
    move_to_crm: false
  });
  const [errors, setErrors] = useState({
    name: '',
    description: '',
    action: ''
  });

  const dispatch = useDispatch()
  const { t } = useTranslation()

  const validateForm = () => {
    const newErrors = {
      name: formData.name ? '' : t('Name is required'),
      description: formData.description ? '' : t('Description is required'),
      action: formData.action ? '' : t('Action is required')
    };
    
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget)
      const response = await axiosMerchant.post("delivery_exceptions/store", form);
      toast.success(response.data.message);
      dispatch(getDeliveryExceptions())
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      setShowDialog(false);
      setFormData({
        name: '',
        description: '',
        action: '',
        proof_required: false,
        move_to_crm: false
      });
    } catch (error) {
      handleError(error)
      setShowDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    axiosMerchant.get("setting_select_options").then((res) => {
      setSelectOptions(res.data.data);
    });
  }, []);

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>{t("Create Delivery Exception")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("Create Delivery Exception")}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-y-4" onSubmit={handleSubmit}>
          <div className="input-container">
            <label htmlFor="name">{t("Name")} <RequiredField /></label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder={t("Enter Name...")}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={errors.name}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>
          <div className="input-container">
            <label htmlFor="name">{t("Description")} <RequiredField /></label>
            <Textarea
              name="description"
              value={formData.description}
              placeholder={t("Enter Description...")}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
              placeholder={t("Select Action...")}
              className="basic-multi-select"
              classNamePrefix="select"
              options={selectOptions?.map((option) => ({
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
          <div className="flex items-center gap-1">
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
          <div className="flex items-center gap-1">
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
    </Dialog>
  );
}

export default Create;