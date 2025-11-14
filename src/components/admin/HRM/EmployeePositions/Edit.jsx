import { useState } from "react";
import PropTypes from 'prop-types';

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
import { useSelector } from "react-redux";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";

function Edit({ onSubmitSuccess, record, onClose, feature }) {
  Edit.propTypes = {
    onSubmitSuccess: PropTypes.func,
    record: PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      department_id: PropTypes.number.isRequired
    }).isRequired,
    onClose: PropTypes.func.isRequired,
    feature: PropTypes.shape({
      baseEndpoint: PropTypes.string.isRequired,
      editTitle: PropTypes.string.isRequired
    }).isRequired
  };
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    title: '',
    // department_id: ''
  });
  const { t } = useTranslation();
  const departments = useSelector((store) => store.ajax.employeeDepartments);

  const validateForm = (form) => {
    const newErrors = {
      title: form.get('title') ? '' : t('Title is required'),
      // department_id: form.get('department_id') ? '' : t('Department is required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!validateForm(form)) return;
    setIsLoading(true);

    try {
      const response = await axiosMerchant.post(
        `${feature.baseEndpoint}/update`,
        form
      );
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader id="no-print">
          <DialogTitle>{feature.editTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="title">{t("Title")} <RequiredField /></label>
              <Input
                id="title"
                name="title"
                placeholder={t("Title")}
                type="text"
                aria-label={t("Title")}
                defaultValue={record.title}
                error={errors.title}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>
            {/* <div className="input-container">
              <label htmlFor="department_id">{t("Department")}</label>
              <Select
                name="department_id"
                options={departments?.map((department) => ({
                  value: department.id,
                  label: department.name,
                }))}
                placeholder={t("Department")}
                className="basic-multi-select"
                classNamePrefix="select"
                defaultValue={record.department_id}
                error={errors.department_id}
              />
              {errors.department_id && (
                <p className="mt-1 text-sm text-red-500">{errors.department_id}</p>
              )}
            </div> */}
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
