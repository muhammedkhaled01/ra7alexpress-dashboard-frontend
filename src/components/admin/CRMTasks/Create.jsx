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
import { Textarea } from "@/components/ui/textarea";
import { handleError } from "@/utils/helpers";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

function Create({ onSubmitSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [complaintValue, _setComplaintValue] = useState([]);
  const [crmAgentValue, _setCrmAgentValue] = useState([]);

  const complaints = useSelector((store) => store.ajax.complaints);
  const crmAgents = useSelector((store) => store.ajax.crmAgents);

  useEffect(() => {
    if (!complaints) {
      dispatch(getComplaints());
    }
    if (!crmAgents) {
      dispatch(getCrmAgents());
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      e.preventDefault();

      const form = new FormData(e.currentTarget);
      const crmComplaintId = form.get("crm_complaint_id");
      const taskName = form.get("task_name");
      const description = form.get("description");
      const assignedTo = form.get("assigned_to");

      if (!crmComplaintId || !taskName || !description || !assignedTo) {
        toast.error(t("Fill the required fields"));
        setIsLoading(false);
        return;
      }

      const response = await axiosMerchant.post("crm_tasks/store", form);
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

  const setComplaintValue = (value) => {
    _setComplaintValue(value);
  };
  const setCrmAgentValue = (value) => {
    _setCrmAgentValue(value);
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{t("Create Task")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("Create Task")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="input-container">
              <label htmlFor="crm_complaint_id">{t("Complaint")}</label>
              <Select
                name="crm_complaint_id"
                options={complaints?.map((complaint) => ({
                  value: complaint.id,
                  label: complaint.complaint_details,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={complaintValue}
                onChange={(value) => setComplaintValue(value)}
              />
            </div>
            <div className="input-container">
              <label htmlFor="assigned_to">{t("Assigned To")}</label>
              <Select
                name="assigned_to"
                options={crmAgents?.map((crmAgent) => ({
                  value: crmAgent.id,
                  label: crmAgent.name,
                }))}
                className="basic-multi-select"
                classNamePrefix="select"
                value={crmAgentValue}
                onChange={(value) => setCrmAgentValue(value)}
              />
            </div>
            <div className="input-container">
              <label htmlFor="task_name">{t("Task Name")}</label>
              <Input
                id="task_name"
                name="task_name"
                type="text"
                aria-label={t("Task Name")}
              />
            </div>
            <div className="input-container">
              <label htmlFor="description">{t("Task Description")}</label>
              <Textarea
                id="description"
                name="description"
                type="text"
                aria-label={t("Task Description")}
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
