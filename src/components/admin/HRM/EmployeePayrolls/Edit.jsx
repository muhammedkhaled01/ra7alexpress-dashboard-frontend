import { useEffect, useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import axiosMerchant from "@/axios";
import { default as Select } from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getEmployees } from "@/stores/features/ajaxFeature";
import { handleError } from "@/utils/helpers";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsProvider";

function Edit({ onSubmitSuccess, record, onClose, feature }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    employee_id: '',
    period_start_date: '',
    period_end_date: '',
    regular_hours: '',
    overtime_hours: '',
    regular_pay: '',
    overtime_pay: '',
    tax_deduction: '',
    insurance_deduction: '',
    penalty_deductions: '',
    gross_pay: '',
    net_pay: '',
    payment_date: '',
    lat: '',
    lng: ''
  });
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [employee, _setEmployee] = useState([]);
  const { isLoaded } = useGoogleMaps();
  const [latLng, setLatLng] = useState(null);

  const employees = useSelector((store) => store.ajax.employees);
  useEffect(() => {
    if (!employees) {
      dispatch(getEmployees());
    }

    setEmployee({
      value: record.employee?.id,
      label: record.employee?.name,
    });

    // Set initial location if available
    if (record.lat && record.lng) {
      setLatLng({ lat: parseFloat(record.lat), lng: parseFloat(record.lng) });
    }
  }, []);

  const setEmployee = (employee) => {
    _setEmployee(employee);
  };

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setLatLng({ lat, lng });
  };

  const validateForm = (form) => {
    const newErrors = {
      employee_id: form.get('employee_id') ? '' : t('Employee is required'),
      period_start_date: form.get('period_start_date') ? '' : t('Period Start Date is required'),
      period_end_date: form.get('period_end_date') ? '' : t('Period End Date is required'),
      regular_hours: form.get('regular_hours') ? '' : t('Regular Hours is required'),
      overtime_hours: form.get('overtime_hours') ? '' : t('Overtime Hours is required'),
      regular_pay: form.get('regular_pay') ? '' : t('Regular Pay is required'),
      overtime_pay: form.get('overtime_pay') ? '' : t('Overtime Pay is required'),
      tax_deduction: form.get('tax_deduction') ? '' : t('Tax Deduction is required'),
      insurance_deduction: form.get('insurance_deduction') ? '' : t('Insurance Deduction is required'),
      penalty_deductions: form.get('penalty_deductions') ? '' : t('Penalty Deductions is required'),
      gross_pay: form.get('gross_pay') ? '' : t('Gross Pay is required'),
      net_pay: form.get('net_pay') ? '' : t('Net Pay is required'),
      payment_date: form.get('payment_date') ? '' : t('Payment Date is required'),
      lat: latLng ? '' : t('Location is required'),
      lng: latLng ? '' : t('Location is required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    // Add location data to form
    if (latLng) {
      formData.append('lat', latLng.lat.toString());
      formData.append('lng', latLng.lng.toString());
    }
    
    if (!validateForm(formData)) return;
    setIsLoading(true);

    try {
      const response = await axiosMerchant.post(
        `${feature.baseEndpoint}/update`,
        formData
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
            {/* Employee */}
            <div className="input-container">
              <label htmlFor="employee_id">{t("Employee")} <RequiredField /></label>
              <Select
                name="employee_id"
                placeholder={t("Select an employee...")}
                options={employees?.map((manager) => ({
                  value: manager?.id,
                  label: manager?.user?.name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={employee}
                onChange={(value) => setEmployee(value)}
                error={errors.employee_id}
              />
              {errors.employee_id && (
                <p className="mt-1 text-sm text-red-500">{errors.employee_id}</p>
              )}
            </div>
            {/* Period Start Date */}
            <div className="input-container">
              <label htmlFor="period_start_date">{t("Period Start Date")} <RequiredField /></label>
              <Input
                id="period_start_date"
                placeholder={t("Select period start date...")}
                name="period_start_date"
                type="date"
                defaultValue={record.period_start_date}
                error={errors.period_start_date}
              />
              {errors.period_start_date && (
                <p className="mt-1 text-sm text-red-500">{errors.period_start_date}</p>
              )}
            </div>

            {/* Period End Date */}
            <div className="input-container">
              <label htmlFor="period_end_date">{t("Period End Date")} <RequiredField /></label>
              <Input
                id="period_end_date"
                placeholder={t("Select period end date...")}
                name="period_end_date"
                type="date"
                defaultValue={record.period_end_date}
                error={errors.period_end_date}
              />
              {errors.period_end_date && (
                <p className="mt-1 text-sm text-red-500">{errors.period_end_date}</p>
              )}
            </div>

            {/* Regular Hours */}
            <div className="input-container">
              <label htmlFor="regular_hours">{t("Regular Hours")} <RequiredField /></label>
              <Input
                id="regular_hours"
                placeholder={t("Enter regular hours")}
                name="regular_hours"
                type="number"
                defaultValue={record.regular_hours}
                error={errors.regular_hours}
              />
              {errors.regular_hours && (
                <p className="mt-1 text-sm text-red-500">{errors.regular_hours}</p>
              )}
            </div>

            {/* Overtime Hours */}
            <div className="input-container">
              <label htmlFor="overtime_hours">{t("Overtime Hours")} <RequiredField /></label>
              <Input
                id="overtime_hours"
                placeholder={t("Enter overtime hours")}
                name="overtime_hours"
                type="number"
                defaultValue={record.overtime_hours}
                error={errors.overtime_hours}
              />
              {errors.overtime_hours && (
                <p className="mt-1 text-sm text-red-500">{errors.overtime_hours}</p>
              )}
            </div>

            {/* Regular Pay */}
            <div className="input-container">
              <label htmlFor="regular_pay">{t("Regular Pay")} <RequiredField /></label>
              <Input
                id="regular_pay"
                placeholder={t("Enter regular pay")}
                name="regular_pay"
                type="number"
                defaultValue={record.regular_pay}
                error={errors.regular_pay}
              />
              {errors.regular_pay && (
                <p className="mt-1 text-sm text-red-500">{errors.regular_pay}</p>
              )}
            </div>

            {/* Overtime Pay */}
            <div className="input-container">
              <label htmlFor="overtime_pay">{t("Overtime Pay")} <RequiredField /></label>
              <Input
                id="overtime_pay"
                placeholder={t("Enter overtime pay")}
                name="overtime_pay"
                type="number"
                defaultValue={record.overtime_pay}
                error={errors.overtime_pay}
              />
              {errors.overtime_pay && (
                <p className="mt-1 text-sm text-red-500">{errors.overtime_pay}</p>
              )}
            </div>

            {/* Tax Deduction */}
            <div className="input-container">
              <label htmlFor="tax_deduction">{t("Tax Deduction")} <RequiredField /></label>
              <Input
                id="tax_deduction"
                placeholder={t("Enter tax deduction")}
                name="tax_deduction"
                type="number"
                defaultValue={record.tax_deduction}
                error={errors.tax_deduction}
              />
              {errors.tax_deduction && (
                <p className="mt-1 text-sm text-red-500">{errors.tax_deduction}</p>
              )}
            </div>

            {/* Insurance Deduction */}
            <div className="input-container">
              <label htmlFor="insurance_deduction">{t("Insurance Deduction")} <RequiredField /></label>
              <Input
                id="insurance_deduction"
                placeholder={t("Enter insurance deduction")}
                name="insurance_deduction"
                type="number"
                defaultValue={record.insurance_deduction}
                error={errors.insurance_deduction}
              />
              {errors.insurance_deduction && (
                <p className="mt-1 text-sm text-red-500">{errors.insurance_deduction}</p>
              )}
            </div>

            {/* Penalty Deductions */}
            <div className="input-container">
              <label htmlFor="penalty_deductions">{t("Penalty Deductions")} <RequiredField /></label>
              <Input
                id="penalty_deductions"
                placeholder={t("Enter penalty deductions")}
                name="penalty_deductions"
                type="number"
                defaultValue={record.penalty_deductions}
                error={errors.penalty_deductions}
              />
              {errors.penalty_deductions && (
                <p className="mt-1 text-sm text-red-500">{errors.penalty_deductions}</p>
              )}
            </div>

            {/* Gross Pay */}
            <div className="input-container">
              <label htmlFor="gross_pay">{t("Gross Pay")} <RequiredField /></label>
              <Input
                id="gross_pay"
                placeholder={t("Enter gross pay")}
                name="gross_pay"
                type="number"
                defaultValue={record.gross_pay}
                error={errors.gross_pay}
              />
              {errors.gross_pay && (
                <p className="mt-1 text-sm text-red-500">{errors.gross_pay}</p>
              )}
            </div>

            {/* Net Pay */}
            <div className="input-container">
              <label htmlFor="net_pay">{t("Net Pay")} <RequiredField /></label>
              <Input
                id="net_pay"
                placeholder={t("Enter net pay")}
                name="net_pay"
                type="number"
                defaultValue={record.net_pay}
                error={errors.net_pay}
              />
              {errors.net_pay && (
                <p className="mt-1 text-sm text-red-500">{errors.net_pay}</p>
              )}
            </div>

            {/* Payment Date */}
            <div className="input-container">
              <label htmlFor="payment_date">{t("Payment Date")} <RequiredField /></label>
              <Input
                id="payment_date"
                placeholder={t("Select payment date")}
                name="payment_date"
                type="date"
                defaultValue={record.payment_date}
                error={errors.payment_date}
              />
              {errors.payment_date && (
                <p className="mt-1 text-sm text-red-500">{errors.payment_date}</p>
              )}
            </div>

            {/* Location */}
            <div className="input-container">
              <label>{t("Location")} <RequiredField /></label>
              <div className="mt-2">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "300px" }}
                    center={latLng || { lat: 23.5880, lng: 58.3829 }}
                    zoom={10}
                    onClick={handleMapClick}
                  >
                    {latLng && <Marker position={latLng} />}
                  </GoogleMap>
                ) : (
                  <div className="h-[300px] w-full flex items-center justify-center bg-gray-100 rounded">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                <div className="input-container">
                  <label htmlFor="lat">{t("Latitude")}</label>
                  <Input
                    id="lat"
                    name="lat"
                    type="text"
                    value={latLng?.lat || ''}
                    readOnly
                    error={errors.lat}
                  />
                  {errors.lat && (
                    <p className="mt-1 text-sm text-red-500">{errors.lat}</p>
                  )}
                </div>
                <div className="input-container">
                  <label htmlFor="lng">{t("Longitude")}</label>
                  <Input
                    id="lng"
                    name="lng"
                    type="text"
                    value={latLng?.lng || ''}
                    readOnly
                    error={errors.lng}
                  />
                  {errors.lng && (
                    <p className="mt-1 text-sm text-red-500">{errors.lng}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <input type="hidden" name="id" value={record.id} />
          <div className="flex justify-end gap-x-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {/* Close button translation already handled by t('Close') */}
                {t("Close")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
                {/* Save Changes translation already handled by t('Save Changes') */}
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
