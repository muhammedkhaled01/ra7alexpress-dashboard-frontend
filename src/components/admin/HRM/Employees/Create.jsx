import axiosMerchant from "@/axios";
import { default as Select } from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
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
import {
  getAllDrivers,
  getCountries,
  getEmployeeDepartments,
  getEmployeePositions,
  getEmployees,
  getHierarchyLevels,
  getManagers,
  getUsers,
} from "@/stores/features/ajaxFeature";
import { handleError } from "@/utils/helpers";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

function Create({ onSubmitSuccess, feature }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    user_id: '',
    department_id: '',
    position_id: '',
    level_id: '',
    country_id: '',
    date_of_joining: '',
    base_hours: '',
    overtime_hour_salary: '',
    basic_salary: ''
  });
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [employableType, _setEmployableType] = useState([]);
  const [department, _setDepartment] = useState([]);
  const [directManager, _setDirectManager] = useState([]);
  const [employableId, _setEmployableId] = useState([]);
  const [country, _setCountry] = useState([]);
  const [position, setPosition] = useState(null);
  const [positions, setPositions] = useState(null);

  // const [level, setLevel] = useState(null);
  // const [levels, setLevels] = useState(null);

  const departments = useSelector((store) => store.ajax.employeeDepartments);
  const employees = useSelector((store) => store.ajax.employees);
  const countries = useSelector((store) => store.ajax.countries);
  const drivers = useSelector((store) => store.ajax.allDrivers);
  const users = useSelector((store) => store.ajax.users);
  const managers = useSelector((store) => store.ajax.managers);

  const levels = useSelector((store) => store.ajax.hierarchyLevels);

  useEffect(() => {
    if (!departments) dispatch(getEmployeeDepartments());
    if (!countries) dispatch(getCountries());
    if (!employees) dispatch(getEmployees());
    if (!users) dispatch(getUsers());
    if (!managers) dispatch(getManagers());
    if (!levels) dispatch(getHierarchyLevels());
  }, []);

  const changeEmployableType = (v) => {
    _setEmployableId(null);
    _setEmployableType(v);
  };

  const setDepartment = (value) => {
    _setDepartment(value);
  };
  const setDirectManager = (value) => {
    _setDirectManager(value);
  };
  const setEmployableId = (value) => {
    _setEmployableId(value);
  };
  const setCountry = (value) => {
    _setCountry(value);
  };

  const fetchPositions = async (departmentId) => {
    if (!departmentId) return;
    try {
      const response = await axiosMerchant.get(
        `/employee_positions/positions/${departmentId}`
      );
      setPositions(response.data.positions);
    } catch (error) {
      console.error("Error fetching positions:", error);
    }
  };

  const handleDepartmentChange = (value) => {
    setDepartment(value);
    setPosition(null);
    fetchPositions(value?.value);
  };

  const validateForm = (form) => {
    const newErrors = {
      user_id: form.get('user_id') ? '' : t('User is required'),
      department_id: form.get('department_id') ? '' : t('Department is required'),
      position_id: form.get('position_id') ? '' : t('Position is required'),
      level_id: form.get('level_id') ? '' : t('Level is required'),
      country_id: form.get('country_id') ? '' : t('Country is required'),
      date_of_joining: form.get('date_of_joining') ? '' : t('Date of Joining is required'),
      base_hours: form.get('base_hours') ? '' : t('Base Hours is required'),
      overtime_hour_salary: form.get('overtime_hour_salary') ? '' : t('Overtime Hour Salary is required'),
      basic_salary: form.get('basic_salary') ? '' : t('Base Hour Salary is required')
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
      const response = await axiosMerchant.post(`employees/store`, form);
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
          <span>{t("Create Employee")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("Create Employee")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="user_id">{t("Employable ID")} <RequiredField /></label>
              <Select
                name="user_id"
                options={users?.map((user) => ({
                  value: user.id,
                  label: user.name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={employableId}
                onChange={(value) => setEmployableId(value)}
                placeholder={t("Select a user...")}
                error={errors.user_id}
              />
              {errors.user_id && (
                <p className="mt-1 text-sm text-red-500">{errors.user_id}</p>
              )}
            </div>

            <div className="input-container">
              <label htmlFor="department_id">{t("Department")} <RequiredField /></label>
              <Select
                name="department_id"
                options={departments?.map((d) => ({
                  value: d.id,
                  label: d.name,
                }))}
                value={department}
                onChange={handleDepartmentChange}
                placeholder={t("Select a department...")}
                error={errors.department_id}
              />
              {errors.department_id && (
                <p className="mt-1 text-sm text-red-500">{errors.department_id}</p>
              )}
            </div>
            <div className="input-container">
              <label htmlFor="position_id">{t("Position")} <RequiredField /></label>
              <Select
                name="position_id"
                options={positions?.map((p) => ({
                  value: p.id,
                  label: p.title,
                }))}
                value={position}
                onChange={setPosition}
                isDisabled={!department}
                placeholder={t("Select a position...")}
                error={errors.position_id}
              />
              {errors.position_id && (
                <p className="mt-1 text-sm text-red-500">{errors.position_id}</p>
              )}
            </div>

            <div className="input-container">
              <label htmlFor="level_id">{t("Level")} <RequiredField /></label>
              <Select
                name="level_id"
                options={levels?.map((level) => ({
                  value: level.id,
                  label: level.role_name,
                }))}
                placeholder={t("Select a level...")}
                error={errors.level_id}
              />
              {errors.level_id && (
                <p className="mt-1 text-sm text-red-500">{errors.level_id}</p>
              )}
            </div>

            {/* Direct Manager */}
            <div className="input-container">
              <label htmlFor="direct_manager_id">{t("Direct Manager")}</label>
              <Select
                name="direct_manager_id"
                options={managers?.map((manager) => ({
                  value: manager.id,
                  label: manager.name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={directManager}
                onChange={(value) => setDirectManager(value)}
                placeholder={t("Select a manager...")}
              />
            </div>

            {/* Country */}
            <div className="input-container">
              <label htmlFor="country_id">{t("Country")} <RequiredField /></label>
              <Select
                name="country_id"
                options={countries?.map((country) => ({
                  value: country.id,
                  label: country.name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={country}
                onChange={(value) => setCountry(value)}
                placeholder={t("Select a country...")}
                error={errors.country_id}
              />
              {errors.country_id && (
                <p className="mt-1 text-sm text-red-500">{errors.country_id}</p>
              )}
            </div>

            {/* Date of Joining */}
            <div className="input-container">
              <label htmlFor="date_of_joining">{t("Date of Joining")} <RequiredField /></label>
              <Input
                id="date_of_joining"
                name="date_of_joining"
                type="date"
                aria-label={t("Date of Joining")}
                placeholder={t("Select a date...")}
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
                placeholder={t("Enter base hours")}
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
                placeholder={t("Enter overtime hour salary")}
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
                placeholder={t("Enter base hour salary")}
                error={errors.basic_salary}
              />
              {errors.basic_salary && (
                <p className="mt-1 text-sm text-red-500">{errors.basic_salary}</p>
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
