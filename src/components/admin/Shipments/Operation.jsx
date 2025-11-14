import React, { useEffect, useState } from "react";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import PageTitle from "../Layouts/PageTitle";
import { Button } from "@/components/ui/button";
import Select from "@/components/misc/Select";
import { Textarea } from "@/components/ui/textarea";
import { useDispatch, useSelector } from "react-redux";
import { getStatuses } from "@/stores/features/ajaxFeature";
import toast from "react-hot-toast";
import { handleError, hasRole } from "@/utils/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


function Operation() {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [trackingNumbers, setTrackingNumbers] = useState("");
  const [selectedShipments, setSelectedShipments] = useState(null);
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();
  const shipment_statuses = useSelector((store) => store.ajax.shipment_statuses);
  const dispatch = useDispatch();
  const navigate = useNavigate()

  const allowed = hasRole(['Super Admin', 'Country Manager', 'Supervisor'])

  useEffect(() => {
    if (!allowed) {
      navigate("/unauthorized")
    }

    if (!shipment_statuses) {
      dispatch(getStatuses());
    }
  }, [shipment_statuses, dispatch]);



  const handleSubmit = async () => {
    if (!selectedStatus || !trackingNumbers.trim()) return;

    console.log(selectedStatus);
    setLoading(true);
    try {
      const response = await axiosMerchant.post("shipments/update_bulk_status", {
        status: selectedStatus,
        tracking_no: trackingNumbers.split(/[\s,\n]+/).filter(num => num.trim() !== ''),
      });

      console.log("Success:", response.data);
      toast.success(response.data.message);
      setTrackingNumbers("");
    } catch (error) {
      console.error("Error updating status:", error);
      handleError(error);
    } finally {
      setLoading(false);
      setSelectedShipments(null)
      setSelectedStatus(null)
    }
  };

  const handlePreview = async (e) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.post("shipments/getMultiple", {
        tracking_no: trackingNumbers.split(/[\s,\n]+/).filter(num => num.trim() !== ''),
      });
      toast.success(response.data.message);
      console.log(response.data.data);
      setSelectedShipments(response.data.data);
      setLoading(false);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackingChange = (e) => {
    const input = e.target.value;
    setTrackingNumbers(input);
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <Card className="shadow-lg rounded-xl p-4">
          <CardHeader>
            <CardTitle>{t("Update Shipment Status")}</CardTitle>
          </CardHeader>

          <CardContent>
            {selectedShipments && (
              <div className="mb-4">
                <label htmlFor="status" className="block font-medium">
                  {t("Select Operation")}
                </label>

                <Select
                  name="status"
                  options={shipment_statuses?.map((status, index) => ({
                    value: status.label,
                    label: status.label,
                  }))}
                  className="w-full mt-1"
                  onChange={(e) => setSelectedStatus(e.value)}
                />
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="tracking_no" className="block font-medium">
                {t("Enter Tracking Numbers")}
              </label>
              <Textarea
                name="tracking_no"
                value={trackingNumbers}
                onChange={handleTrackingChange}
                placeholder={t("Enter tracking numbers separated by space or comma")}
                className="w-full mt-1"
              />
            </div>
            {!selectedStatus && (
              <Button onClick={handlePreview} disabled={loading || !trackingNumbers}>
                {loading ? t("Downloading Data...") : t("Preview")}
              </Button>
            )}

            {selectedStatus && trackingNumbers && (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? t("Updating...") : t("Update Status")}
              </Button>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl p-4">
          <CardHeader>
            <CardTitle>{t("Shipments")}</CardTitle>
          </CardHeader>

          <CardContent>
            {!selectedShipments ? (
              <span>{t("Please preview shipments to see the history and status of them.")}</span>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Tracking no")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead>{t("Core Status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedShipments &&
                    selectedShipments?.map((shipment, index) => (
                      <TableRow key={index}>
                        <TableCell>{shipment.tracking_no ?? "-"}</TableCell>
                        <TableCell>{shipment.status}</TableCell>
                        <TableCell>{shipment.core_status?.name}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div >
  );
}
export default Operation;
