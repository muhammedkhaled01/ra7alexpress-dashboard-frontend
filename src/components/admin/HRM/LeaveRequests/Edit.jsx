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
import { getEmployees, getLeaveReasons } from "@/stores/features/ajaxFeature";
import { handleError } from "@/utils/helpers";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

function Edit({ onSubmitSuccess, record, onClose, feature }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    employee_id: '',
    reason_id: '',
    start_date: '',
    end_date: '',
    status: ''
  });
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [employee, _setEmployee] = useState([]);
  const [reason, _setReason] = useState([]);
  const [status, _setStatus] = useState("pending");
  const [proofFile, _setProofFile] = useState(null);

  const employees = useSelector((store) => store.ajax.employees);
  const leaveReasons = useSelector((store) => store.ajax.leaveReasons);
  console.log(employees, 'employees')

  useEffect(() => {
    if (!employees) dispatch(getEmployees());
    if (!leaveReasons) dispatch(getLeaveReasons());

    setEmployee({
      value: record.user?.id,
      label: record.user?.name,
    });
    setReason({
      value: record.leave_reason?.id,
      label: record.leave_reason?.name_en ?? record.leave_reason?.name_ar,
    });
    setStatus({
      value: record.status,
      label: t(record.status),
    });
  }, []);

  const setEmployee = (employee) => _setEmployee(employee);
  const setReason = (reason) => _setReason(reason);
  const setStatus = (status) => _setStatus(status);
  const setProofFile = (file) => _setProofFile(file);

  const validateForm = (form) => {
    const newErrors = {
      employee_id: form.get('employee_id') ? '' : t('Employee is required'),
      reason_id: form.get('reason_id') ? '' : t('Leave Reason is required'),
      start_date: form.get('start_date') ? '' : t('Start Date is required'),
      end_date: form.get('end_date') ? '' : t('End Date is required'),
      status: form.get('status') ? '' : t('Status is required')
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
      if (proofFile) {
        formData.append("proof_file", proofFile);
      }
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
                placeholder={t("Select an employee...")}
                name="employee_id"
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
            {/* Reason */}
            <div className="input-container">
              <label htmlFor="reason_id">{t("Leave Reason")} <RequiredField /></label>
              <Select
                placeholder={t("Select leave reason...")}
                name="reason_id"
                options={leaveReasons?.map((reason) => ({
                  value: reason.id,
                  label: reason.name_en ?? reason.name_ar,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={reason}
                onChange={(value) => setReason(value)}
                error={errors.reason_id}
              />
              {errors.reason_id && (
                <p className="mt-1 text-sm text-red-500">{errors.reason_id}</p>
              )}
            </div>

            {/* Status */}
            <div className="input-container">
              <label htmlFor="status">{t("Status")} <RequiredField /></label>
              <Select
                placeholder={t("Select status...")}
                name="status"
                options={[
                  { value: "pending", label: t("Pending") },
                  { value: "approved", label: t("Approved") },
                  { value: "rejected", label: t("Rejected") },
                ]}
                className="basic-multi-select"
                classNamePrefix="select"
                value={status}
                onChange={(value) => setStatus(value)}
                error={errors.status}
              />
              {errors.status && (
                <p className="mt-1 text-sm text-red-500">{errors.status}</p>
              )}
            </div>

            {/* Start Date */}
            <div className="input-container">
              <label htmlFor="start_date">{t("Start Date")} <RequiredField /></label>
              <Input
                type="date"
                placeholder={t("Select start date...")}
                name="start_date"
                id="start_date"
                defaultValue={record.start_date ? new Date(record.start_date).toISOString().split('T')[0] : ''}
                error={errors.start_date}
              />
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-500">{errors.start_date}</p>
              )}
            </div>

            {/* End Date */}
            <div className="input-container">
              <label htmlFor="end_date">{t("End Date")} <RequiredField /></label>
              <Input
                type="date"
                placeholder={t("Select end date...")}
                name="end_date"
                id="end_date"
                defaultValue={record.end_date ? new Date(record.end_date).toISOString().split('T')[0] : ''}
                error={errors.end_date}
              />
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-500">{errors.end_date}</p>
              )}
            </div>

            {/* Proof File */}
            <div className="input-container">
              <label htmlFor="proof_file">{t("Proof File")}</label>
              <Input
                type="file"
                placeholder={t("Upload proof file...")}
                name="proof_file"
                id="proof_file"
                onChange={(e) => setProofFile(e.target.files[0])}
                accept=".jpeg,.png,.jpg,.pdf"
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
