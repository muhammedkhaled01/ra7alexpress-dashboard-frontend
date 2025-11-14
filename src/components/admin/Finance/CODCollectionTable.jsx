import React, { useState } from "react";
import {
  CustomTable,
  CustomTableBody,
  CustomTableCell,
  CustomTableHead,
  CustomTableHeader,
  CustomTableRow,
} from "@/components/ui/CustomTable";
import NoRecordFound from "@/components/NoRecordFound";
import PropTypes from "prop-types";
import ConfirmDialog from "./ConfirmDialog";
import HoldDialog from "./HoldDialog";
import HoldingConfirmDialog from "./HoldingConfirmDialog";
import Loader from "@/components/Loader";
import moment from "@/utils/moment";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import ShipmentsDialog from "./ShipmentsDialog";
import axiosMerchant from "@/axios";
import { Loader2 } from "lucide-react";
import { formatDecimalValue } from "@/utils/helpers";
// fee-aware collectible per delivered shipment row (ro has ro.shipment + metadata)
const collectibleFor = (ro) => {
  const paymentType = String(ro.shipment?.payment_type || "").toUpperCase();
  if (paymentType !== "COD") return 0;

  const feePayer = String(ro.shipment?.fee_payer || "").toLowerCase();
  const val = parseFloat(ro.shipment?.value ?? ro.shipment?.goods_value ?? 0) || 0;
  const amt = parseFloat(ro.shipment?.amount ?? 0) || 0; // may already be value+fee in your DB
  const fee =
    parseFloat(ro.shipment?.total_delivery_fee ?? ro.shipment?.delivery_fee ?? 0) ||
    0;

  // Merchant/sender pays fee → driver collects goods value only
  if (["merchant", "sender", "shipper"].includes(feePayer)) {
    return val > 0 ? val : Math.max(0, amt - fee);
  }
  // Receiver/consignee pays fee → driver collects value + fee
  if (["receiver", "consignee", "recipient", "customer"].includes(feePayer)) {
    return amt > 0 ? amt : val + fee;
  }
  // Unknown → be conservative
  return val > 0 ? val : Math.max(0, amt - fee);
};

const normalizePm = (pm) => String(pm || "").toLowerCase();
const isCashPm = (pm) => ["cash", "cod"].includes(pm);
const isPosPm = (pm) => ["pos", "paid", "bank"].includes(pm);

const CODCollectionTable = ({
  runsheets,
  loading,
  t,
  onConfirm,
  onHold,
  isConfirmationAllowed,
  state,
  showActions = true,
  showHoldReason = true,
  showTotalAmount = true,
  showCollectionMoney = true,
  showDTO = true,
  showDifference = true,
}) => {
  const [selectedShipments, setSelectedShipments] = useState([]);
  const [shipmentsDialogOpen, setShipmentsDialogOpen] = useState(false);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [loadingButtons, setLoadingButtons] = useState({});
  const { decimalPrecision } = useSelector((state) => state.setting);

  const fetchShipments = async (runsheetId, shipmentType, buttonKey) => {
    setLoadingButtons((prev) => ({ ...prev, [buttonKey]: true }));
    setShipmentsLoading(true);

    try {
      const response = await axiosMerchant.get(
        `cod_collection/${runsheetId}/shipments/${shipmentType}`
      );
      setSelectedShipments(response.data.data);
      setDialogTitle(t(`${shipmentType} Shipments`));
      setShipmentsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching shipments:", error);
    } finally {
      setShipmentsLoading(false);
      // إزالة حالة التحميل للزر بعد الانتهاء
      setLoadingButtons((prev) => ({ ...prev, [buttonKey]: false }));
    }
  };

  const getTableHeaders = () => {
    let headers = [
      { key: "id", label: t("ID") },
      { key: "company", label: t("Company") },
      { key: "driver", label: t("Driver") },
      { key: "receive_date", label: t("Receive Date") },
      { key: "create_time", label: t("Create Time") },
      { key: "total", label: t("Total") },
      { key: "to_sign", label: t("To Sign") },
      { key: "signed", label: t("Signed") },
      { key: "holding", label: t("Holding") },
      { key: "not_signed", label: t("Not Signed") },
      { key: "returned", label: t("Returned") },
      { key: "dto", label: t("DTO to be returned") },
      { key: "difference", label: t("Different") },
      { key: "signed_money", label: t("Signed Money") },
      { key: "collection_money", label: t("Collection Money") },
      { key: "hold_reason", label: t("Hold Reason") },
      { key: "action", label: t("Action") },
    ];

    // Remove columns based on state and props
    if (state === "holding") {
      headers = headers.filter((header) =>
        [
          "id",
          "driver",
          "receive_date",
          "total",
          "signed",
          "holding",
          "not_signed",
          "returned",
          "difference",
          "signed_money",
          "collection_money",
          "action",
        ].includes(header.key)
      );
    }

    if (state === "completed") {
      headers = headers.filter(
        (header) =>
          ![
            "company",
            "receive_date",
            "create_time",
            "total",
            "to_sign",
            "holding",
          ].includes(header.key)
      );
    }

    if (!showActions) headers.pop();
    if (!showHoldReason) headers.pop();
    if (!showTotalAmount) headers.splice(14, 1);
    if (!showCollectionMoney) headers.splice(13, 1);
    if (!showDTO) headers.splice(12, 1);
    if (!showDifference) headers.splice(11, 1);

    return headers;
  };

  const renderShipmentsButton = (count, shipmentType, runsheetId) => {
    const buttonKey = `${runsheetId}-${shipmentType}`;
    const isLoading = loadingButtons[buttonKey];

    return (
      <p
        className="cursor-pointer border-b w-fit border-b-transparent hover:border-b-blue-500 transition-colors duration-300"
        onClick={() => fetchShipments(runsheetId, shipmentType, buttonKey)}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : count}
      </p>
    );
  };

  const renderTableCells = (runsheet) => {
    const totalParcels = runsheet.assigned_shipments_count || 0;
    const signedParcels = runsheet.delivered_shipments_count || 0;
    const notSignedParcels = runsheet.not_delivered_shipments_count || 0;
    const returnedParcels = runsheet.returned_shipments_count || 0;
    const holdingParcels = runsheet.holding_shipments_count || 0;
    const differenceParcels =
      totalParcels -
      (signedParcels + notSignedParcels + returnedParcels + holdingParcels);
    const codTotal = runsheet.delivered_shipments.reduce(
      (sum, ro) => sum + collectibleFor(ro),
      0
    );

    const signedMoney = (() => {
      const cash = runsheet.delivered_shipments.reduce((sum, ro) => {
        const pm = normalizePm(ro.payment_method);
        return isCashPm(pm) ? sum + collectibleFor(ro) : sum;
      }, 0);
      const pos = runsheet.delivered_shipments.reduce((sum, ro) => {
        const pm = normalizePm(ro.payment_method);
        return isPosPm(pm) ? sum + collectibleFor(ro) : sum;
      }, 0);
      const valueOnlyForMerchant = runsheet.delivered_shipments.reduce((sum, ro) => {
        const feePayer = String(ro.shipment?.fee_payer || "").toLowerCase();
        const isCOD =
          String(ro.shipment?.payment_type || "").toUpperCase() === "COD";
        const val =
          parseFloat(ro.shipment?.value ?? ro.shipment?.goods_value ?? 0) || 0;
        return isCOD && ["merchant", "sender", "shipper"].includes(feePayer)
          ? sum + val
          : sum;
      }, 0);
      return { cash, pos, total: codTotal, value: valueOnlyForMerchant };
    })();

    const collectionCash = parseFloat(
      runsheet.collection_money_cash ?? runsheet.collection_money?.cash ?? 0
    );
    const collectionPos = parseFloat(
      runsheet.collection_money_pos ?? runsheet.collection_money?.pos ?? 0
    );
    const collectionTotal = collectionCash + collectionPos;
    const differenceAmount = signedMoney.total - collectionTotal;

    const cells = [
      <CustomTableCell key="id">{runsheet.id}</CustomTableCell>,
      <CustomTableCell key="company">
        {runsheet.driver?.driver?.company?.name || t("N/A")}
      </CustomTableCell>,
      <CustomTableCell key="driver" isFixed>
        {runsheet.driver?.name}
      </CustomTableCell>,
      <CustomTableCell key="receive_date">
        {moment(runsheet.created_at).format("YYYY-MM-DD")}
      </CustomTableCell>,
      <CustomTableCell key="create_time">
        {moment(runsheet.created_at).format("HH:mm:ss")}
      </CustomTableCell>,
      <CustomTableCell key="total">
        {renderShipmentsButton(totalParcels, "assigned", runsheet.id)}
      </CustomTableCell>,
      <CustomTableCell key="to_sign">
        {renderShipmentsButton(
          totalParcels - signedParcels,
          "to_sign",
          runsheet.id
        )}
      </CustomTableCell>,
      <CustomTableCell key="signed">
        {renderShipmentsButton(signedParcels, "delivered", runsheet.id)}
      </CustomTableCell>,
      <CustomTableCell key="holding">
        {renderShipmentsButton(holdingParcels, "holding", runsheet.id)}
      </CustomTableCell>,
      <CustomTableCell key="not_signed">
        {renderShipmentsButton(notSignedParcels, "not_delivered", runsheet.id)}
      </CustomTableCell>,
      <CustomTableCell key="returned">
        {renderShipmentsButton(returnedParcels, "returned", runsheet.id)}
      </CustomTableCell>,
      <CustomTableCell key="dto">
        {runsheet.dto_to_return || 0}
      </CustomTableCell>,
      <CustomTableCell key="difference">{differenceParcels}</CustomTableCell>,
      <CustomTableCell key="signed_money">
        <div className="space-y-1">
          <p>
            {t("Cash")}:{" "}
            {formatDecimalValue(signedMoney.cash, decimalPrecision)}
          </p>
          <p>
            {t("POS")}: {formatDecimalValue(signedMoney.pos, decimalPrecision)}
          </p>
          {signedMoney.value > 0 && (
            <p>
              {t("Total Value")}:{" "}
              {formatDecimalValue(signedMoney.value, decimalPrecision)}
            </p>
          )}
          <p>
            {t("Total")}:{" "}
            {formatDecimalValue(signedMoney.total, decimalPrecision)}
          </p>
        </div>
      </CustomTableCell>,
      <CustomTableCell key="collection_money">
        <div className="space-y-1">
          <p>
            {t("Cash")}: {formatDecimalValue(collectionCash, decimalPrecision)}
          </p>
          <p>
            {t("POS")}: {formatDecimalValue(collectionPos, decimalPrecision)}
          </p>
          <p>
            {t("Total")}:{" "}
            {formatDecimalValue(collectionTotal, decimalPrecision)}
          </p>
          <p>
            {t("Difference")}:{" "}
            {formatDecimalValue(differenceAmount, decimalPrecision)}
          </p>
        </div>
      </CustomTableCell>,
      <CustomTableCell key="hold_reason">
        {runsheet.hold_reason || t("_")}
      </CustomTableCell>,
      <CustomTableCell key="action">
        <div className="flex gap-2">
          {state === "holding" && (
            <HoldingConfirmDialog
              runsheet={runsheet}
              codTotal={codTotal}
              onSubmitSuccess={onConfirm}
              disabled={!isConfirmationAllowed(runsheet)}
            />
          )}
          {state !== "holding" && onConfirm && (
            <ConfirmDialog
              runsheet={runsheet}
              codTotal={codTotal}
              onSubmitSuccess={onConfirm}
              disabled={!isConfirmationAllowed(runsheet)}
            />
          )}
          {state !== "holding" && onHold && (
            <HoldDialog
              runsheet={runsheet}
              codTotal={codTotal}
              onSubmitSuccess={onConfirm}
              variant="destructive"
              disabled={!isConfirmationAllowed(runsheet)}
            >
              {t("Hold")}
            </HoldDialog>
          )}
        </div>
      </CustomTableCell>,
    ];

    // Remove cells based on state and props
    if (state === "completed") {
      cells.splice(1, 1);
      cells.splice(2, 1);
      cells.splice(3, 1);
      cells.splice(4, 1);
      cells.splice(5, 1);
      cells.splice(6, 1);
    }

    if (!showActions) cells.pop();
    if (!showHoldReason) cells.pop();

    return cells;
  };

  const headers = getTableHeaders();

  return (
    <>
      <CustomTable>
        <CustomTableHeader>
          <CustomTableRow>
            {headers.map((header) => (
              <CustomTableHead
                key={header.key}
                isFixed={header.key === "driver"}
              >
                {header.label}
              </CustomTableHead>
            ))}
          </CustomTableRow>
        </CustomTableHeader>
        <CustomTableBody>
          {loading ? (
            <CustomTableRow>
              <CustomTableCell colSpan={headers.length} className="text-center">
                <Loader />
              </CustomTableCell>
            </CustomTableRow>
          ) : runsheets && runsheets.length > 0 ? (
            runsheets?.map((runsheet, index) => (
              <CustomTableRow key={index}>
                {renderTableCells(runsheet, index)}
              </CustomTableRow>
            ))
          ) : (
            <CustomTableRow>
              <CustomTableCell colSpan={headers.length} className="text-center">
                <NoRecordFound />
              </CustomTableCell>
            </CustomTableRow>
          )}
        </CustomTableBody>
      </CustomTable>

      <ShipmentsDialog
        isOpen={shipmentsDialogOpen}
        onClose={() => setShipmentsDialogOpen(false)}
        title={dialogTitle}
        shipments={selectedShipments}
        loading={shipmentsLoading}
        t={t}
      />
    </>
  );
};

CODCollectionTable.propTypes = {
  runsheets: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  t: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  onHold: PropTypes.func,
  isConfirmationAllowed: PropTypes.func.isRequired,
  state: PropTypes.oneOf(["pending", "holding", "completed"]).isRequired,
  showActions: PropTypes.bool,
  showHoldReason: PropTypes.bool,
  showTotalAmount: PropTypes.bool,
  showCollectionMoney: PropTypes.bool,
  showDTO: PropTypes.bool,
  showDifference: PropTypes.bool,
};

CODCollectionTable.defaultProps = {
  showActions: true,
  showHoldReason: true,
  showTotalAmount: true,
  showCollectionMoney: true,
  showDTO: true,
  showDifference: true,
};

export default CODCollectionTable;
