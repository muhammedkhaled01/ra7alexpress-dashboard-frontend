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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
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
            <div className="input-container">
              <label htmlFor="position_id">{t("Position")}</label>
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
              />
            </div>
            <div className="input-container">
              <label htmlFor="department_id">{t("Department")}</label>
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
              />
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
              <label htmlFor="date_of_joining">{t("Date of Joining")}</label>
              <Input
                id="date_of_joining"
                name="date_of_joining"
                type="date"
                aria-label={t("Date of Joining")}
                defaultValue={record.date_of_joining}
              />
            </div>

            {/* Base Hours */}
            <div className="input-container">
              <label htmlFor="base_hours">{t("Base Hours")}</label>
              <Input
                id="base_hours"
                name="base_hours"
                type="number"
                aria-label={t("Base Hours")}
                defaultValue={record.base_hours}
              />
            </div>

            {/* Overtime Hour Salary */}
            <div className="input-container">
              <label htmlFor="overtime_hour_salary">
                {t("Overtime Hour Salary")}
              </label>
              <Input
                id="overtime_hour_salary"
                name="overtime_hour_salary"
                type="number"
                aria-label={t("Overtime Hour Salary")}
                defaultValue={record.overtime_hour_salary}
              />
            </div>

            {/* Base Hour Salary */}
            <div className="input-container">
              <label htmlFor="base_hour_salary">{t("Base Hour Salary")}</label>
              <Input
                id="base_hour_salary"
                name="base_hour_salary"
                type="number"
                aria-label={t("Base Hour Salary")}
                defaultValue={record.base_hour_salary}
              />
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
