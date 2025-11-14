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
import { getLeaveReasons, getUsers } from "@/stores/features/ajaxFeature";
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
    employee_id: '',
    reason_id: '',
    start_date: '',
    end_date: '',
    status: ''
  });
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [employee, _setEmployee] = useState([]);
  const [reason, _setReason] = useState([]);
  const [status, _setStatus] = useState("pending");
  const [startDate, _setStartDate] = useState("");
  const [endDate, _setEndDate] = useState("");
  const [proofFile, _setProofFile] = useState(null);

  // Get data from Redux store
  const users = useSelector((store) => store.ajax.users);
  const leaveReasons = useSelector((store) => store.ajax.leaveReasons);

  useEffect(() => {
    if (!users) dispatch(getUsers());
    if (!leaveReasons) dispatch(getLeaveReasons());
  }, []);

  const setEmployee = (employee) => _setEmployee(employee);
  const setReason = (reason) => _setReason(reason);
  const setStatus = (status) => _setStatus(status);
  const setStartDate = (date) => _setStartDate(date);
  const setEndDate = (date) => _setEndDate(date);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!validateForm(form)) return;
    setIsLoading(true);
    try {
      // Append proof file if present
      if (proofFile) {
        form.append("proof_file", proofFile);
      }

      const response = await axiosMerchant.post(`leave_requests/store`, form);
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
          <span>{t("Create Leave")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("Create Leave")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            {/* Employee */}
            <div className="input-container">
              <label htmlFor="employee_id">{t("Employee")} <RequiredField /></label>
              <Select
                name="employee_id"
                placeholder={t("Select an employee...")}
                options={users?.map((user) => ({
                  value: user.id,
                  label: user.name,
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
                name="reason_id"
                placeholder={t("Select leave reason...")}
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
                name="status"
                placeholder={t("Select status...")}
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
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
