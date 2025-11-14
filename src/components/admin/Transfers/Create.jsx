import React, { useState } from "react";
import axiosMerchant from "@/axios";
import { Button } from "../../ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { handleError, can } from "@/utils/helpers";

const MODEL_MAP = {
  Branch: "App\\Models\\Branch",
  Hub: "App\\Models\\Hub",
  Station: "App\\Models\\Station",
};

const CreateTransfer = ({ onSubmitSuccess }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [fromType, setFromType] = useState("Branch");
  const [fromId, setFromId] = useState("");
  const [toType, setToType] = useState("Hub");
  const [toId, setToId] = useState("");
  const [notes, setNotes] = useState("");
  const [trackingText, setTrackingText] = useState("");

  const createAbility = can("Inter Branch Transfer create");
  if (!createAbility) return null;

  const submit = async (e) => {
    e.preventDefault();
    const tracking_nos = trackingText
      .split(/\r?\n|,|;/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!code.trim()) return alert("Code is required");
    if (!fromId || !toId) return alert("From/To IDs are required");
    if (
      MODEL_MAP[fromType] === MODEL_MAP[toType] &&
      String(fromId) === String(toId)
    ) {
      return alert("From and To must be different");
    }

    setSaving(true);
    try {
      await axiosMerchant.post("inter-branch-transfers/store", {
        code,
        from_type: MODEL_MAP[fromType],
        from_id: Number(fromId),
        to_type: MODEL_MAP[toType],
        to_id: Number(toId),
        notes,
        tracking_nos,
      });
      setOpen(false);
      setCode("");
      setFromId("");
      setToId("");
      setNotes("");
      setTrackingText("");
      onSubmitSuccess && onSubmitSuccess();
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{saving ? "Saving..." : "Create Transfer"}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Create Inter-Branch Transfer</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1">Code</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="TRF-2025-00001"
              />
            </div>
            <div>
              <label className="block mb-1">Notes (optional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="سبب التحويل"
              />
            </div>
            <div>
              <label className="block mb-1">From Type</label>
              <Select value={fromType} onValueChange={setFromType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Branch">Branch</SelectItem>
                  <SelectItem value="Hub">Hub</SelectItem>
                  <SelectItem value="Station">Station</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1">From ID</label>
              <Input
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                placeholder="مثال: 1"
              />
            </div>
            <div>
              <label className="block mb-1">To Type</label>
              <Select value={toType} onValueChange={setToType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Branch">Branch</SelectItem>
                  <SelectItem value="Hub">Hub</SelectItem>
                  <SelectItem value="Station">Station</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1">To ID</label>
              <Input
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                placeholder="مثال: 2"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1">
              Tracking Numbers (line/comma separated)
            </label>
            <Textarea
              rows={5}
              value={trackingText}
              onChange={(e) => setTrackingText(e.target.value)}
              placeholder={"TN001\nTN002\nTN003"}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTransfer;
