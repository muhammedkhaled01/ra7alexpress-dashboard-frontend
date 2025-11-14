import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { Loader2, Copy, Check, Eye, EyeOff } from "lucide-react";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

function PartnerKeysModal({ partnerId, partnerName, open, onOpenChange }) {
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showSecrets, setShowSecrets] = useState({});
  const { t } = useTranslation();

  const fetchKeys = useCallback(async () => {
    if (!partnerId) return;
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`partners/${partnerId}/keys`);
      if (response.data.data && Array.isArray(response.data.data)) {
        setKeys(response.data.data);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    if (open && partnerId) {
      fetchKeys();
    }
  }, [open, partnerId, fetchKeys]);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success(t("Copied to clipboard"));
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getKeyLabel = (key) => {
    if (key.key_type === 'sandbox') {
      return t("Sandbox Key");
    } else if (key.key_type === 'production') {
      return t("Production Key");
    }
    // Fallback for keys without key_type (backward compatibility)
    return t("API Key");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {t("API Keys")} - {partnerName}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : keys.length > 0 ? (
            <div className="space-y-4">
              {keys.map((key, index) => (
                <div
                  key={key.id}
                  className="border rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-900"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">
                      {getKeyLabel(key)}
                    </h3>
                    <Badge
                      variant={key.is_active ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {key.is_active ? t("Active") : t("Inactive")}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("Key ID")}
                      </label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={key.key_id}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopy(key.key_id, `key-${index}`)}
                        >
                          {copiedIndex === `key-${index}` ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("API Secret")}
                      </label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={key.secret || t("Secret not available")}
                          readOnly
                          className="font-mono text-sm"
                          type={key.secret && showSecrets[`secret-${index}`] ? "text" : "password"}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (key.secret) {
                              setShowSecrets(prev => ({
                                ...prev,
                                [`secret-${index}`]: !prev[`secret-${index}`]
                              }));
                            } else {
                              toast.error(t("Secret not available"));
                            }
                          }}
                          title={key.secret ? (showSecrets[`secret-${index}`] ? t("Hide") : t("Show")) : t("Secret not available")}
                        >
                          {key.secret ? (
                            showSecrets[`secret-${index}`] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )
                          ) : (
                            <EyeOff className="h-4 w-4 opacity-50" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (key.secret) {
                              handleCopy(key.secret, `secret-${index}`);
                            } else {
                              toast.error(t("Secret not available"));
                            }
                          }}
                          title={key.secret ? t("Copy") : t("Secret not available")}
                        >
                          {copiedIndex === `secret-${index}` ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {key.secret && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t("Keep this secret secure and never share it publicly")}
                        </p>
                      )}
                    </div>

                    {key.expires_at && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {t("Expires At")}
                        </label>
                        <Input
                          value={new Date(key.expires_at).toLocaleString()}
                          readOnly
                          className="text-sm"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("Created At")}
                      </label>
                      <Input
                        value={new Date(key.created_at).toLocaleString()}
                        readOnly
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t("No API keys found for this partner")}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-x-2 mt-6">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t("Close")}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PartnerKeysModal;

