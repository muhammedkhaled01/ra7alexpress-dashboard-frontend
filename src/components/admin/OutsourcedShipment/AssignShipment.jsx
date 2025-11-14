import React, { useEffect, useState } from "react";
import axiosMerchant from "@/axios";
import Barcode from "react-barcode";
import { useTranslation } from "react-i18next";
import PageTitle from "../Layouts/PageTitle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeIcon,
  LucideLoader,
  Plus,
  PrinterIcon,
  RefreshCcw,
  Search,
  TrashIcon,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loader from "@/components/Loader";
import { can, driverName, handleError, isAuthorized, printLabel } from "@/utils/helpers";
import { useDispatch, useSelector } from "react-redux";
import Select from "@/components/misc/Select";
import { getDrivers } from "@/stores/features/ajaxFeature";
import toast from "react-hot-toast";
import NoRecordFound from "@/components/NoRecordFound";
import { useNavigate } from "react-router-dom";

function AssignShipment() {
  const [shipments, setShipments] = useState(null);
  const [trackingNo, setTrackingNo] = useState("");
  const [driver, _setDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [count, setCount] = useState("");

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const drivers = useSelector((store) => store.ajax.drivers);

  useEffect(() => {
    if (!drivers) dispatch(getDrivers());
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!trackingNo || trackingNo.trim() === "") {
      toast.error(t("Please insert a tracking no"));
      return;
    }
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.post(`shipments/assign-shipment`, {
        tracking_no: trackingNo,
        driver_id: driver.value,
      });
      setShipments(response.data.data.driver_shipments);
      setCount(response.data.data.count);
    } catch (error) {
      handleError(error);
    } finally {
      setTrackingNo("");
      setLoading(false);
      document.getElementById("trackingNo")?.focus();
    }
  };

  const handleRefresh = () => {
    setShipments(null);
    setTrackingNo("");
    setDriver(null);
    setRefreshBtn(false);
  };

  const setDriver = (e) => {
    _setDriver(e);
    setRefreshBtn(true);
  };

  // const handlePrint = async (shipment) => {
  //   try {
  //     setIsPrinting((prev) => ({ ...prev, [shipment.id]: true }));
  //     const response = await axiosMerchant.get(`/shipments/printShipment`, {
  //       params: { tracking_no: shipment.tracking_no },
  //     });

  //     printLabel(response.data.html); // print backend html response
  //     setIsPrinting((prev) => ({ ...prev, [shipment.id]: false }));
  //   } catch (error) {
  //     setIsPrinting((prev) => ({ ...prev, [shipment.id]: false }));
  //     console.error("Error fetching shipment data for printing:", error);
  //   }
  // };

  const navigate = useNavigate()

  const canAccess = can("Assign Shipment access")
  
  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <PageTitle
        title={
          `${t("Assign Shipment to Driver")}${driver && driver.label ? ` - ${driver.label}` : ""
          } | ${t("Shipment Count")}: ${count ? `${count}` : ""}`
        }
      />
      <div className="flex flex-col space-y-4 mt-2">
        <div className="flex flex-col md:flex-row w-full md:gap-x-4 space-y-2 md:space-y-0">
          <form
            className="flex w-full items-center gap-x-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(e);
            }}
          >
            {driver && (
              <Input
                type="text"
                id="trackingNo"
                placeholder={t("Search by tracking ID")}
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch(e);
                  }
                }}
                className="flex-grow"
              />
            )}
            {!driver && (
              <div className="w-full">
                <Select
                  name="driver_id"
                  value={driver}
                  onChange={(e) => setDriver(e)}
                  options={drivers?.map((driver) => ({
                    value: driver.id,
                    label: driverName(driver),
                  }))}
                  className="w-full"
                  placeholder={t("Select Driver...")}
                  required
                />
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-x-2"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </form>

          {refreshBtn && (
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        <hr />
        {shipments ? (
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">#</TableHead>
                  <TableHead>{t("Tracking Number")}</TableHead>
                  <TableHead>{t("Assigned by")}</TableHead>
                  <TableHead>{t("Assigned at")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : shipments && shipments.length > 0 ? (
                  shipments.map((shipment, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{shipment.shipment?.tracking_no}</TableCell>
                      <TableCell>{shipment.assigned_by?.name}</TableCell>
                      <TableCell>{shipment.assigned_at}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">
                      <NoRecordFound />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p>{loading ? <Loader /> : t("No shipment found.")}</p>
        )}
      </div>
    </div>
  );
}

export default AssignShipment;
