import React, { useEffect, useState, useMemo } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import Loader from "@/components/Loader";
import {
  capitalize,
  convertBoolean,
  formatCurrentCurrency,
  handleError,
  humanizeText,
} from "@/utils/helpers";
import ImageHoverPreview from "@/components/misc/ImageHoverPreview";
import LocationMap from "@/components/misc/LocationMap";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
// import { RefreshCcw } from "lucide-react";
import { RefreshCcw, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageProvider";
import { useSelector } from "react-redux";
import TrackingHistoryLite from "@/components/admin/Tracking/TrackingHistoryLite";
function ShipmentViewNew({
  shipment: _shipment,
  isOpen,
  setIsOpen,
  onClose,
  deleted = false,
}) {
  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState(_shipment);
  const [activeTab, setActiveTab] = useState("overview");
  const [isVertical, setIsVertical] = useState(true); // ✅ هنا مكانها الصح

  const { t } = useTranslation();
  const { language } = useLanguage();
  const { currencyEnglishName, currencyArabicName } = useSelector(
    (s) => s.setting
  );

  // ✅ trackingResult في نفس المكوّن (نسخة واحدة بس)
  const trackingResult = useMemo(() => {
    if (!shipment) return { checkpoints: [] };

    const histories = Array.isArray(shipment?.shipment_histories)
      ? shipment.shipment_histories
      : [];

    const toTitle = (s) =>
      s
        ?.replace(/_/g, " ")
        ?.toLowerCase()
        ?.replace(/\b\w/g, (m) => m.toUpperCase());

    return {
      is_external: !!shipment?.is_external,
      tracking_no: shipment?.tracking_no,
      checkpoints: histories.map((h) => ({
        code: (h?.name || h?.type || "").toUpperCase(),
        title: toTitle(h?.name || h?.type || ""),
        description: h?.description ?? "",
        time: h?.time ?? null,
        operator: h?.operatorInfo ?? null,
        hub: h?.operation_hub_name ?? null,
        proof: h?.proof ?? null,
      })),
    };
  }, [shipment]);
  const SectionCard = ({ title, icon, right, children, className = "" }) => (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {icon && <span className="text-xl">{icon}</span>}
            <span>{title}</span>
          </CardTitle>
          {right}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  const KVR = ({ label, value, boldLabel = true, align = "right" }) => {
    // لو القيمة فاضية، ماترندرش الصف أصلًا
    if (!hasVal(value)) return null;

    return (
      <div className="flex items-center justify-between py-2 border-b last:border-b-0">
        <div className={`text-sm ${boldLabel ? "font-semibold" : ""}`}>
          {label}
        </div>
        <div
          className={`text-sm text-gray-800 ${
            align === "right" ? "text-right" : ""
          }`}
        >
          {value}
        </div>
      </div>
    );
  };
  const hasVal = (v) =>
    !(
      v === undefined ||
      v === null ||
      v === "" ||
      Number.isNaN(v) ||
      v === "-"
    );

  // getter بسيط لمسار dot-notation
  const getIn = (obj, path) =>
    path
      .split(".")
      .reduce(
        (acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined),
        obj
      );

  // هل في أي قيمة “حقيقية” بين مفاتيح معيّنة
  const hasAny = (obj, keys) => keys.some((k) => hasVal(getIn(obj, k)));

  // ===== flags لكل سيكشن في الـ overview =====
  const showBasicInfo = (o) =>
    hasAny(o, [
      "payment_type",
      "delivery_fee",
      "value",
      "shipment_delivery.delivery_otp",
      "shipment_information.in_warehouse",
      "assigned_to_shelf.shelf_barcode",
      "notes",
    ]);

  const showShipper = (o) =>
    hasAny(o, [
      "shipper.name",
      "shipper.country.name",
      "shipper.state.en_name",
      "shipper.contact",
      "shipper.address",
      "shipper.city.name",
      "shipper.email",
      "shipper.district",
      "shipper.zipcode",
    ]);

  const showWalkin = (o) =>
    o?.is_walkin == 1 &&
    hasAny(o, ["customer_name", "customer_phone", "customer_id_card"]);

  const showMerchant = (o) =>
    hasAny(o, [
      "merchant.name",
      "merchant.merchant.country.name",
      "merchant.merchant.governorate.en_name",
      "merchant.merchant.state.en_name",
      "merchant.email",
      "merchant.merchant.place.en_name",
      "merchant.latitude",
      "merchant.longitude",
    ]);

  const showRecipient = (o) =>
    hasAny(o, [
      "consignee.name",
      "consignee.cellphone",
      "consignee.alternatePhone",
      "consignee.email",
      "consignee.country.name",
      "consignee.governorate.en_name",
      "consignee.state.en_name",
      "consignee.place.en_name",
      "consignee.city.name",
      "consignee.zipcode",
      "consignee.streetAddress",
      "consignee.latitude",
      "consignee.longitude",
      "shipment_information.zone.name",
    ]);

  const showProducts = (o) =>
    Array.isArray(o?.shipment_items) && o.shipment_items.length > 0;

  const showCoreLog = (o) =>
    hasAny(o, [
      "shipment_information.in_warehouse",
      "assigned_to_shelf.barcode",
      "current_assignment.driver.name",
      "shipment_histories.0.type",
      "from",
      "arrive_time",
      "package_exception",
      "final",
      "ofd_date",
      "delivery_exception",
      "current",
      "load_time",
      "shipment_delivery.ofd_count",
      "launch_rto_time",
      "rto_load_time",
    ]);

  const showParcelInfo = (o) =>
    hasAny(o, [
      "merchant.name",
      "shipment_information.length",
      "shipment_information.width",
      "shipment_information.height",
      "shipment_information.weight",
    ]);

  const showDriverLocationBox = (o) =>
    hasAny(o, [
      "current",
      "from",
      "shipment_information.zone.name",
      "current_assignment.driver.name",
    ]);

  const Pill = ({ children, tone = "blue" }) => {
    const tones = {
      blue: "bg-blue-100 text-blue-700",
      green: "bg-green-100 text-green-700",
      purple: "bg-indigo-100 text-indigo-700",
      gray: "bg-gray-100 text-gray-700",
      red: "bg-red-100 text-red-700",
      yellow: "bg-yellow-100 text-yellow-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs rounded-md font-semibold ${
          tones[tone] || tones.gray
        }`}
      >
        {children}
      </span>
    );
  };

  const QuantityChip = ({ qty }) => (
    <div className="min-w-[40px] h-8 rounded-md flex items-center justify-center bg-indigo-600 text-white text-sm font-bold">
      x{qty ?? 0}
    </div>
  );

  const SoftNote = ({ children }) => (
    <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
      {children}
    </div>
  );

  useEffect(() => {
    if (isOpen) {
      setShipment(_shipment);
      fetchShipment(_shipment?.tracking_no);
    } else {
      onClose();
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onClose, _shipment]);

  const fetchShipment = async (tracking_no) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.post(
        `${deleted ? "shipment-archive/show" : "shipments/getSingle"}`,
        {
          tracking_no,
        }
      );
      toast.success(response.data.message);
      setShipment(response.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableRefresh = () => {
    if (_shipment?.tracking_no) fetchShipment(_shipment.tracking_no);
  };

  // ====== helpers for UI only (لا تغيّر الداتا) ======
  const currencyLabel = useMemo(
    () =>
      formatCurrentCurrency(currencyEnglishName, currencyArabicName, language),
    [currencyEnglishName, currencyArabicName, language]
  );

  const financialSummary = useMemo(() => {
    const tx = Array.isArray(shipment?.transactions) ? shipment.transactions : [];
    const total = tx.reduce((acc, cur) => acc + (Number(cur?.amount) || 0), 0);
    return { tx, total };
  }, [shipment]);

  // ====== Small UI atoms ======
  const TabButton = ({ id, children }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 rounded-md text-sm font-medium border transition
        ${
          activeTab === id
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
        }`}
      type="button"
    >
      {children}
    </button>
  );

  const Badge = ({ children, color = "#e5f7ee", textColor = "#0f5132" }) => (
    <span
      style={{ backgroundColor: color, color: textColor }}
      className="inline-block text-xs px-2 py-1 rounded-md font-semibold"
    >
      {children}
    </span>
  );
  const SectionTitle = ({ children }) => (
    <div className="mt-6 mb-2 text-sm font-bold text-gray-700">{children}</div>
  );

  const Divider = () => <div className="h-px bg-gray-200 my-3" />;

  // ترتيب افتراضي للـ milestones لعرض "الخطوة القادمة" لو مش موجودة
  const MILESTONES = [
    "CREATED",
    "COLLECTED",
    "IN_WAREHOUSE",
    "LOADED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "RTO_LAUNCH",
    "RTO_DELIVERED",
  ];

  // ===== Timeline (fixed layout) =====
  function Timeline({ shipment, t, currencyLabel }) {
    const histories = Array.isArray(shipment?.shipment_histories)
      ? shipment.shipment_histories
      : [];
    const sorted = [...histories].sort(
      (a, b) => new Date(b?.time || 0) - new Date(a?.time || 0)
    );

    const presentKeys = new Set(
      sorted.map((h) => (h?.name || h?.type || "").toUpperCase())
    );
    const MILESTONES = [
      "CREATED",
      "COLLECTED",
      "IN_WAREHOUSE",
      "LOADED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "RTO_LAUNCH",
      "RTO_DELIVERED",
    ];
    let upcoming = null;
    const lastKey = sorted.length
      ? (sorted[0].name || sorted[0].type || "").toUpperCase()
      : null;
    if (lastKey) {
      const idx = MILESTONES.indexOf(lastKey);
      if (idx > -1 && idx + 1 < MILESTONES.length) {
        const nextKey = MILESTONES[idx + 1];
        if (!presentKeys.has(nextKey)) upcoming = nextKey;
      }
    }

    const items = sorted.map((h) => {
      const key = (h?.name || h?.type || "").toUpperCase();
      return {
        key,
        title: humanize(key),
        desc:
          h?.description || defaultDescription(key, shipment, t, currencyLabel),
        time: h?.time ? new Date(h.time).toLocaleString() : "",
        status: "done",
      };
    });

    if (upcoming) {
      items.unshift({
        key: upcoming,
        title: humanize(upcoming),
        desc: t("This step is coming soon"),
        time: "",
        status: "upcoming",
      });
    }

    return (
      <ul className="relative ml-4 pl-6 border-l-2 border-orange-300">
        {items.map((it, i) => (
          <TimelineItem
            key={`${it.key}-${i}`}
            item={it}
            isLast={i === items.length - 1}
          />
        ))}
      </ul>
    );
  }

  function TimelineItem({ item }) {
    const isUpcoming = item.status !== "done";
    return (
      <li className={`relative pb-8 last:pb-0`}>
        {/* الدبوس */}
        <span
          className={`absolute -left-[13px] top-0 w-7 h-7 rounded-full flex items-center justify-center ring-4 
        ${
          isUpcoming
            ? "bg-gray-200 text-gray-400 ring-gray-100"
            : "bg-orange-500 text-white ring-orange-100"
        }`}
        >
          {isUpcoming ? (
            <span className="w-2.5 h-2.5 rounded-full bg-white/70" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </span>

        <div className={`${isUpcoming ? "opacity-60" : ""}`}>
          <div className="text-[15px] font-extrabold text-slate-900 mb-1">
            {item.title}
          </div>
          <div className="text-[13px] text-slate-700">{item.desc}</div>
          {item.time && (
            <div className="mt-3 text-[12px] text-slate-500">{item.time}</div>
          )}
        </div>
      </li>
    );
  }

  // Helpers (عرض فقط)
  function humanize(key = "") {
    return key
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function defaultDescription(key, shipment, t, currencyLabel) {
    const tracking = shipment?.tracking_no ? `#${shipment.tracking_no}` : "";
    const amount =
      typeof shipment?.amount !== "undefined"
        ? `, ${t("Amount")} ${Number(shipment.amount).toFixed(3)} ${currencyLabel}`
        : "";

    switch (key) {
      case "CREATED":
        return (
          t("Shipment has been created and is heading toward destination") +
          ` ${t("Tracking")} ${tracking}${amount}`
        );
      case "COLLECTED":
        return t("Shipment has been collected from shipper.");
      case "IN_WAREHOUSE":
        return t("Shipment received in warehouse.");
      case "LOADED":
        return t("Shipment loaded to a truck / bag.");
      case "OUT_FOR_DELIVERY":
        return t("Shipment is out for delivery.");
      case "DELIVERED":
        return t("Shipment has been delivered to recipient.");
      case "RTO_LAUNCH":
        return t("Return-to-origin has been launched.");
      case "RTO_DELIVERED":
        return t("Return-to-origin delivered back.");
      default:
        return humanize(key);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={() => setIsOpen(false)}>
      <SheetContent className="w-full sm:w-[1000px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            <div className="flex flex-row-reverse justify-between items-center gap-x-2">
              <Button
                type="button"
                variant="refresh"
                onClick={handleTableRefresh}
                disabled={loading}
                className="mr-4"
              >
                <RefreshCcw className="w-4 h-4" />
              </Button>
              {t("View Shipment")} {shipment?.tracking_no}
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Tabs Header (مطابق الصور) */}
        <div className="mt-3 mb-4">
          <div className="flex items-center gap-2">
            <TabButton id="overview">{t("Overview")}</TabButton>
            <TabButton id="tracking">{t("Tracking")}</TabButton>
            <TabButton id="transactions">
              <span className="flex items-center gap-2">
                <span>$</span> {t("Transactions")}
              </span>
            </TabButton>
          </div>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <>
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 gap-4 mt-2">
                {/* Basic Information (مثل الصورة الأخيرة) */}
                <SectionCard title={t("Basic Information")} icon="📦">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-lg border">
                      <div className="p-4">
                        <KVR
                          label={t("Customer Pay Type")}
                          value={
                            <Pill
                              tone={
                                shipment?.payment_type === "Paid"
                                  ? "green"
                                  : "gray"
                              }
                            >
                              {shipment?.payment_type || "-"}
                            </Pill>
                          }
                        />
                        <KVR
                          label={t("Delivery Fee")}
                          value={`${
                            shipment?.delivery_fee > 0 ? shipment?.delivery_fee : 0
                          } ${currencyLabel}`}
                        />
                        <KVR
                          label={t("Value")}
                          value={`${
                            shipment?.value > 0 ? shipment?.value : 0
                          } ${currencyLabel}`}
                        />
                        {shipment?.status === "DELIVERED" && (
                          <KVR
                            label={t("OTP")}
                            value={shipment?.shipment_delivery?.delivery_otp}
                          />
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border">
                      <div className="p-4">
                        <KVR
                          label={t("Amount")}
                          value={`${
                            shipment?.amount > 0 ? shipment?.amount : 0
                          } ${currencyLabel}`}
                        />
                        <KVR
                          label={t("Fee Payer")}
                          value={capitalize(shipment?.fee_payer) || "-"}
                        />
                        <KVR
                          label={t("In Warehouse")}
                          value={
                            <>
                              {convertBoolean(
                                shipment?.shipment_information?.in_warehouse
                              )}
                              {shipment?.assigned_to_shelf?.shelf_barcode
                                ? ` (Shelf Barcode: ${shipment?.assigned_to_shelf?.shelf_barcode})`
                                : ``}
                            </>
                          }
                        />
                        <KVR label={t("Note")} value={shipment?.notes || "-"} />
                      </div>
                    </div>
                  </div>
                  {shipment?.notes && (
                    <div className="mt-3">
                      <SoftNote>{shipment?.notes}</SoftNote>
                    </div>
                  )}
                </SectionCard>

                {/* Shipper Information */}
                {shipment?.shipper && (
                  <SectionCard title={t("Shipper Information")} icon="📈">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="rounded-lg border p-4">
                        <KVR label={t("Name")} value={shipment?.shipper?.name} />
                        <KVR
                          label={t("Country")}
                          value={shipment?.shipper?.country?.name}
                        />
                        <KVR
                          label={t("Main phone")}
                          value={shipment?.shipper?.contact}
                        />
                        <KVR
                          label={t("State")}
                          value={
                            language === "en"
                              ? shipment?.shipper?.state?.en_name
                              : shipment?.shipper?.state?.ar_name
                          }
                        />
                        <KVR
                          label={t("Backup phone")}
                          value={shipment?.shipper?.backup_phone || "-"}
                        />
                      </div>
                      <div className="rounded-lg border p-4">
                        <KVR
                          label={t("City")}
                          value={shipment?.shipper?.city?.name}
                        />
                        <KVR
                          label={t("Email")}
                          value={shipment?.shipper?.email || "-"}
                        />
                        <KVR
                          label={t("District")}
                          value={shipment?.shipper?.district || "-"}
                        />
                        <KVR
                          label={t("Zipcode")}
                          value={shipment?.shipper?.zipcode || "-"}
                        />
                        <KVR
                          label={t("Address")}
                          value={shipment?.shipper?.address}
                        />
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* Walk-in Sender */}
                {shipment?.is_walkin == 1 && (
                  <SectionCard title={t("Walkin Sender")} icon="🧍">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="rounded-lg border p-4">
                        <KVR label={t("Name")} value={shipment?.customer_name} />
                        <KVR label={t("Phone")} value={shipment?.customer_phone} />
                      </div>
                      <div className="rounded-lg border p-4">
                        <KVR
                          label={t("ID Card")}
                          value={shipment?.customer_id_card}
                        />
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* Merchant */}
                {shipment?.merchant && (
                  <SectionCard title={t("Merchant")} icon="👤">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="rounded-lg border p-4">
                        <KVR
                          label={t("Sender")}
                          value={shipment?.merchant?.name || "-"}
                        />
                        <KVR
                          label={t("Country")}
                          value={shipment?.merchant?.merchant?.country?.name || "-"}
                        />
                        <KVR
                          label={t("governorate")}
                          value={
                            language === "en"
                              ? shipment?.merchant?.merchant?.governorate?.en_name ??
                                "-"
                              : shipment?.merchant?.merchant?.governorate?.ar_name ??
                                "-"
                          }
                        />
                        <KVR
                          label={t("State")}
                          value={
                            language === "en"
                              ? shipment?.merchant?.merchant?.state?.en_name ?? "-"
                              : shipment?.merchant?.merchant?.state?.ar_name ?? "-"
                          }
                        />
                      </div>
                      <div className="rounded-lg border p-4">
                        <KVR
                          label={t("Email")}
                          value={shipment?.merchant?.email || "-"}
                        />
                        <KVR
                          label={t("Place")}
                          value={
                            language === "en"
                              ? shipment?.merchant?.merchant?.place?.en_name ?? "-"
                              : shipment?.merchant?.merchant?.place?.ar_name ?? "-"
                          }
                        />
                        <KVR
                          label={t("Latitude")}
                          value={
                            (shipment?.merchant?.latitude ??
                              shipment?.merchant?.merchant?.place?.lat) ||
                            "-"
                          }
                        />
                        <KVR
                          label={t("Longitude")}
                          value={
                            (shipment?.merchant?.latitude ??
                              shipment?.merchant?.merchant?.place?.lng) ||
                            "-"
                          }
                        />
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* Recipient Information (نفس تقسيمة الصور) */}
                <SectionCard title={t("Recipient Information")} icon="🧾">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-lg border p-4">
                      <KVR
                        label={t("Recipient")}
                        value={shipment?.consignee?.name || "-"}
                      />
                      <KVR
                        label={t("Main phone")}
                        value={shipment?.consignee?.cellphone || "-"}
                      />
                      <KVR
                        label={t("Backup phone")}
                        value={shipment?.consignee?.alternatePhone || "-"}
                      />
                      <KVR
                        label={t("Email")}
                        value={shipment?.consignee?.email || "-"}
                      />
                      <KVR
                        label={t("Country")}
                        value={shipment?.consignee?.country?.name || "-"}
                      />
                      <KVR
                        label={t("governorate")}
                        value={
                          language === "en"
                            ? shipment?.consignee?.governorate?.en_name ?? "-"
                            : shipment?.consignee?.governorate?.ar_name ?? "-"
                        }
                      />
                      <KVR
                        label={t("State")}
                        value={
                          language === "en"
                            ? shipment?.consignee?.state?.en_name ?? "-"
                            : shipment?.consignee?.state?.ar_name ?? "-"
                        }
                      />
                    </div>
                    <div className="rounded-lg border p-4">
                      <KVR
                        label={t("Place")}
                        value={
                          language === "en"
                            ? shipment?.consignee?.place?.en_name ?? "-"
                            : shipment?.consignee?.place?.ar_name ?? "-"
                        }
                      />
                      <KVR
                        label={t("City")}
                        value={shipment?.consignee?.city?.name || "-"}
                      />
                      <KVR
                        label={t("Zipcode")}
                        value={shipment?.consignee?.zipcode || "-"}
                      />
                      <KVR
                        label={t("Address")}
                        value={shipment?.consignee?.streetAddress || "-"}
                      />
                      <KVR
                        label={t("Latitude")}
                        value={
                          (shipment?.consignee?.latitude ??
                            shipment?.consignee?.place?.lat) ||
                          "-"
                        }
                      />
                      <KVR
                        label={t("Longitude")}
                        value={
                          (shipment?.consignee?.longitude ??
                            shipment?.consignee?.place?.lng) ||
                          "-"
                        }
                      />
                      <KVR
                        label={t("Zone")}
                        value={shipment?.shipment_information?.zone?.name || "-"}
                      />
                    </div>
                  </div>
                </SectionCard>

                {/* Product Information (List ببادجات الكمية) */}
                <SectionCard title={t("Product Information")} icon="🧊">
                  <div className="space-y-3">
                    {(shipment?.shipment_items || []).map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl border p-4 bg-gradient-to-br from-indigo-50 to-white"
                      >
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-gray-500">
                            {t("Category")}: {p.category}
                          </div>
                        </div>
                        <QuantityChip qty={p.quantity} />
                      </div>
                    ))}
                    {!shipment?.shipment_items?.length && (
                      <div className="text-sm text-gray-500">
                        {t("No data")}
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* Core Log (بادجات السائق والحالة) */}
                {showCoreLog(shipment) && (
                  <SectionCard title={t("Core Log")} icon="⏱">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="rounded-lg border p-4">
                        {shipment?.shipment_information?.in_warehouse &&
                          shipment?.assigned_to_shelf && (
                            <KVR
                              label={t("Assigned to Shelf")}
                              value={shipment?.assigned_to_shelf?.barcode || "-"}
                            />
                          )}
                        {!shipment?.shipment_information?.in_warehouse &&
                          shipment?.current_assignment && (
                            <div className="flex items-center justify-between py-2 border-b">
                              <div className="text-sm font-semibold">
                                {t("Currently Assigned to ")}
                              </div>
                              <Pill tone="purple">
                                {shipment?.current_assignment?.driver?.name || "-"}
                              </Pill>
                            </div>
                          )}
                        <div className="flex items-center justify-between py-2">
                          <div className="text-sm font-semibold">
                            {t("Package Status")}
                          </div>
                          <Pill tone="green">
                            {shipment?.shipment_histories?.[0]?.type || "-"}
                          </Pill>
                        </div>
                        <KVR label={t("From")} value={shipment?.from || "-"} />
                        <KVR
                          label={t("Arrive Time")}
                          value={shipment?.arrive_time || "-"}
                        />
                        <KVR
                          label={t("Package Exception")}
                          value={shipment?.package_exception || "-"}
                        />
                      </div>

                      <div className="rounded-lg border p-4">
                        <KVR label={t("Final")} value={shipment?.final || "-"} />
                        <KVR
                          label={t("OFD Date")}
                          value={shipment?.ofd_date || "-"}
                        />
                        <KVR
                          label={t("Delivery Exception")}
                          value={shipment?.delivery_exception || "-"}
                        />
                        <KVR
                          label={t("Current")}
                          value={shipment?.current || "-"}
                        />
                        <KVR
                          label={t("Load Time")}
                          value={shipment?.load_time || "-"}
                        />
                        <KVR
                          label={t("OFD Times")}
                          value={shipment?.shipment_delivery?.ofd_count || "-"}
                        />
                        <KVR
                          label={t("Launch RTO Time")}
                          value={shipment?.launch_rto_time || "-"}
                        />
                        <KVR
                          label={t("RTO Load Time")}
                          value={shipment?.rto_load_time || "-"}
                        />
                      </div>
                    </div>
                  </SectionCard>
                )}
                {/* Ra7al Information (الصندوق الوردي) */}
                {showParcelInfo(shipment) && (
                  <SectionCard title={t("Ra7al Information")} icon="🧺">
                    <div
                      className="rounded-xl p-4"
                      style={{ background: "#fde2e7" }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-lg bg-white/70 p-4">
                          <KVR
                            label={t("Owner")}
                            value={shipment?.merchant?.name || "-"}
                          />
                          <KVR label={t("Customer Shipment No")} value="-" />
                        </div>
                        <div className="rounded-lg bg-white/70 p-4">
                          <div className="text-sm font-semibold mb-2">
                            {t("Dimensions")}
                          </div>
                          <div className="text-sm text-gray-800">
                            <span className="inline-flex items-center gap-2 mr-4">
                              <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
                              {t("Length")}:{" "}
                              {shipment?.shipment_information?.length || "-"} cm
                            </span>
                            <span className="inline-flex items-center gap-2 mr-4">
                              <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                              {t("Width")}:{" "}
                              {shipment?.shipment_information?.width || "-"} cm
                            </span>
                            <span className="inline-flex items-center gap-2 mr-4">
                              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                              {t("Height")}:{" "}
                              {shipment?.shipment_information?.height || "-"} cm
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                              {t("Weight")}:{" "}
                              {shipment?.shipment_information?.weight || "-"} kg
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* Package Location (الصندوق الأزرق — نفس صورة Driver Location) */}
                <Card className="overflow-hidden">
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-white border rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📍</span>
                        <div className="text-lg font-semibold">
                          {t("Driver Location")}
                        </div>
                      </div>
                      {shipment?.current_assignment?.driver?.name && (
                        <Pill tone="blue">
                          {shipment?.current_assignment?.driver?.name}
                        </Pill>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-lg bg-white/70 p-4 border">
                        <div className="text-xs text-gray-500 mb-1">
                          {t("Current")}
                        </div>
                        <div className="font-semibold">
                          {shipment?.current || t("With Driver")}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white/70 p-4 border">
                        <div className="text-xs text-gray-500 mb-1">
                          {t("From")}
                        </div>
                        <div className="font-semibold">
                          {shipment?.from || "-"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white/70 p-4 border">
                        <div className="text-xs text-gray-500 mb-1">
                          {t("Zone")}
                        </div>
                        <div className="font-semibold">
                          {shipment?.shipment_information?.zone?.name || "-"}
                        </div>
                      </div>

                      <div className="rounded-lg bg-white/70 p-4 border">
                        <div className="text-sm">
                          {t("Driver location not available")}
                        </div>
                        {shipment?.current_assignment?.driver?.name && (
                          <div className="text-xs text-blue-600 mt-1">
                            {t("Currently Assigned to ")}
                            {shipment?.current_assignment?.driver?.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* الخريطة كما هي */}
                <LocationMap shipment={shipment} />

                {/* History Logs (بدون تغيير في الداتا، تنسيق فقط) */}
                <Card className="mt-4">
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
                        {shipment?.shipment_histories?.length ? (
                          shipment.shipment_histories.map((h, i) => (
                            <TableRow key={i}>
                              <TableCell>{h?.name ?? "Edited"}</TableCell>
                              <TableCell>
                                {h?.description ?? "-"}
                                {h?.name === "LOADED" && h?.data && (
                                  <>
                                    <br />
                                    <a
                                      className="text-blue-600 underline hover:text-blue-800 transition-colors duration-150"
                                      target="_blank"
                                      href={`/trucks/view/${
                                        JSON.parse(h?.data).truck_barcode
                                      }`}
                                    >
                                      Truck
                                    </a>
                                  </>
                                )}
                              </TableCell>
                              <TableCell>{h?.operatorInfo ?? "-"}</TableCell>
                              <TableCell>
                                {h?.operation_hub_name ?? "-"}
                              </TableCell>
                              <TableCell>
                                {h?.proof && (
                                  <ImageHoverPreview
                                    src={h.proof}
                                    alt="Proof"
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {new Date(h?.time).toLocaleString() ?? "-"}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell>
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

            {activeTab === "tracking" && (
              <div className="flex flex-col gap-5 mt-2">
                {/* Map */}
                <Card className="rounded-2xl overflow-hidden border">
                  <CardHeader className="pb-2">
                    <CardTitle>{t("Map")}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* مهم جداً: لازم ارتفاع */}
                    <div className="w-full h-[420px]">
                      <LocationMap
                        shipment={shipment}
                        /* حيلة لإجبار إعادة الريندر لما التبويب يتفتح */
                        key={`map-${shipment?.tracking_no}-${isOpen}-${activeTab}`}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Tracking History */}
                <TrackingHistoryLite
                  trackingResult={trackingResult}
                  isVertical={isVertical}
                  setIsVertical={setIsVertical}
                  title={t("Tracking History")}
                />
              </div>
            )}

            {activeTab === "transactions" && (
              <div className="grid grid-cols-1 gap-4 mt-2">
                {/* Financial Transactions (مثل الصور) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md"
                        style={{ background: "#e6fff3", color: "#14a44d" }}
                      >
                        $
                      </span>
                      {t("Financial Transactions")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Rows from shipment.transactions */}
                    {financialSummary.tx?.length ? (
                      financialSummary.tx.map((tr, i) => (
                        <div
                          key={i}
                          className="rounded-md border border-gray-200 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <Badge color="#eef2ff" textColor="#4338ca">
                              {humanizeText(tr.type)}
                            </Badge>
                            <div className="text-lg font-semibold">
                              {Number(tr.amount) || 0} {currencyLabel}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
                            <span>{tr.from?.name ?? "-"}</span>
                            <span className="mx-1">—</span>
                            <span>{tr.to?.name ?? "-"}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">
                        {t("No transactions found")}
                      </div>
                    )}

                    {/* Total box */}
                    <div
                      className="rounded-md p-4"
                      style={{
                        background: "#eafff2",
                        border: "1px solid #b8f0cf",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 flex items-center justify-center rounded-full border"
                            style={{ borderColor: "#b8f0cf" }}
                          >
                            $
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">
                              {t("Total Amount")}
                            </div>
                            <div className="text-2xl font-bold">
                              {financialSummary.total.toFixed(3)}{" "}
                              {currencyLabel}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {t("Fee Payer")}
                          </div>
                          <div className="font-semibold">
                            {capitalize(shipment?.fee_payer) || "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Raw table (أسفل الكارت كما بالصورة الثالثة) */}
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
                        {shipment?.transactions?.map((transaction, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {transaction.from?.name ?? "-"}
                            </TableCell>
                            <TableCell>{transaction.to?.name ?? "-"}</TableCell>
                            <TableCell>
                              {transaction.amount} {currencyLabel}
                            </TableCell>
                            <TableCell>
                              {humanizeText(transaction.type)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default ShipmentViewNew;
