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
import { getEmployeeDepartments } from "@/stores/features/ajaxFeature";
import { handleError } from "@/utils/helpers";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { default as Select } from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";

function Create({ onSubmitSuccess, feature }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    title: '',
    department_id: ''
  });
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const departments = useSelector((store) => store.ajax.employeeDepartments);

  useEffect(() => {
    if (!departments) {
      dispatch(getEmployeeDepartments());
    }
  }, []);

  const validateForm = (form) => {
    const newErrors = {
      title: form.get('title') ? '' : t('Title is required'),
      department_id: form.get('department_id') ? '' : t('Department is required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!validateForm(form)) return;
    setIsLoading(true);
    try {
      const response = await axiosMerchant.post(
        `${feature.baseEndpoint}/store`,
        form
      );
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

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{feature.createTitle}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{feature.createTitle}</DialogTitle>
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
                error={errors.title}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="department_id">{t("Department")} <RequiredField /></label>
              <Select
                name="department_id"
                options={departments?.map((department) => ({
                  value: department.id,
                  label: department.name,
                }))}
                placeholder={t("Department")}
                className="basic-multi-select"
                classNamePrefix="select"
                error={errors.department_id}
              />
              {errors.department_id && (
                <p className="mt-1 text-sm text-red-500">{errors.department_id}</p>
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
