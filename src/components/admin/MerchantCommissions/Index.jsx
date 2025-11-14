import axiosMerchant from "@/axios";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import Loader from "@/components/Loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";
import { can, handleError, formatDecimalValue } from "@/utils/helpers";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useSelector } from "react-redux";

// shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MerchantCommission = () => {
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [merchantData, setMerchantData] = useState(null);

  // formData keyed by stateId
  const [formData, setFormData] = useState({});

  // selections + bulk modal
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkField, setBulkField] = useState("base_delivery_fee"); // "delivery_discount_amount" | "base_return_fee" | "return_discount_amount"
  const [bulkScope, setBulkScope] = useState("all"); // "all" | "selected"
  const [bulkValue, setBulkValue] = useState("");

  const params = useParams();
  const precision = useSelector((s) => s.setting?.decimalPrecision);
  const DELIVERY_PREC =
    typeof precision === "number" ? precision : precision?.delivery_fee ?? 3;
  const RETURN_PREC =
    typeof precision === "number" ? precision : precision?.return_fee ?? 3;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const canAccess = can("Merchant Commission access");
  if (!canAccess) return navigate("/unauthorized");

  // helpers
  const validateDecimalInput = (value, prec) => {
    const p = Number.isInteger(prec) ? prec : 3;
    const regex = new RegExp(`^\\d*\\.?\\d{0,${p}}$`);
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

  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString(); // تقدر تغيّر للتنسيق اللي تحبه
  };

  const recalcRow = (row) => {
    const baseDel = row.base_delivery_fee ?? "0";
    const discDel = row.delivery_discount_amount ?? "0";
    const baseRet = row.base_return_fee ?? "0";
    const discRet = row.return_discount_amount ?? "0";
    return {
      ...row,
      delivery_fee: calcDelivery(baseDel, discDel),
      return_fee: calcReturn(baseRet, discRet),
      // last_updated بنسيبه زي ما هو لو موجود
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
      // إعادة حساب النهائي فقط عند تغيير الحقول المؤثرة
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

  // fetch
  useEffect(() => {
    (async () => {
      await fetchMerchantData();
      await fetchCommissions(true); // force overwrite on initial load so UI reflects server
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMerchantData = async () => {
    try {
      const response = await axiosMerchant.get("merchants/getSingle", {
        params: { merchant_id: params.id },
      });

      const data = response.data.data;
      const statesArr = data?.states ?? [];
      setStates(statesArr);
      setMerchantData(data);

      // Initialize rows with zeros (and no last_updated)
      const initialFormData = {};
      statesArr.forEach((state) => {
        initialFormData[state.id] = recalcRow({
          base_delivery_fee: formatDecimalValue(0, DELIVERY_PREC),
          delivery_discount_amount: formatDecimalValue(0, DELIVERY_PREC),
          base_return_fee: formatDecimalValue(0, RETURN_PREC),
          return_discount_amount: formatDecimalValue(0, RETURN_PREC),
          last_updated: null,
        });
      });
      setFormData(initialFormData);
    } catch (error) {
      console.error("Error fetching shipper data:", error);
    }
  };

  const fetchCommissions = async (overwrite = false) => {
    setLoading(true);
    try {
      // Backend route is GET /merchant_commissions/{merchant_id}
      const response = await axiosMerchant.get(`merchant_commissions/${params.id}`, {
        params: { _ts: Date.now() },
      });
      const commissionsData = response.data.data || [];
      setCommissions(commissionsData);

      // Merge server values with local edits.
      // If overwrite=true, replace all rows with server data.
      // If overwrite=false, preserve existing local values and only refresh metadata (last_updated) or fill missing rows.
      setFormData((prev) => {
        if (overwrite) {
          const replaced = {};
          commissionsData.forEach((c) => {
            const row = {
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
              last_updated: c.updated_at ?? c.created_at ?? null,
            };
            replaced[c.state_id] = recalcRow(row);
          });
          return replaced;
        } else {
          const merged = { ...prev };
          commissionsData.forEach((c) => {
            const existing = merged[c.state_id];
            if (existing) {
              // Preserve local numeric values, update last_updated from server
              merged[c.state_id] = recalcRow({
                ...existing,
                last_updated: c.updated_at ?? c.created_at ?? existing.last_updated ?? null,
              });
            } else {
              // If row doesn't exist locally yet, seed it from server
              const row = {
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
                last_updated: c.updated_at ?? c.created_at ?? null,
              };
              merged[c.state_id] = recalcRow(row);
            }
          });
          return merged;
        }
      });
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // reformat when precision changes
  useEffect(() => {
    if (states.length > 0 && Object.keys(formData).length > 0) {
      setFormData((prev) => {
        const updated = {};
        Object.entries(prev).forEach(([stateId, fees]) => {
          const row = {
            base_delivery_fee: formatDecimalValue(
              fees.base_delivery_fee ?? 0,
              DELIVERY_PREC
            ),
            delivery_discount_amount: formatDecimalValue(
              fees.delivery_discount_amount ?? 0,
              DELIVERY_PREC
            ),
            base_return_fee: formatDecimalValue(
              fees.base_return_fee ?? 0,
              RETURN_PREC
            ),
            return_discount_amount: formatDecimalValue(
              fees.return_discount_amount ?? 0,
              RETURN_PREC
            ),
            last_updated: fees.last_updated ?? null,
          };
          updated[stateId] = recalcRow(row);
        });
        return updated;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DELIVERY_PREC, RETURN_PREC, states.length]);

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Snapshot and normalize ALL visible inputs (loop over displayed states)
    // to ensure we post exactly what the user sees on screen.
    const normalizedByStateId = {};
    states.forEach((state) => {
      const raw = formData[state.id] || {};
      const normalized = recalcRow({
        base_delivery_fee: formatDecimalValue(
          raw.base_delivery_fee ?? 0,
          DELIVERY_PREC
        ),
        delivery_discount_amount: formatDecimalValue(
          raw.delivery_discount_amount ?? 0,
          DELIVERY_PREC
        ),
        base_return_fee: formatDecimalValue(
          raw.base_return_fee ?? 0,
          RETURN_PREC
        ),
        return_discount_amount: formatDecimalValue(
          raw.return_discount_amount ?? 0,
          RETURN_PREC
        ),
        last_updated: raw.last_updated ?? null,
      });
      normalizedByStateId[state.id] = normalized;
    });

    // Build payload strictly from the states displayed in the table,
    // so we always send ALL rows currently visible to overwrite backend.
    const commissionsToSend = states.map((state) => {
      const fee = normalizedByStateId[state.id];
      return {
        state_id: parseInt(state.id, 10),
        base_delivery_fee: parseFloat(fee.base_delivery_fee) || 0,
        base_return_fee: parseFloat(fee.base_return_fee) || 0,
        delivery_discount_amount: parseFloat(fee.delivery_discount_amount) || 0,
        return_discount_amount: parseFloat(fee.return_discount_amount) || 0,
        // optional (server may recompute)
        delivery_fee: parseFloat(fee.delivery_fee) || 0,
        return_fee: parseFloat(fee.return_fee) || 0,
      };
    });

    const payload = { merchant_id: params.id, commissions: commissionsToSend };

    try {
      const response = await axiosMerchant.post(
        "merchant_commissions/store_commissions",
        payload
      );
      toast.success(response.data.message || "Saved");
      // After successful save, refresh from server and overwrite local form values
      fetchCommissions(true);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // UI
  return (
    <div>
      <div className="flex justify-between">
        <PageTitle title={`Merchant Commissions`} />

        {/* Actions */}
        <div className="flex gap-2 items-center flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setBulkField("base_delivery_fee");
              setBulkScope("all");
              setBulkValue("");
              setBulkOpen(true);
            }}
            title="Set Base Delivery"
          >
            {t("Set Base Delivery")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setBulkField("delivery_discount_amount");
              setBulkScope("all");
              setBulkValue("");
              setBulkOpen(true);
            }}
            title="Set Delivery Discount"
          >
            {t("Set Delivery Discount")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setBulkField("base_return_fee");
              setBulkScope("all");
              setBulkValue("");
              setBulkOpen(true);
            }}
            title="Set Base Return"
          >
            {t("Set Base Return")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setBulkField("return_discount_amount");
              setBulkScope("all");
              setBulkValue("");
              setBulkOpen(true);
            }}
            title="Set Return Discount"
          >
            {t("Set Return Discount")}
          </Button>

          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("Save")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 shadow-md py-4 mt-2 rounded-lg flex flex-col">
          <form onSubmit={handleSubmit}>
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="px-2 py-1">
                    <input
                      type="checkbox"
                      checked={
                        states.length > 0 && selectedIds.size === states.length
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
                  <TableHead className="px-2 py-1">{t("Return Fee")}</TableHead>

                  <TableHead className="px-2 py-1">
                    {t("Last Updated")}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-2">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : states.length > 0 ? (
                  states.map((state, index) => {
                    const row = formData[state.id] || {};
                    return (
                      <TableRow key={state.id} className="text-xs">
                        <TableCell className="px-2 py-1">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(state.id)}
                            onChange={(e) =>
                              setSelectedIds((prev) => {
                                const n = new Set(prev);
                                e.target.checked
                                  ? n.add(state.id)
                                  : n.delete(state.id);
                                return n;
                              })
                            }
                          />
                        </TableCell>

                        <TableCell className="px-2 py-1">{index + 1}</TableCell>
                        <TableCell className="px-2 py-1">
                          {state.en_name}/{state.ar_name}
                        </TableCell>

                        {/* Base Delivery */}
                        <TableCell className="px-2 py-1">
                          <Input
                            type="text"
                            className="w-24 h-8 text-xs px-1"
                            value={
                              row.base_delivery_fee ??
                              formatDecimalValue(0, DELIVERY_PREC)
                            }
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

                        {/* Delivery Discount (amount) */}
                        <TableCell className="px-2 py-1">
                          <Input
                            type="text"
                            className="w-24 h-8 text-xs px-1"
                            value={
                              row.delivery_discount_amount ??
                              formatDecimalValue(0, DELIVERY_PREC)
                            }
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

                        {/* Delivery Fee (display only) */}
                        <TableCell className="px-2 py-1">
                          <div className="w-24 h-8 text-xs px-1 flex items-center rounded bg-muted/40">
                            {row.delivery_fee ??
                              formatDecimalValue(0, DELIVERY_PREC)}
                          </div>
                        </TableCell>

                        {/* Base Return */}
                        <TableCell className="px-2 py-1">
                          <Input
                            type="text"
                            className="w-24 h-8 text-xs px-1"
                            value={
                              row.base_return_fee ??
                              formatDecimalValue(0, RETURN_PREC)
                            }
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
                                formatDecimalValue(e.target.value, RETURN_PREC),
                                "base_return_fee",
                                RETURN_PREC
                              )
                            }
                          />
                        </TableCell>

                        {/* Return Discount (amount) */}
                        <TableCell className="px-2 py-1">
                          <Input
                            type="text"
                            className="w-24 h-8 text-xs px-1"
                            value={
                              row.return_discount_amount ??
                              formatDecimalValue(0, RETURN_PREC)
                            }
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
                                formatDecimalValue(e.target.value, RETURN_PREC),
                                "return_discount_amount",
                                RETURN_PREC
                              )
                            }
                          />
                        </TableCell>

                        {/* Return Fee (display only) */}
                        <TableCell className="px-2 py-1">
                          <div className="w-24 h-8 text-xs px-1 flex items-center rounded bg-muted/40">
                            {row.return_fee ??
                              formatDecimalValue(0, RETURN_PREC)}
                          </div>
                        </TableCell>

                        {/* Last Updated */}
                        <TableCell className="px-2 py-1">
                          <span className="text-[11px] text-muted-foreground">
                            {formatDateTime(row.last_updated)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-2">
                      No states found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="mt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("Save")
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Bulk Edit Modal */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{bulkTitleMap[bulkField]}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="block text-xs mb-1">Value</label>
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
              <label className="block text-xs mb-1">Apply to</label>
              <Select value={bulkScope} onValueChange={(v) => setBulkScope(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All states</SelectItem>
                  <SelectItem value="selected">
                    Selected only ({selectedIds.size})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              Note: This applies a fixed amount. Final fees are previewed here
              and recomputed on the server.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyBulk}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MerchantCommission;
