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
import {
  getEmployees,
  getHierarchyLevels,
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
  const [employee, _setEmployee] = useState([]);
  const [approver, _setApprover] = useState([]);
  const [hierarchyLevel, _setHierarchyLevel] = useState([]);

  // Get data from Redux store
  const employees = useSelector((store) => store.ajax.employees);
  const hierarchyLevels = useSelector((store) => store.ajax.hierarchyLevels);

  useEffect(() => {
    if (!employees) dispatch(getEmployees());
    if (!hierarchyLevels) dispatch(getHierarchyLevels());
  }, []);

  const setEmployee = (employee) => {
    _setEmployee(employee);
  };
  const setApprover = (employee) => {
    _setApprover(employee);
  };
  const setHierarchyLevel = (hierarchyLevel) => {
    _setHierarchyLevel(hierarchyLevel);
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
            {/* Employee */}
            <div className="input-container">
              <label htmlFor="employee_id">{t("Employee")}</label>
              <Select
                name="employee_id"
                options={employees?.map((manager) => ({
                  value: manager.id,
                  label: manager.name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={employee}
                onChange={(value) => setEmployee(value)}
              />
            </div>
            {/* Approver */}
            <div className="input-container">
              <label htmlFor="approver_id">{t("Approver")}</label>
              <Select
                name="approver_id"
                options={employees?.map((manager) => ({
                  value: manager.id,
                  label: manager.name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={approver}
                onChange={(value) => setApprover(value)}
              />
            </div>
            {/* Hierarchy Level */}
            <div className="input-container">
              <label htmlFor="hierarchy_level_id">{t("Hierarchy Level")}</label>
              <Select
                name="hierarchy_level_id"
                options={hierarchyLevels?.map((manager) => ({
                  value: manager.id,
                  label: manager.role_name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={hierarchyLevel}
                onChange={(value) => setHierarchyLevel(value)}
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
