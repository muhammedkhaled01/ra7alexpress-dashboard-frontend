"use merchant";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import axiosMerchant from "@/axios";

import { Settings, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Loader from "@/components/Loader";
import { formatDecimalValue, handleError } from "@/utils/helpers";

export default function MerchantSettings() {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [states, setStates] = useState([]);
  const [formData, setFormData] = useState({});

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkField, setBulkField] = useState("base_delivery_fee");
  const [bulkScope, setBulkScope] = useState("all");
  const [bulkValue, setBulkValue] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const DELIVERY_PREC = 3;
  const RETURN_PREC = 3;

  const validateDecimalInput = (value, prec) => {
    const regex = new RegExp(`^\\d*\\.?\\d{0,${prec}}$`);
    return regex.test(value);
  };

  const calcDelivery = (base, discount) =>
    formatDecimalValue(
      Math.max(0, (parseFloat(base) || 0) - (parseFloat(discount) || 0)),
      DELIVERY_PREC
    );

  const calcReturn = (base, discount) =>
    formatDecimalValue(
      Math.max(0, (parseFloat(base) || 0) - (parseFloat(discount) || 0)),
      RETURN_PREC
    );

  const recalcRow = (row) => {
    const baseDel = row.base_delivery_fee ?? "0";
    const discDel = row.delivery_discount_amount ?? "0";
    const baseRet = row.base_return_fee ?? "0";
    const discRet = row.return_discount_amount ?? "0";
    return {
      ...row,
      delivery_fee: calcDelivery(baseDel, discDel),
      return_fee: calcReturn(baseRet, discRet),
    };
  };

  const handleInputChange = (stateId, value, field, prec) => {
    if (!validateDecimalInput(value, prec)) return;
    const parts = value.split(".");
    if (parts.length === 2 && parts[1].length > (prec ?? 3)) {
      value = `${parts[0]}.${parts[1].substring(0, prec ?? 3)}`;
    }

    setFormData((prev) => {
      const prevRow = prev[stateId] || {};
      const updated = { ...prevRow, [field]: value };
      const recalculated =
        field === "delivery_fee" || field === "return_fee"
          ? updated
          : recalcRow(updated);
      return { ...prev, [stateId]: recalculated };
    });
  };

  const bulkTitleMap = useMemo(
    () => ({
      base_delivery_fee: "Bulk Edit — Base Delivery Fee",
      delivery_discount_amount: "Bulk Edit — Delivery Discount (Amount)",
      base_return_fee: "Bulk Edit — Base Return Fee",
      return_discount_amount: "Bulk Edit — Return Discount (Amount)",
    }),
    []
  );

  const applyBulk = () => {
    const prec =
      bulkField === "base_delivery_fee" ||
      bulkField === "delivery_discount_amount"
        ? DELIVERY_PREC
        : RETURN_PREC;

    if (!validateDecimalInput(bulkValue, prec)) return;

    const valueFormatted = formatDecimalValue(bulkValue || "0", prec);
    const targets =
      bulkScope === "all"
        ? states.map((s) => s.id)
        : Array.from(selectedIds.values());

    setFormData((prev) => {
      const next = { ...prev };
      targets.forEach((id) => {
        const row = { ...(next[id] || {}) };
        row[bulkField] = valueFormatted;
        next[id] = recalcRow(row);
      });
      return next;
    });

    setBulkOpen(false);
    setBulkValue("");
  };

  const fetchDefaults = async () => {
    setIsFetching(true);
    try {
      const [statesRes, defaultsRes] = await Promise.all([
        axiosMerchant.get("states"),
        axiosMerchant.get("merchant_commissions/defaults"),
      ]);

      const statesArr = statesRes?.data?.data ?? [];
      setStates(statesArr);

      const initial = {};
      statesArr.forEach((s) => {
        initial[s.id] = recalcRow({
          base_delivery_fee: formatDecimalValue(0, DELIVERY_PREC),
          delivery_discount_amount: formatDecimalValue(0, DELIVERY_PREC),
          base_return_fee: formatDecimalValue(0, RETURN_PREC),
          return_discount_amount: formatDecimalValue(0, RETURN_PREC),
        });
      });

      const defaults = defaultsRes?.data?.data ?? [];
      defaults.forEach((c) => {
        if (!c.state_id) return;
        initial[c.state_id] = recalcRow({
          base_delivery_fee: formatDecimalValue(
            c.base_delivery_fee ?? 0,
            DELIVERY_PREC
          ),
          delivery_discount_amount: formatDecimalValue(
            c.delivery_discount_amount ?? 0,
            DELIVERY_PREC
          ),
          base_return_fee: formatDecimalValue(
            c.base_return_fee ?? 0,
            RETURN_PREC
          ),
          return_discount_amount: formatDecimalValue(
            c.return_discount_amount ?? 0,
            RETURN_PREC
          ),
        });
      });

      setFormData(initial);
      setSelectedIds(new Set());
    } catch (err) {
      handleError(err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchDefaults();
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const commissions = Object.entries(formData)
        .filter(([state_id]) => !isNaN(parseInt(state_id, 10)))
        .map(([state_id, fee]) => ({
          state_id: parseInt(state_id, 10),
          base_delivery_fee: parseFloat(fee.base_delivery_fee) || 0,
          base_return_fee: parseFloat(fee.base_return_fee) || 0,
          delivery_discount_amount:
            parseFloat(fee.delivery_discount_amount) || 0,
          return_discount_amount: parseFloat(fee.return_discount_amount) || 0,
          delivery_fee: parseFloat(fee.delivery_fee || "0") || 0,
          return_fee: parseFloat(fee.return_fee || "0") || 0,
        }));

      await axiosMerchant.post("merchant_commissions/defaults", { commissions });
      toast.success(t("Defaults saved"));
      setIsOpen(false);
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="settings"
        onClick={() => setIsOpen(true)}
        title={t("Default Merchant Commissions")}
      >
        <Settings className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[96vw] sm:max-w-[96vw] lg:max-w-[1280px] max-h-[90vh] overflow-y-auto">
          {" "}
          <DialogHeader>
            <DialogTitle>{t("Default Merchant Commissions")}</DialogTitle>
            <DialogDescription>
              {t(
                "These values will be used as defaults for any newly created merchant."
              )}
            </DialogDescription>
          </DialogHeader>
          {isFetching ? (
            <div className="flex items-center justify-center h-[180px]">
              <Loader className="!h-[32px] !w-[32px] animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex gap-2 items-center flex-wrap mb-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkField("base_delivery_fee");
                    setBulkScope("all");
                    setBulkOpen(true);
                  }}
                >
                  {t("Set Base Delivery")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkField("delivery_discount_amount");
                    setBulkScope("all");
                    setBulkOpen(true);
                  }}
                >
                  {t("Set Delivery Discount")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkField("base_return_fee");
                    setBulkScope("all");
                    setBulkOpen(true);
                  }}
                >
                  {t("Set Base Return")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkField("return_discount_amount");
                    setBulkScope("all");
                    setBulkOpen(true);
                  }}
                >
                  {t("Set Return Discount")}
                </Button>
              </div>

              <div className="border rounded-md">
                <Table className="w-full text-sm">
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="px-2 py-1">
                        <input
                          type="checkbox"
                          checked={
                            states.length > 0 &&
                            selectedIds.size === states.length
                          }
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelectedIds(new Set(states.map((s) => s.id)));
                            else setSelectedIds(new Set());
                          }}
                        />
                      </TableHead>
                      <TableHead className="px-2 py-1">#</TableHead>
                      <TableHead className="px-2 py-1">{t("State")}</TableHead>
                      <TableHead className="px-2 py-1">
                        {t("Base Delivery")}
                      </TableHead>
                      <TableHead className="px-2 py-1">
                        {t("Delivery Discount")}
                      </TableHead>
                      <TableHead className="px-2 py-1">
                        {t("Delivery Fee")}
                      </TableHead>
                      <TableHead className="px-2 py-1">
                        {t("Base Return")}
                      </TableHead>
                      <TableHead className="px-2 py-1">
                        {t("Return Discount")}
                      </TableHead>
                      <TableHead className="px-2 py-1">
                        {t("Return Fee")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {states.length > 0 ? (
                      states.map((state, index) => {
                        const row = formData[state.id] || recalcRow({});
                        return (
                          <TableRow key={state.id} className="text-xs">
                            <TableCell className="px-2 py-1">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(state.id)}
                                onChange={(e) => {
                                  setSelectedIds((prev) => {
                                    const n = new Set(prev);
                                    e.target.checked
                                      ? n.add(state.id)
                                      : n.delete(state.id);
                                    return n;
                                  });
                                }}
                              />
                            </TableCell>
                            <TableCell className="px-2 py-1">
                              {index + 1}
                            </TableCell>
                            <TableCell className="px-2 py-1">
                              {state.en_name}/{state.ar_name}
                            </TableCell>

                            <TableCell className="px-2 py-1">
                              <Input
                                type="text"
                                className="w-24 h-8 text-xs px-1"
                                value={row.base_delivery_fee}
                                onChange={(e) =>
                                  handleInputChange(
                                    state.id,
                                    e.target.value,
                                    "base_delivery_fee",
                                    DELIVERY_PREC
                                  )
                                }
                                onBlur={(e) =>
                                  handleInputChange(
                                    state.id,
                                    formatDecimalValue(
                                      e.target.value,
                                      DELIVERY_PREC
                                    ),
                                    "base_delivery_fee",
                                    DELIVERY_PREC
                                  )
                                }
                              />
                            </TableCell>

                            <TableCell className="px-2 py-1">
                              <Input
                                type="text"
                                className="w-24 h-8 text-xs px-1"
                                value={row.delivery_discount_amount}
                                onChange={(e) =>
                                  handleInputChange(
                                    state.id,
                                    e.target.value,
                                    "delivery_discount_amount",
                                    DELIVERY_PREC
                                  )
                                }
                                onBlur={(e) =>
                                  handleInputChange(
                                    state.id,
                                    formatDecimalValue(
                                      e.target.value,
                                      DELIVERY_PREC
                                    ),
                                    "delivery_discount_amount",
                                    DELIVERY_PREC
                                  )
                                }
                              />
                            </TableCell>

                            <TableCell className="px-2 py-1">
                              <div className="w-24 h-8 text-xs px-1 flex items-center rounded bg-muted/40">
                                {row.delivery_fee}
                              </div>
                            </TableCell>

                            <TableCell className="px-2 py-1">
                              <Input
                                type="text"
                                className="w-24 h-8 text-xs px-1"
                                value={row.base_return_fee}
                                onChange={(e) =>
                                  handleInputChange(
                                    state.id,
                                    e.target.value,
                                    "base_return_fee",
                                    RETURN_PREC
                                  )
                                }
                                onBlur={(e) =>
                                  handleInputChange(
                                    state.id,
                                    formatDecimalValue(
                                      e.target.value,
                                      RETURN_PREC
                                    ),
                                    "base_return_fee",
                                    RETURN_PREC
                                  )
                                }
                              />
                            </TableCell>

                            <TableCell className="px-2 py-1">
                              <Input
                                type="text"
                                className="w-24 h-8 text-xs px-1"
                                value={row.return_discount_amount}
                                onChange={(e) =>
                                  handleInputChange(
                                    state.id,
                                    e.target.value,
                                    "return_discount_amount",
                                    RETURN_PREC
                                  )
                                }
                                onBlur={(e) =>
                                  handleInputChange(
                                    state.id,
                                    formatDecimalValue(
                                      e.target.value,
                                      RETURN_PREC
                                    ),
                                    "return_discount_amount",
                                    RETURN_PREC
                                  )
                                }
                              />
                            </TableCell>

                            <TableCell className="px-2 py-1">
                              <div className="w-24 h-8 text-xs px-1 flex items-center rounded bg-muted/40">
                                {row.return_fee}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-6">
                          {t("No states found.")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isFetching}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("Saving")}
                </>
              ) : (
                t("Save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="w-[600px] sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{bulkTitleMap[bulkField]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-xs mb-1">{t("Value")}</label>
              <Input
                type="text"
                value={bulkValue}
                onChange={(e) => {
                  const prec =
                    bulkField === "base_delivery_fee" ||
                    bulkField === "delivery_discount_amount"
                      ? DELIVERY_PREC
                      : RETURN_PREC;
                  const v = e.target.value;
                  if (validateDecimalInput(v, prec)) setBulkValue(v);
                }}
                onBlur={(e) => {
                  const prec =
                    bulkField === "base_delivery_fee" ||
                    bulkField === "delivery_discount_amount"
                      ? DELIVERY_PREC
                      : RETURN_PREC;
                  setBulkValue(formatDecimalValue(e.target.value || "0", prec));
                }}
              />
            </div>

            <div>
              <label className="block text-xs mb-1">{t("Apply to")}</label>
              <Select value={bulkScope} onValueChange={(v) => setBulkScope(v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("All states")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All states")}</SelectItem>
                  <SelectItem value="selected">
                    {t("Selected only")} ({selectedIds.size})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              {t("Final fees are previewed here and recomputed on the server.")}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={applyBulk}>{t("Apply")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
