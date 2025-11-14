import React, { useEffect, useState } from "react";
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
import RequiredField from "@/components/misc/RequiredField";

Edit.propTypes = {
  onSubmitSuccess: PropTypes.func,
  record: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};

function Edit({ onSubmitSuccess, record, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: ''
  });

  const { t } = useTranslation();

  const validateForm = (formData) => {
    const name = formData.get('name');
    const newErrors = {
      name: name ? '' : t('Name is required')
    };

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Get form data and validate
    const formData = new FormData(event.currentTarget);
    if (!validateForm(formData)) return;

    setIsLoading(true);

    try {
      const response = await axiosMerchant.post("shelf-categories/update", formData);
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
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("Update Shelf Category")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="name">{t("Name")} <RequiredField /></label>
              <Input
                id="name"
                name="name"
                type="text"
                defaultValue={record.name}
                error={errors.name}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
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
