// src/components/misc/ImportDialog.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosMerchant from "@/axios";
import { handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";

const ImportDialog = ({ endpoint, onClose, onSubmitSuccess }) => {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("create"); // create | upsert
  const [submitting, setSubmitting] = useState(false);
  const [failures, setFailures] = useState([]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setSubmitting(true);
    setFailures([]);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("mode", mode);
      const res = await axiosMerchant.post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const failed = res?.data?.data?.failed_rows || [];
      setFailures(failed);
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (err) {
      handleError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import States</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm">Mode</label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="create">Create Only</SelectItem>
                <SelectItem value="upsert">
                  Upsert (Update by id if present)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm">File (.csv / .xlsx)</label>
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">
              استخدم <b>Template</b> عشان الأعمدة تبقى مظبوطة: id (اختياري للـ
              upsert), en_name, ar_name, country_id, governorate_id,
              station_id?, lat?, lng?
            </p>
          </div>

          {submitting ? <Loader /> : null}

          {failures.length > 0 && (
            <div className="max-h-40 overflow-auto rounded-md border p-2">
              <div className="text-sm font-medium mb-1">Failed rows:</div>
              <ul className="text-xs space-y-1">
                {failures.map((f, i) => (
                  <li key={i}>
                    Row {f.row}: {f.errors.join("; ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" disabled={!file || submitting}>
              Import
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;
