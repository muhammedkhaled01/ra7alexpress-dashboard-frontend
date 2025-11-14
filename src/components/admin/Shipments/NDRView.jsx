import React, { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import ImagePreview from "@/components/misc/ImagePreview";
import Loader from "@/components/Loader";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import moment from "@/utils/moment";
import { handleError, humanizeText } from "@/utils/helpers";

/* ---------- Badge Variant زي الـNDRList ---------- */
const badgeVariant = (status) => {
  switch (status) {
    case "Pending":
      return "secondary";
    case "Rescheduled":
      return "outline";
    case "Closed":
      return "default";
    case "Delivered":
      return "success";
    case "RTO":
      return "destructive";
    default:
      return "outline";
  }
};

function KV({ k, v, right = false, bold = false }) {
  return (
    <TableRow>
      <TableCell className={bold ? "font-bold" : ""}>{k}</TableCell>
      <TableCell className={`${right ? "text-right" : ""}`}>
        {v ?? "-"}
      </TableCell>
    </TableRow>
  );
}

/**
 * Dialog لعرض تفاصيل الـ NDR/Shipment بشكل منظّم زي CRM View
 * Props:
 * - open, onOpenChange
 * - row: سجّل NDR من الجدول (لازم فيه tracking_no)
 * - onReschedule: fn(row) لفتح مودال الريشيدول الخارجي
 */
const NDRView = ({ open, onOpenChange, row, onReschedule }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState(row?.shipment || null);

  const receiptImg = row?.in_exception && row?.core_exception?.proof;
  const ndrId = row?.core_exception?.id ?? "—";
  const attemptDate =
    row?.core_exception?.time || row?.core_exception?.updated_at || "—";
  const exceptionType = row?.core_exception?.type || "—";
  const trackingNo = row?.tracking_no;

  const fetchShipment = useCallback(
    async (tracking) => {
      if (!tracking) return;
      setLoading(true);
      try {
        const res = await axiosMerchant.post("shipments/getSingle", {
          tracking_no: tracking,
        });
        toast.success(res?.data?.message || t("Loaded"));
        setShipment(res?.data?.data || null);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (open) {
      setShipment(row?.shipment || null); // عرض مبدئي
      fetchShipment(trackingNo); // تحديث من السيرفر
    } else {
      setShipment(null);
      setLoading(true);
    }
  }, [open, row, trackingNo, fetchShipment]);

  const refresh = () => fetchShipment(trackingNo);

  // Utilities بسيطة
  const money = (n) => (n > 0 ? n : 0);
  const yesNo = (v) => (v ? t("Yes") : t("No"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 👇 وسّعنا العرض والارتفاع + Scroll داخلي + padding */}
      <DialogContent className="!max-w-[95vw] w-[95vw] md:!max-w-[1200px] lg:!max-w-[1400px] xl:!max-w-[1600px] h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {t("View NDR / Shipment")} — {trackingNo || "—"}
            </span>
            {/* <Button
              type="button"
              variant="refresh"
              onClick={refresh}
              disabled={loading}
              className="ml-2"
              title={t("Refresh")}
            >
              <RefreshCcw className="w-4 h-4" />
            </Button> */}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-10">
            <Loader />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* ========== NDR Summary ========== */}
            <Card>
              <CardHeader>
                <CardTitle>{t("NDR Summary")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Proof + Status */}
                  <div className="flex items-start gap-3">
                    <div className="w-[90px] h-[90px] flex items-center justify-center rounded-lg bg-muted overflow-hidden">
                      {receiptImg ? (
                        <ImagePreview
                          style={{ width: 90, height: 90 }}
                          src={receiptImg}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t("No Proof")}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={badgeVariant(row?.ndr_status)}>
                          {row?.ndr_status || "—"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {t("NDR ID")}:
                        </span>
                        <span className="text-sm font-semibold">{ndrId}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t("Attempt Date")}:
                        <span className="ml-1 font-medium text-foreground">
                          {attemptDate}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t("Exception Type")}:
                        <span className="ml-1 font-medium text-foreground">
                          {exceptionType}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Shipment Meta */}
                  <div>
                    <Table>
                      <TableBody>
                        <KV
                          k={t("Shipment")}
                          v={shipment?.tracking_no || trackingNo}
                        />
                        <KV
                          k={t("Payment Type")}
                          v={shipment?.payment_type || "-"}
                        />
                        <KV
                          k={t("Delivery Fee")}
                          v={money(shipment?.delivery_fee)}
                        />
                        <KV k={t("Value")} v={money(shipment?.value)} />
                      </TableBody>
                    </Table>
                  </div>

                  {/* Quick Party Meta */}
                  <div>
                    <Table>
                      <TableBody>
                        <KV
                          k={t("Driver")}
                          v={row?.driver?.name || shipment?.driver?.name}
                        />
                        <KV
                          k={t("Company")}
                          v={
                            row?.company?.name ||
                            row?.merchant?.name ||
                            shipment?.merchant?.name
                          }
                        />
                        <KV
                          k={t("Warehouse")}
                          v={
                            row?.warehouse?.name ||
                            row?.core_exception?.warehouse?.name ||
                            shipment?.warehouse?.name
                          }
                        />
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ========== Basic / Financial ========== */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Basic & Financial")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Table>
                    <TableBody>
                      <KV k={t("Tracking No")} v={shipment?.tracking_no || "-"} />
                      <KV k={t("Amount")} v={money(shipment?.amount)} />
                      <KV k={t("Fee Payer")} v={shipment?.fee_payer || "-"} />
                      <KV k={t("Notes")} v={shipment?.notes || "-"} />
                    </TableBody>
                  </Table>

                  <Table>
                    <TableBody>
                      <KV
                        k={t("In Warehouse")}
                        v={
                          shipment?.shipment_information?.in_warehouse != null
                            ? yesNo(shipment?.shipment_information?.in_warehouse)
                            : "-"
                        }
                      />
                      <KV
                        k={t("Shelf Barcode")}
                        v={
                          shipment?.assigned_to_shelf?.shelf?.barcode
                            ? String(shipment?.assigned_to_shelf?.shelf?.barcode)
                            : "-"
                        }
                      />
                      <KV
                        k={t("Customer PayType")}
                        v={shipment?.payment_type || "-"}
                      />
                      <KV
                        k={t("Created At")}
                        v={
                          shipment?.created_at
                            ? moment(shipment?.created_at).format(
                                "YYYY-MM-DD HH:mm"
                              )
                            : "-"
                        }
                      />
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* ========== Merchant (اختياري) ========== */}
            {shipment?.merchant && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("Merchant")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Table>
                      <TableBody>
                        <KV k={t("Sender")} v={shipment?.merchant?.name || "-"} />
                        <KV k={t("Email")} v={shipment?.merchant?.email || "-"} />
                        <KV
                          k={t("Latitude")}
                          v={
                            shipment?.merchant?.latitude ??
                            shipment?.merchant?.merchant?.place?.lat ??
                            "-"
                          }
                        />
                      </TableBody>
                    </Table>

                    <Table>
                      <TableBody>
                        <KV
                          k={t("Country")}
                          v={shipment?.merchant?.merchant?.country?.name || "-"}
                        />
                        <KV
                          k={t("Place")}
                          v={
                            shipment?.merchant?.merchant?.place
                              ? `${shipment?.merchant?.merchant?.place?.en_name} / ${shipment?.merchant?.merchant?.place?.ar_name}`
                              : "-"
                          }
                        />
                        <KV
                          k={t("Longitude")}
                          v={
                            shipment?.merchant?.longitude ??
                            shipment?.merchant?.merchant?.place?.lng ??
                            "-"
                          }
                        />
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ========== Walk-in (اختياري) ========== */}
            {shipment?.is_walkin === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("Walkin Sender")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Table>
                      <TableBody>
                        <KV k={t("Name")} v={shipment?.customer_name} />
                        <KV k={t("Phone")} v={shipment?.customer_phone} />
                      </TableBody>
                    </Table>
                    <Table>
                      <TableBody>
                        <KV k={t("ID Card")} v={shipment?.customer_id_card} />
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ========== Recipient ========== */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Recipient")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Table>
                    <TableBody>
                      <KV
                        k={t("Recipient")}
                        v={shipment?.consignee?.name || "-"}
                      />
                      <KV
                        k={t("Main phone")}
                        v={shipment?.consignee?.cellphone || "-"}
                      />
                      <KV k={t("Email")} v={shipment?.consignee?.email || "-"} />
                      <KV
                        k={t("Country")}
                        v={shipment?.consignee?.country?.name || "-"}
                      />
                      <KV
                        k={t("governorate")}
                        v={
                          shipment?.consignee?.governorate
                            ? `${shipment?.consignee?.governorate?.en_name} / ${shipment?.consignee?.governorate?.ar_name}`
                            : "-"
                        }
                      />
                    </TableBody>
                  </Table>

                  <Table>
                    <TableBody>
                      <KV
                        k={t("Place")}
                        v={
                          shipment?.consignee?.place
                            ? `${shipment?.consignee?.place?.en_name} / ${shipment?.consignee?.place?.ar_name}`
                            : "-"
                        }
                      />
                      <KV
                        k={t("City")}
                        v={shipment?.consignee?.city?.name || "-"}
                      />
                      <KV
                        k={t("Zipcode")}
                        v={shipment?.consignee?.zipcode || "-"}
                      />
                      <KV
                        k={t("Address")}
                        v={shipment?.consignee?.address || "-"}
                      />
                      <KV
                        k={t("Zone")}
                        v={shipment?.shipment_information?.zone?.name || "-"}
                      />
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* ========== Product Information ========== */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Product Information")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Product")}</TableHead>
                      <TableHead>{t("Category")}</TableHead>
                      <TableHead>{t("Quantity")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(shipment?.shipment_items) &&
                    shipment.shipment_items.length > 0 ? (
                      shipment.shipment_items.map((product, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{product?.name ?? "-"}</TableCell>
                          <TableCell>{product?.category ?? "-"}</TableCell>
                          <TableCell>{product?.quantity ?? "-"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-muted-foreground"
                        >
                          {t("No Products")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* ========== Core Log ========== */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Core Log")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Table>
                    <TableBody>
                      <KV k={t("Pickup Time")} v={shipment?.pickup_time || "-"} />
                      <KV
                        k={t("Package Status")}
                        v={shipment?.shipment_histories?.[0]?.type || "-"}
                      />
                      <KV k={t("From")} v={shipment?.from || "-"} />
                      <KV k={t("Arrive Time")} v={shipment?.arrive_time || "-"} />
                      <KV
                        k={t("Package Exception")}
                        v={shipment?.package_exception || "-"}
                      />
                      <KV k={t("Final")} v={shipment?.final || "-"} />
                      <KV k={t("OFD Date")} v={shipment?.ofd_date || "-"} />
                    </TableBody>
                  </Table>

                  <Table>
                    <TableBody>
                      <KV
                        k={t("Delivery Exception")}
                        v={shipment?.delivery_exception || "-"}
                      />
                      <KV k={t("Current")} v={shipment?.current || "-"} />
                      <KV k={t("Load Time")} v={shipment?.load_time || "-"} />
                      <KV
                        k={t("OFD Times")}
                        v={shipment?.shipment_delivery?.ofd_count || "-"}
                      />
                      <KV
                        k={t("Launch RTO Time")}
                        v={shipment?.launch_rto_time || "-"}
                      />
                      <KV
                        k={t("RTO Load Time")}
                        v={shipment?.rto_load_time || "-"}
                      />
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* ========== Ra7al Info (Dimensions) ========== */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Ra7al Info")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Table>
                    <TableBody>
                      <KV k={t("Owner")} v={shipment?.merchant?.name || "-"} />
                      <KV k={t("Customer ShipmentNo")} v={"-"} />
                      <KV
                        k={t("Length")}
                        v={shipment?.shipment_information?.length || "-"}
                      />
                    </TableBody>
                  </Table>
                  <Table>
                    <TableBody>
                      <KV
                        k={t("Width")}
                        v={shipment?.shipment_information?.width || "-"}
                      />
                      <KV
                        k={t("Height")}
                        v={shipment?.shipment_information?.height || "-"}
                      />
                      <KV
                        k={t("Weight")}
                        v={shipment?.shipment_information?.weight || "-"}
                      />
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* ========== Transactions ========== */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Transactions")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("From")}</TableHead>
                      <TableHead>{t("To")}</TableHead>
                      <TableHead>{t("Amount")}</TableHead>
                      <TableHead>{t("Type")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(shipment?.transactions) &&
                    shipment.transactions.length > 0 ? (
                      shipment.transactions.map((tr, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{tr?.from?.name ?? "-"}</TableCell>
                          <TableCell>{tr?.to?.name ?? "-"}</TableCell>
                          <TableCell>{tr?.amount ?? "-"}</TableCell>
                          <TableCell>{humanizeText(tr?.type) ?? "-"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground"
                        >
                          {t("No Transactions")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* ========== History Logs ========== */}
            <Card>
              <CardHeader>
                <CardTitle>{t("History Logs")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Action")}</TableHead>
                      <TableHead>{t("Description")}</TableHead>
                      <TableHead>{t("Operator")}</TableHead>
                      <TableHead>{t("Operation Hub")}</TableHead>
                      <TableHead>{t("Proof")}</TableHead>
                      <TableHead>{t("Time")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(shipment?.shipment_histories) &&
                    shipment.shipment_histories.length > 0 ? (
                      shipment.shipment_histories.map((history, idx) => {
                        let truckBarcode = null;
                        try {
                          const d = history?.data
                            ? JSON.parse(history.data)
                            : null;
                          truckBarcode = d?.truck_barcode || null;
                        } catch (_) {}
                        return (
                          <TableRow key={idx}>
                            <TableCell>{history?.name ?? "-"}</TableCell>
                            <TableCell>
                              {history?.description ?? "-"}
                              {history?.name === "LOADED" && truckBarcode && (
                                <>
                                  <br />
                                  <a
                                    className="text-blue-600 underline hover:text-blue-800 transition-colors"
                                    target="_blank"
                                    href={`/trucks/view/${truckBarcode}`}
                                    rel="noreferrer"
                                  >
                                    Truck
                                  </a>
                                </>
                              )}
                            </TableCell>
                            <TableCell>
                              {history?.operatorInfo ?? "-"}
                            </TableCell>
                            <TableCell>
                              {history?.operation_hub_name ?? "-"}
                            </TableCell>
                            <TableCell>
                              {history?.proof && (
                                <ImagePreview src={history.proof} alt="Proof" />
                              )}
                            </TableCell>
                            <TableCell>{history?.time ?? "-"}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground"
                        >
                          {t("No shipment histories found")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Close")}
          </Button>
          {/* <Button variant="edit" onClick={() => onReschedule?.(row)}>
            {t("Reschedule")}
          </Button>
          <Button
            variant="show"
            onClick={() => window.open(`/shipments/${row?.id}`, "_blank")}
          >
            {t("Open Shipment Page")}
          </Button> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NDRView;
