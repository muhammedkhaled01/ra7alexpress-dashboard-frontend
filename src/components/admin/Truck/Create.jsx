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
import { getTrucks, getTruckDrivers } from "@/stores/features/ajaxFeature";
import { handleError } from "@/utils/helpers";
import { Loader2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";

function Create({ onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    number_plate: '',
    color: '',
    company: '',
    type: 'truck',
    // truck_driver_id: '',
    status: 'active',
    notes: ''
  });
  const [errors, setErrors] = useState({
    number_plate: '',
    color: '',
    company: '',
    type: '',
    // truck_driver_id: '',
    status: '',
    notes: ''
  });

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const truck_drivers = useSelector(state => state.ajax.truck_drivers);

  const truckTypes = [
    { value: 'truck', label: t('Truck') },
    { value: 'van', label: t('Van') },
    { value: 'mini_van', label: t('Mini Van') },
    { value: 'pickup', label: t('Pickup') }
  ];

  const statusOptions = [
    { value: 'active', label: t('Active') },
    { value: 'inactive', label: t('Inactive') },
    { value: 'maintenance', label: t('Maintenance') }
  ];

  useEffect(() => {
    if (showDialog && !truck_drivers) {
      dispatch(getTruckDrivers());
    }
  }, [showDialog, truck_drivers]);

  const validateForm = () => {
    const newErrors = {
      number_plate: formData.number_plate ? '' : t('Number Plate is required'),
      color: formData.color ? '' : t('Color is required'),
      company: formData.company ? '' : t('Company is required'),
      type: formData.type ? '' : t('Type is required'),
      // truck_driver_id: formData.truck_driver_id ? '' : t('Driver is required'),
      status: formData.status ? '' : t('Status is required'),
      // notes: formData.notes ? '' : t('Notes are required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    const isValid = validateForm();
    if (!isValid) return;

    // Create form data for submission
    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, value);
    });

    setIsLoading(true);
    try {
      const response = await axiosMerchant.post(`trucks/store`, formData);
      toast.success(response.data.message);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      setShowDialog(false);
      dispatch(getTrucks());
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
          <span>{t("Create Truck")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("Create Truck")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="number_plate">{t("Number Plate")} <RequiredField /></label>
              <Input
                id="number_plate"
                name="number_plate"
                type="text"
                aria-label={t("Number Plate")}
                placeholder={t("Enter number plate...")}
                error={errors.number_plate}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    number_plate: e.target.value
                  }));
                }}
              />
              {errors.number_plate && (
                <p className="mt-1 text-sm text-red-500">{errors.number_plate}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="color">{t("Color")} <RequiredField /></label>
              <Input
                id="color"
                name="color"
                type="text"
                aria-label={t("Color")}
                placeholder={t("Enter color...")}
                error={errors.color}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    color: e.target.value
                  }));
                }}
              />
              {errors.color && (
                <p className="mt-1 text-sm text-red-500">{errors.color}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="company">{t("Company")} <RequiredField /></label>
              <Input
                id="company"
                name="company"
                type="text"
                aria-label={t("Company")}
                placeholder={t("Enter company...")}
                error={errors.company}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    company: e.target.value
                  }));
                }}
              />
              {errors.company && (
                <p className="mt-1 text-sm text-red-500">{errors.company}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="notes">{t("Notes")}</label>
              <Textarea
                id="notes"
                name="notes"
                type="text"
                aria-label={t("Notes")}
                placeholder={t("Enter notes...")}
                // error={errors.notes}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }));
                }}
              />
              {/* {errors.notes && (
                <p className="mt-1 text-sm text-red-500">{errors.notes}</p>
              )} */}
            </div>
            <div className="input-container">
              <label htmlFor="type">{t("Type")} <RequiredField /></label>
              <Select
                options={truckTypes}
                name="type"
                placeholder={t("Select truck type...")}
                isClearable={false}
                defaultValue={truckTypes[0]}
                error={errors.type}
                onChange={(selected) => {
                  setFormData(prev => ({
                    ...prev,
                    type: selected?.value || ''
                  }));
                }}
              />
              {errors.type && (
                <p className="mt-1 text-sm text-red-500">{errors.type}</p>
              )}
            </div>
            {/* <div className="input-container"> */}
              {/* <label htmlFor="truck_driver_id">{t("Driver")} <RequiredField /></label>
              <Select
                options={truck_drivers?.map(driver => ({
                  value: driver.user.id,
                  label: driver.user.name
                })) || []}
                name="truck_driver_id"
                placeholder={t("Select driver...")}
                isClearable={true}
                error={errors.truck_driver_id}
                onChange={(selected) => {
                  setFormData(prev => ({
                    ...prev,
                    truck_driver_id: selected?.value || ''
                  }));
                }}
              />
              {errors.truck_driver_id && (
                <p className="mt-1 text-sm text-red-500">{errors.truck_driver_id}</p>
              )}
            </div> */}
            <div className="input-container">
              <label htmlFor="status">{t("Status")} <RequiredField /></label>
              <Select
                options={statusOptions}
                name="status"
                placeholder={t("Select status...")}
                isClearable={false}
                defaultValue={statusOptions[0]}
                error={errors.status}
                onChange={(selected) => {
                  setFormData(prev => ({
                    ...prev,
                    status: selected?.value || ''
                  }));
                }}
              />
              {errors.status && (
                <p className="mt-1 text-sm text-red-500">{errors.status}</p>
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
