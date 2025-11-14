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
  getEmployees,
  getHierarchyLevels,
  getLeaveRequests,
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

  const [leaveRequest, _setLeaveRequest] = useState([]);
  const [approver, _setApprover] = useState([]);
  const [hierarchyLevel, _setHierarchyLevel] = useState([]);
  const [status, _setStatus] = useState("pending");
  const [comment, _setComment] = useState("");
  const [approvedAt, _setApprovedAt] = useState("");

  // Get data from Redux store
  const leaveRequests = useSelector((store) => store.ajax.leaveRequests);
  const employees = useSelector((store) => store.ajax.employees);
  const hierarchyLevels = useSelector((store) => store.ajax.hierarchyLevels);

  useEffect(() => {
    if (!leaveRequests) dispatch(getLeaveRequests());
    if (!employees) dispatch(getEmployees());
    if (!hierarchyLevels) dispatch(getHierarchyLevels());
  }, []);

  const setLeaveRequest = (leaveRequest) => _setLeaveRequest(leaveRequest);
  const setApprover = (approver) => _setApprover(approver);
  const setHierarchyLevel = (hierarchyLevel) =>
    _setHierarchyLevel(hierarchyLevel);
  const setStatus = (status) => _setStatus(status);
  const setComment = (comment) => _setComment(comment);
  const setApprovedAt = (approvedAt) => _setApprovedAt(approvedAt);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget);

      // Append approved_at if present
      if (approvedAt) {
        form.append("approved_at", approvedAt);
      }

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
            {/* Leave Request */}
            <div className="input-container">
              <label htmlFor="leave_request_id">{t("Leave Request")}</label>
              <Select
                name="leave_request_id"
                options={leaveRequests?.map((leaveRequest) => ({
                  value: leaveRequest.id,
                  label: `${leaveRequest.employee.name} - ${leaveRequest.leave_reason?.name_en ??
                    leaveRequest.leave_reason?.name_ar
                    }`,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={leaveRequest}
                onChange={(value) => setLeaveRequest(value)}
              />
            </div>

            {/* Approver */}
            <div className="input-container">
              <label htmlFor="approver_id">{t("Approver")}</label>
              <Select
                name="approver_id"
                options={employees?.map((employee) => ({
                  value: employee.id,
                  label: employee.name,
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
                options={hierarchyLevels?.map((level) => ({
                  value: level.id,
                  label: level.role_name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={hierarchyLevel}
                onChange={(value) => setHierarchyLevel(value)}
              />
            </div>

            {/* Status */}
            <div className="input-container">
              <label htmlFor="status">{t("Status")}</label>
              <Select
                name="status"
                options={[
                  { value: "pending", label: t("pending") },
                  { value: "approved", label: t("approved") },
                  { value: "rejected", label: t("rejected") },
                ]}
                className="basic-multi-select"
                classNamePrefix="select"
                value={status}
                onChange={(value) => setStatus(value)}
              />
            </div>

            {/* Comment */}
            <div className="input-container">
              <label htmlFor="comment">{t("Comment")}</label>
              <Input
                type="text"
                name="comment"
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {/* Approved At */}
            <div className="input-container">
              <label htmlFor="approved_at">{t("Approved At")}</label>
              <Input
                type="datetime-local"
                name="approved_at"
                id="approved_at"
                value={approvedAt}
                onChange={(e) => setApprovedAt(e.target.value)}
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
