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
import { getEmployees } from "@/stores/features/ajaxFeature";
import { handleError } from "@/utils/helpers";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

function Edit({ onSubmitSuccess, record, onClose, feature }) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [employee, _setEmployee] = useState([]);
  const [approver, _setApprover] = useState([]);
  const [hierarchyLevel, _setHierarchyLevel] = useState([]);

  // Get data from Redux store
  const employees = useSelector((store) => store.ajax.employees);
  const hierarchyLevels = useSelector((store) => store.ajax.hierarchyLevels);
  useEffect(() => {
    if (!employees) dispatch(getEmployees());
    if (!hierarchyLevels) dispatch(getHierarchyLevels());

    setEmployee({
      value: record.employee?.id,
      label: record.employee?.name,
    });
    setApprover({
      value: record.approver?.id,
      label: record.approver?.name,
    });
    setHierarchyLevel({
      value: record.hierarchy_level?.id,
      label: record.hierarchy_level?.role_name,
    });
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
