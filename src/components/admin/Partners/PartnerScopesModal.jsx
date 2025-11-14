import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Select from "@/components/misc/Select";
import axiosMerchant from "@/axios";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

export default function PartnerScopesModal({ open, onOpenChange, partner }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [scopes, setScopes] = useState([]);

  const suggestedScopeOptions = useMemo(
    () => [
      { value: "partner:read", label: "partner:read" },
      { value: "quota:read", label: "quota:read" },
      { value: "shipments:read", label: "shipments:read" },
      { value: "tracking:read", label: "tracking:read" },
    ],
    []
  );

  useEffect(() => {
    if (open && partner) {
      setScopes(Array.isArray(partner.allowed_scopes) ? partner.allowed_scopes : []);
    }
  }, [open, partner]);

  const addScope = (value) => {
    const scope = (value || "").trim();
    if (!scope) return;
    if (scopes.includes(scope)) return;
    setScopes((prev) => [...prev, scope]);
  };

  const removeScope = (scope) => {
    setScopes((prev) => prev.filter((s) => s !== scope));
  };

  const handleSave = async () => {
    if (!partner?.id) return;
    setSaving(true);
    try {
      await axiosMerchant.post(`partners/${partner.id}/scopes`, {
        allowed_scopes: scopes,
      });
      toast.success(t("Partner scopes updated successfully"));
      onOpenChange(false);
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {t("Edit Allowed Scopes")} {partner ? `- ${partner.name}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">
              {t("Allowed Scopes")}
            </label>
            <div className="flex gap-2 mt-2">
              <Select
                value={null}
                onChange={(opt) => addScope(opt?.value)}
                options={suggestedScopeOptions.filter(
                  (opt) => !scopes.includes(opt.value)
                )}
                placeholder={t("Select a scope...")}
                isClearable
                isSearchable
                className="w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {scopes.length > 0 ? (
                scopes.map((scope) => (
                  <Badge key={scope} variant="outline" className="text-xs">
                    <span className="mr-2">{scope}</span>
                    <button
                      type="button"
                      onClick={() => removeScope(scope)}
                      className="text-red-500 hover:text-red-600"
                      title={t("Remove")}
                    >
                      ×
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-gray-400">{t("N/A")}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t("Cancel")}
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? t("Saving...") : t("Save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


