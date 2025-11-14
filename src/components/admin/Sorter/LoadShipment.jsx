import React, { useEffect, useState } from "react";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import PageTitle from "../Layouts/PageTitle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Loader from "@/components/Loader";
import {
  can,
  getDestinationShipmentCount,
  handleError,
  hasRole,
  selectTransferDestination,
  selectTransferTask,
} from "@/utils/helpers";
import toast, { ToastBar } from "react-hot-toast";
import Select from "@/components/misc/Select";
import { SelectTrigger } from "@radix-ui/react-select";
import { useNavigate } from "react-router-dom";
function LoadShipment() {
  const [shipments, setShipments] = useState(null);
  const [trackingNo, setTrackingNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [transferTask, _setTransferTask] = useState(null);
  const [truckBarcode, setTruckBarcode] = useState(null);
  const [transferDestination, setTransferDestination] = useState(null);
  const [destinations, setDestinations] = useState(null);
  const [shipmentCount, setShipmentCount] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    axiosMerchant.get("transfer_tasks/by_status/pending").then((response) => {
      setTasks(response.data.data);
      setLoading(false);
    });
  }

  const handleLoad = async (e) => {
    e.preventDefault();
    if (!trackingNo || trackingNo.trim() === "") {
      toast.error("Please insert a tracking no");
      return;
    }
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.post(`sorter/load`, {
        tracking_no: trackingNo,
        transfer_task_id: transferTask.value,
        transfer_destination_id: transferDestination.value,
        truck_barcode: truckBarcode,
      });
      setShipmentCount(response.data.data.count);
      setShipments(response.data.data.shipment);
      console.log(response.data.data);
      toast.success("Shipment Loaded Successfully.");
    } catch (error) {
      handleError(error);
    } finally {
      setTrackingNo("");
      setLoading(false);
      document.getElementById("trackingNo")?.focus();
    }
  };
  const handleRefresh = () => {
    setTrackingNo("");
    _setTransferTask(null);
    setTransferDestination(null);
    setShipmentCount(null);
    setTruckBarcode(null);
    setRefreshBtn(false);
  };

  useEffect(() => {
    if (shipmentCount == 0) {
      fetchDestinations();
    }
  }, [shipmentCount]);

  const setTransferTask = async (e) => {
    _setTransferTask(e);
    try {
      const response = await axiosMerchant.get(
        "transfer_tasks/destinations/" + e.value + "/pending"
      );
      setDestinations(response.data.data);
      if (response.data.data && response.data.data.length === 0) {
        toast.error("No destinations with pending shipments");
      }
      setRefreshBtn(true);
    } catch (e) {
      handleError(e);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate()

  const canAccess = can("Sort access") || hasRole("Sorter")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <PageTitle
        title={
          `${t("Load Shipments")} ${transferTask ? `| ${t("Task")}: ${transferTask.label}` : ``} ${transferDestination
            ? `| ${t("Destination")}: ${transferDestination.label}`
            : ``
          } ${shipmentCount
            ? `| ${t("Shipments")}: ${shipmentCount}`
            : `${transferDestination ? `| ${t("Shipment")}: No Shipments` : ``}`
          } ${truckBarcode
            ? `| ${t("Barcode")}: ${truckBarcode}`
            : ``
          }`
        }
      />
      <div className="flex flex-col space-y-4 mt-2">
        <div className="flex flex-col md:flex-row w-full md:space-x-4 space-y-2 md:space-y-0">
          <form
            className="flex w-full items-center gap-x-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleLoad(e);
            }}
          >
            {!transferTask && (
              <div className="w-full">
                <Select
                  name="transfer_task_id"
                  value={transferTask}
                  onChange={(e) => setTransferTask(e)}
                  options={tasks?.map((task) => ({
                    value: task.id,
                    label: selectTransferTask(task),
                  }))}
                  className="w-full"
                  placeholder={t("Select Task")}
                  required
                />
              </div>
            )}
            {!transferDestination && transferTask && (
              <div className="w-full">
                <Select
                  name="task_destination_id"
                  value={transferDestination}
                  onChange={(e) => {
                    console.log(e);
                    setShipmentCount(
                      getDestinationShipmentCount(destinations, e.value)
                    );
                    setTransferDestination(e);
                  }}
                  options={destinations?.map((destination) => ({
                    value: destination.id,
                    label: selectTransferDestination(destination),
                  }))}
                  className="w-full"
                  placeholder="Select Destination"
                  required
                />
              </div>
            )}

            {transferDestination && transferTask && !truckBarcode && (
              <div className="w-full">
                <Input
                  name="truck_barcode"
                  value={truckBarcode}
                  onChange={(e) => setTruckBarcode(e.target.value)}
                  placeholder="Scan Barcode of Truck"
                  required
                />
              </div>
            )}

            {transferDestination &&
              transferTask &&
              truckBarcode &&
              shipmentCount > 0 && (
                <>
                  <Input
                    type="text"
                    id="trackingNo"
                    placeholder={t("Tracking no")}
                    value={trackingNo}
                    onChange={(e) => setTrackingNo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleLoad(e);
                      }
                    }}
                    className="flex-grow"
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-x-2"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </>
              )}
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </form>
        </div>

        <hr />
        {shipments ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {t(
                  `Shipment Details ${shipments.tracking_no ? `| Shipment: ${shipments.tracking_no}` : ``
                  }`
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <strong className="text-3xl justify-self-center">{t("Shipment Loaded")}</strong>
              <br />
              <br />
            </CardContent>
          </Card>
          // <Card>
          //   <CardHeader>
          //     <CardTitle>{t("Shipment Loaded")}</CardTitle>
          //   </CardHeader>
          //   <CardContent>
          //     {/* <strong className="self-center"></strong> */}
          //   </CardContent>
          //   {/* <div className="flex justify-start p-4">
          //     <View
          //       record={shipments}
          //       tigger={
          //         <Button size="icon" className="mr-2" variant="default">
          //           <Eye className="h-6 w-6" />
          //         </Button>
          //       }
          //     />
          //     <Button
          //       onClick={() => handlePrint(shipments)}
          //       disabled={isPrinting[shipments.id]}
          //     >
          //       <PrinterIcon className="h-6 w-6" />{" "}
          //       {isPrinting[shipments.id] && (
          //         <LucideLoader className="h-4 w-4 animate-spin mr-2 inline-block" />
          //       )}
          //     </Button>
          //   </div> */}
          // </Card>
        ) : (
          <p>{loading ? <Loader /> : t("No shipment found.")}</p>
        )}
      </div>
    </div>
  );
}

export default LoadShipment;
