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
import {
  getAllDrivers,
  getCountries,
  getEmployeeDepartments,
  getEmployeePositions,
  getEmployees,
  getUsers,
} from "@/stores/features/ajaxFeature";
import { handleError } from "@/utils/helpers";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

function Edit({ onSubmitSuccess, record, onClose, feature }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    position_id: '',
    department_id: '',
    date_of_joining: '',
    base_hours: '',
    overtime_hour_salary: '',
    basic_salary: ''
  });
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [employeePositionValue, _setPositionValue] = useState([]);
  const [employeeDepartmentValue, _setDepartmentValue] = useState([]);
  const [directManagerValue, _setDirectManagerValue] = useState([]);
  const [employeeCountryValue, _setCountryValue] = useState([]);
  const [dateOfJoiningValue, _setDateOfJoiningValue] = useState(null);
  const [baseHoursValue, _setBaseHoursValue] = useState(null);
  const [overtimeHourSalaryValue, _setOvertimeHourSalaryValue] = useState(null);
  const [baseHourSalaryValue, _setBaseHourSalaryValue] = useState(null);

  const positions = useSelector((store) => store.ajax.employeePositions);
  const departments = useSelector((store) => store.ajax.employeeDepartments);
  const employees = useSelector((store) => store.ajax.employees);
  const countries = useSelector((store) => store.ajax.countries);
  const drivers = useSelector((store) => store.ajax.allDrivers);
  const users = useSelector((store) => store.ajax.users);

  useEffect(() => {
    if (!positions) {
      dispatch(getEmployeePositions());
    }
    if (!departments) {
      dispatch(getEmployeeDepartments());
    }
    if (!countries) {
      dispatch(getCountries());
    }
    if (!employees) {
      dispatch(getEmployees());
    }
    if (!drivers) {
      dispatch(getAllDrivers());
    }
    if (!users) {
      dispatch(getUsers());
    }
    setPositionValue({
      value: record.position?.id,
      label: record.position?.title,
    });
    setDepartmentValue({
      value: record.department?.id,
      label: record.department?.name,
    });
    setCountryValue({
      value: record.country?.id,
      label: record.country?.name,
    });
    setDirectManagerValue({
      value: record.direct_manager?.id,
      label: record.direct_manager?.name,
    });
  }, []);

  const setPositionValue = (value) => {
    _setPositionValue(value);
  };
  const setDepartmentValue = (value) => {
    _setDepartmentValue(value);
  };
  const setCountryValue = (value) => {
    _setCountryValue(value);
  };
  const setDirectManagerValue = (value) => {
    _setDirectManagerValue(value);
  };

  const validateForm = (form) => {
    const newErrors = {
      position_id: form.get('position_id') ? '' : t('Position is required'),
      department_id: form.get('department_id') ? '' : t('Department is required'),
      date_of_joining: form.get('date_of_joining') ? '' : t('Date of Joining is required'),
      base_hours: form.get('base_hours') ? '' : t('Base Hours is required'),
      overtime_hour_salary: form.get('overtime_hour_salary') ? '' : t('Overtime Hour Salary is required'),
      basic_salary: form.get('basic_salary') ? '' : t('Base Hour Salary is required')
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
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
  console.log(record,'record')
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader id="no-print">
          <DialogTitle>{feature.editTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="position_id">{t("Position")} <RequiredField /></label>
              <Select
                name="position_id"
                options={positions?.map((position) => ({
                  value: position.id,
                  label: position.title,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={employeePositionValue}
                onChange={(value) => setPositionValue(value)}
                error={errors.position_id}
              />
              {errors.position_id && (
                <p className="mt-1 text-sm text-red-500">{errors.position_id}</p>
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
                className="basic-multi-select"
                classNamePrefix="select"
                value={employeeDepartmentValue}
                onChange={(value) => setDepartmentValue(value)}
                error={errors.department_id}
              />
              {errors.department_id && (
                <p className="mt-1 text-sm text-red-500">{errors.department_id}</p>
              )}
            </div>
            {/* Direct Manager */}
            <div className="input-container">
              <label htmlFor="direct_manager_id">{t("Direct Manager")}</label>
              <Select
                name="direct_manager_id"
                options={employees?.map((manager) => ({
                  value: manager.id,
                  label: manager.name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={directManagerValue}
                onChange={(value) => setDirectManagerValue(value)}
              />
            </div>
            {/* Date of Joining */}
            <div className="input-container">
              <label htmlFor="date_of_joining">{t("Date of Joining")} <RequiredField /></label>
              <Input
                id="date_of_joining"
                name="date_of_joining"
                type="date"
                aria-label={t("Date of Joining")}
                defaultValue={record.date_of_joining}
                error={errors.date_of_joining}
              />
              {errors.date_of_joining && (
                <p className="mt-1 text-sm text-red-500">{errors.date_of_joining}</p>
              )}
            </div>

            {/* Base Hours */}
            <div className="input-container">
              <label htmlFor="base_hours">{t("Base Hours")} <RequiredField /></label>
              <Input
                id="base_hours"
                name="base_hours"
                type="number"
                aria-label={t("Base Hours")}
                defaultValue={record.base_hours}
                error={errors.base_hours}
              />
              {errors.base_hours && (
                <p className="mt-1 text-sm text-red-500">{errors.base_hours}</p>
              )}
            </div>

            {/* Overtime Hour Salary */}
            <div className="input-container">
              <label htmlFor="overtime_hour_salary">{t("Overtime Hour Salary")} <RequiredField /></label>
              <Input
                id="overtime_hour_salary"
                name="overtime_hour_salary"
                type="number"
                aria-label={t("Overtime Hour Salary")}
                defaultValue={record.overtime_hour_salary}
                error={errors.overtime_hour_salary}
              />
              {errors.overtime_hour_salary && (
                <p className="mt-1 text-sm text-red-500">{errors.overtime_hour_salary}</p>
              )}
            </div>

            {/* Base Hour Salary */}
            <div className="input-container">
              <label htmlFor="basic_salary">{t("Base Hour Salary")} <RequiredField /></label>
              <Input
                id="basic_salary"
                name="basic_salary"
                type="number"
                aria-label={t("Base Hour Salary")}
                defaultValue={record.basic_salary}
                error={errors.basic_salary}
              />
              {errors.basic_salary && (
                <p className="mt-1 text-sm text-red-500">{errors.basic_salary}</p>
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
