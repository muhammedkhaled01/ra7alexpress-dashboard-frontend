import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TextEditor from "@/components/common/TextEditor";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { handleError } from "@/utils/helpers";

/**
 * channel: "whatsapp" | "email"
 * record: { id, name, message? (whatsapp), subject?, body? (email) }
 */
export default function TemplateEditDialog({
  open,
  channel = "whatsapp",
  record,
  onClose,
  onSubmitSuccess,
}) {
  const isWhatsApp = channel === "whatsapp";
  const [isLoading, setIsLoading] = useState(false);
  const [invalidVariables, setInvalidVariables] = useState([]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(isWhatsApp ? (record?.message || "") : (record?.body || ""));
  const [subject, setSubject] = useState(record?.subject ?? "");
  const [body, setBody] = useState(record?.body ?? "");
  const endpoint = useMemo(
    () => (isWhatsApp ? "whatsapp_templates/update" : "email_templates/update"),
    [isWhatsApp]
  );
  useEffect(() => {
    setErrors({});
    setInvalidVariables([]);
    if (isWhatsApp) {
      setMessage(record?.message ? record?.message : record?.body ? record?.body : "");
    } else {
      setSubject(record?.subject ?? "");
      setBody(record?.body ?? "");
    }
  }, [record, isWhatsApp, channel]);

  const validate = () => {
    const e = {};
    if (!record?.name?.trim()) e.name = "Template key is required";
    if (isWhatsApp) {
      if (!message.trim()) e.message = "Message body is required";
      if (invalidVariables.length)
        e.message = "Message contains invalid variables.";
    } else {
      if (!subject.trim()) e.subject = "Subject is required";
      if (!body.trim()) e.body = "Body is required";
      if (invalidVariables.length) e.body = "Body contains invalid variables.";
    }
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setIsLoading(true);
    try {
      let payload;
      if (isWhatsApp) {
        const fd = new FormData();
        fd.append("id", record.id);
        fd.append("name", record.name);
        if(isWhatsApp) {
          fd.append("message", message);
        } else {
          fd.append("body", message);
        }
        payload = fd;
      } else {
        payload = {
          id: record.id,
          name: record.name,
          subject,
          body,
        };
      }

      const res = await axiosMerchant.post(endpoint, payload);
      toast.success(res?.data?.message || "Template updated");
      onSubmitSuccess?.();
      onClose?.();
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={
          isWhatsApp
            ? "sm:max-w-[80vw] lg:max-w-[500px]"
            : "sm:max-w-[85vw] lg:max-w-[720px]"
        }
      >
        <DialogHeader id="no-print">
          <DialogTitle>
            {isWhatsApp ? "Update WhatsApp Template" : "Update Email Template"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mt-2">
            {/* ثابت: الاسم (key) */}
            <div className="input-container">
              <label>Name</label>
              <Input value={record?.name ?? ""} disabled />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {isWhatsApp ? (
              // ===== WhatsApp fields =====
              <div className="input-container">
                <label>Message</label>
                <TextEditor
                  value={message}
                  onChange={setMessage}
                  onInvalidVariablesChange={setInvalidVariables}
                />
                {errors.message && (
                  <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                )}
              </div>
            ) : (
              // ===== Email fields =====
              <>
                <div className="input-container">
                  <label>Subject</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.subject}
                    </p>
                  )}
                </div>

                <div className="input-container">
                  <label>Body</label>
                  <TextEditor
                    value={body}
                    onChange={setBody}
                    onInvalidVariablesChange={setInvalidVariables}
                  />
                  {errors.body && (
                    <p className="text-red-500 text-sm mt-1">{errors.body}</p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
