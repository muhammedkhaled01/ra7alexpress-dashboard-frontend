import React, { useEffect, useState } from "react";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import PageTitle from "../Layouts/PageTitle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loader from "@/components/Loader";
import { can, handleError, isAuthorized, printLabel } from "@/utils/helpers";
import { useDispatch, useSelector } from "react-redux";
import { getDrivers } from "@/stores/features/ajaxFeature";
import toast from "react-hot-toast";
import NoRecordFound from "@/components/NoRecordFound";
import { useNavigate } from "react-router-dom";

function AssignShipmentToShelf() {
  const [shipments, setShipments] = useState(null);
  const [trackingNo, setTrackingNo] = useState("");
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshBtn, setRefreshBtn] = useState(false);

  const [links, setLinks] = useState(null);

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const drivers = useSelector((store) => store.ajax.drivers);

  useEffect(() => {
    if (!drivers) dispatch(getDrivers());
    fetchAssignedShipments();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (
      (!trackingNo || trackingNo.trim() === "") &&
      (!barcode || barcode.trim() === "")
    ) {
      toast.error(t("Please fill in the data"));
      return;
    }
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.post(`assign_shipment_to_shelf/store`, {
        tracking_no: trackingNo,
        barcode: barcode,
      });
      setShipments(response.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
      fetchAssignedShipments();
    }
  };

  const handleRefresh = () => {
    setRefreshBtn(false);
    setTrackingNo("");
    setBarcode("");
  };

  const fetchAssignedShipments = async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(
        `assign_shipment_to_shelf?page=${pageNumber}`
      );
      setLinks(response.data.data.links);
      setShipments(response.data.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate()

  const canAccess = can("Shelf access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <PageTitle
        title={
          `${t("Assign Shipment to Shelf")}${barcode ? ` | ${t("Shelf")}: ${barcode}` : ""}`
        }
      />
      <div className="flex flex-col space-y-4 mt-2">
        <div className="flex flex-col md:flex-row w-full md:space-x-4 space-y-2 md:space-y-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(e);
            }}
            className="flex w-full items-center gap-x-2"
          >
            {barcode && (
              <Input
                type="text"
                placeholder={t("Scan Shipment Tracking No")}
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
            {!barcode && (
              <div className="w-full">
                <Input
                  type="text"
                  placeholder={t("Shelf Barcode")}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  // onKeyDown={(e) => {
                  //   if (e.key === "Enter") {
                  //     e.preventDefault();
                  //     handleSearch(e);
                  //   }
                  // }}
                  className="flex-grow"
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

          {refreshBtn ||
            (barcode && (
              <Button type="button" variant="refresh" onClick={handleRefresh}>
                <RefreshCcw className="w-4 h-4" />
              </Button>
            ))}
        </div>

        <hr />
        {shipments ? (
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">#</TableHead>
                  <TableHead>{t("Tracking Number")}</TableHead>
                  <TableHead>{t("Shelf")}</TableHead>
                  <TableHead>{t("Barcode")}</TableHead>
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
                      <TableCell>{shipment.shelf?.location}</TableCell>
                      <TableCell>{shipment.shelf?.barcode}</TableCell>
                      <TableCell>{shipment.assigned_by?.name}</TableCell>
                      <TableCell>
                        {new Date(shipment.created_at).toLocaleString()}
                      </TableCell>
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

export default AssignShipmentToShelf;
