import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import axiosMerchant from "@/axios";
import toast from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress"; // if you have it; otherwise swap with a div
import { Upload, Loader2, Download } from "lucide-react";
import { fileDownloader, handleError } from "@/utils/helpers";

const ACCEPT = ".xlsx,.xls,.csv";

const StateChannelImportDialog = ({
  open,
  onClose,
  shipperId,
  onSubmitSuccess,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    validateAndSet(f);
  };

  const validateAndSet = (f) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    const allowed = ["xlsx", "xls", "csv"];
    if (!allowed.includes(ext)) {
      toast.error(t("Unsupported file type. Please upload xlsx, xls, or csv."));
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error(t("File is too large (max 10MB)."));
      return;
    }
    setFile(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) validateAndSet(f);
  }, []);

  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);

  const reset = () => {
    setFile(null);
    setProgress(0);
    fileInputRef.current && (fileInputRef.current.value = "");
  };

  const handleTemplateDownload = async () => {
    setDownloadingTemplate(true);
    try {
      await fileDownloader({
        url: "state_channels/import_template", // implement in backend; otherwise handleError will show a toast
        fileName: "state_channels_import_template.xlsx",
      });
    } catch (err) {
      handleError(err);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error(t("Please choose a file first."));
    if (!shipperId) return toast.error(t("Missing shipper id."));

    const form = new FormData();
    form.append("file", file);
    form.append("shipper_id", shipperId);

    setSubmitting(true);
    setProgress(0);

    try {
      const { data } = await axiosMerchant.post("state_channels/channels", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const p = Math.round((evt.loaded * 100) / evt.total);
          setProgress(p);
        },
      });

      toast.success(data?.message || t("Imported successfully"));
      onSubmitSuccess && onSubmitSuccess();
      reset();
    } catch (err) {
      handleError(err);
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {t("Import State Channels")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={[
              "rounded-2xl border-2 border-dashed p-6 transition-all",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/20",
            ].join(" ")}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <Upload className="size-6" />
              <p className="text-sm">
                <span className="font-medium">
                  {t("Drag & drop your file here")}
                </span>{" "}
                {t("or")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {t("Browse")}
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                onChange={onFileChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                {t("Allowed formats")}: xlsx, xls, csv • {t("Max")} 10MB
              </p>

              {file && (
                <div className="mt-3 w-full rounded-md bg-muted p-2 text-left">
                  <p className="text-sm truncate">
                    <span className="font-medium">{t("Selected")}:</span>{" "}
                    {file.name}
                  </p>
                  {!!progress && (
                    <div className="mt-2">
                      {Progress ? (
                        <Progress value={progress} />
                      ) : (
                        <div className="h-2 w-full rounded bg-muted-foreground/10">
                          <div
                            className="h-2 rounded bg-primary"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {progress}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick tips */}
          <div className="rounded-xl border bg-card p-3">
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                • {t("Include columns")}:{" "}
                <b>
                  internal_state_id, internal_state_name, external_state_id,
                  external_state_name
                </b>
              </li>
              <li>
                • {t("Ensure shipper id is provided by the page context")}
              </li>
              <li>
                •{" "}
                {t(
                  "Duplicate rows will be skipped if your backend enforces uniqueness"
                )}
              </li>
            </ul>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              {t("Close")}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="download"
                onClick={handleTemplateDownload}
                disabled={downloadingTemplate}
                title={t("Download Template")}
              >
                {downloadingTemplate ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {/* <span className="ml-2">{t("Template")}</span> */}
              </Button>

              <Button
                type="submit"
                variant="upload"
                disabled={submitting || !file}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {/* <span className="ml-2">{t("Import")}</span> */}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StateChannelImportDialog;
