import axiosMerchant from "@/axios";
import { default as Select } from "@/components/misc/Select";
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
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [employableType, _setEmployableType] = useState([]);
  const [position, _setPosition] = useState([]);
  const [department, _setDepartment] = useState([]);
  const [directManager, _setDirectManager] = useState([]);
  const [employableId, _setEmployableId] = useState([]);
  const [country, _setCountry] = useState([]);

  // Get data from Redux store
  const positions = useSelector((store) => store.ajax.employeePositions);
  const departments = useSelector((store) => store.ajax.employeeDepartments);
  const employees = useSelector((store) => store.ajax.employees);
  const countries = useSelector((store) => store.ajax.countries);
  const drivers = useSelector((store) => store.ajax.allDrivers);
  const users = useSelector((store) => store.ajax.users);

  useEffect(() => {
    if (!positions) dispatch(getEmployeePositions());
    if (!departments) dispatch(getEmployeeDepartments());
    if (!countries) dispatch(getCountries());
    if (!employees) dispatch(getEmployees());
    if (!drivers) dispatch(getAllDrivers());
    if (!users) dispatch(getUsers());
  }, []);

  const changeEmployableType = (v) => {
    _setEmployableId(null);
    _setEmployableType(v);
  };
  const setPosition = (value) => {
    _setPosition(value);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget);
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
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            {/* Employable Type */}
            <div className="input-container">
              <label htmlFor="employable_type">{t("Employable Type")}</label>
              <Select
                name="employable_type"
                options={[
                  { value: "user", label: t("User") },
                  { value: "driver", label: t("Driver") },
                ]}
                className="basic-multi-select"
                classNamePrefix="select"
                value={employableType}
                onChange={(value) => changeEmployableType(value)}
              />
            </div>

            {/* Employable ID (based on employable type) */}
            <div className="input-container">
              <label htmlFor="employable_id">{t("Employable ID")}</label>
              <Select
                name="employable_id"
                options={
                  employableType?.value
                    ? employableType?.value === "user"
                      ? users?.map((user) => ({
                        value: user.id,
                        label: user.name,
                      }))
                      : drivers?.map((driver) => ({
                        value: driver.id,
                        label: driver.user.name,
                      }))
                    : []
                }
                className="basic-multi-select"
                classNamePrefix="select"
                value={employableId}
                onChange={(value) => setEmployableId(value)}
              />
            </div>

            {/* Position */}
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
                value={position}
                onChange={(value) => setPosition(value)}
              />
            </div>

            {/* Department */}
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
                value={department}
                onChange={(value) => setDepartment(value)}
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
                value={directManager}
                onChange={(value) => setDirectManager(value)}
              />
            </div>

            {/* Country */}
            <div className="input-container">
              <label htmlFor="country_id">{t("Country")}</label>
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
              // value={dateOfJoining}
              // onChange={(e) => setDateOfJoining(e.target.value)}
              />
            </div>

            {/* Base Hours */}
            <div className="input-container">
              <label htmlFor="base_hours">{t("Base Hours")}</label>
              <Input
                id="base_hours"
                name="base_hours"
                type="number"
              // value={baseHours}
              // onChange={(e) => setBaseHours(e.target.value)}
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
              // value={overtimeSalary}
              // onChange={(e) => setOvertimeSalary(e.target.value)}
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
              // value={baseSalary}
              // onChange={(e) => setBaseSalary(e.target.value)}
              />
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
