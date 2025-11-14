import React, { useEffect, useState } from "react";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import PageTitle from "../Layouts/PageTitle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, RefreshCcw, Eye } from "lucide-react";
import MerchantShipmentsView from "./MerchantShipmentsView";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loader from "@/components/Loader";
import {
  can,
  merchantName,
  driverName,
  handleError,
  printLabel,
} from "@/utils/helpers";
import { useDispatch, useSelector } from "react-redux";
import Select from "@/components/misc/Select";
import { getMerchants, getDrivers } from "@/stores/features/ajaxFeature";
import toast from "react-hot-toast";
import NoRecordFound from "@/components/NoRecordFound";
import { useNavigate } from "react-router-dom";

function PickupAssignShipment() {
  const [shipments, setShipments] = useState(null);
  const [trackingNo, setTrackingNo] = useState("");
  const [driver, _setDriver] = useState(null);
  const [shipmentsMerchant, setShipmentsMerchant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  const { t } = useTranslation();
  const dispatch = useDispatch();

  const drivers = useSelector((store) => store.ajax.drivers);
  const merchants = useSelector((store) => store.ajax.merchants);

  useEffect(() => {
    if (!drivers) dispatch(getDrivers());
    if (!merchants) dispatch(getMerchants());
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!trackingNo || trackingNo.trim() === "") {
      toast.error(t("Please insert a tracking no"));
      return;
    }
    
    if (!driver) {
      toast.error(t("Please select a driver"));
      return;
    }

    setLoading(true);
    setRefreshBtn(true);

    try {
      const response = await axiosMerchant.post(`shipments/assign-shipment`, {
        tracking_no: trackingNo,
        driver_id: driver.value,
      });
      setShipments(response.data.data);
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
    // setMerchant(null)
    setRefreshBtn(false);
  };

  const setDriver = (e) => {
    _setDriver(e);
    setRefreshBtn(true);
    fetchShipmentMerchants();
  };

  // const setMerchant = async (e) => {
  //   _setMerchant(e)
  //   setRefreshBtn(true)
  //   fetchMerchantShipments(e.value)
  // }



  const fetchMerchantShipments = async (id) => {
    setLoading(true);
    const response = await axiosMerchant.get(
      `merchant_pickup_shipments/merchant_created_shipments/${id}`
    );
    setShipments(response.data.data);
    setLoading(false);
  };

  const fetchShipmentMerchants = async (id) => {
    setLoading(true);
    const response = await axiosMerchant.get(
      `merchant_pickup_shipments/merchant_with_created_shipments`
    );
    setShipmentsMerchant(response.data.data);
    console.log(response.data.data);
    setLoading(false);
  };

  const assignShipments = async (merchant) => {
    setBtnLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.post(`merchant_pickup_shipments/store`, {
        driver_id: driver.value,
        merchant_id: merchant.merchant.id,
      });
      setShipments(response.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      fetchShipmentMerchants();
      setTrackingNo("");
      setBtnLoading(false);
      document.getElementById("trackingNo")?.focus();
    }
  };

  const navigate = useNavigate()

  const canAccess = can("Assign Pickup Task access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <PageTitle
        title={
          driver && driver.label
            ? t("Assign Pickup Tasks to Driver") + ` - ${t("Driver")}: ${driver.label}`
            : t("Assign Pickup Tasks to Driver")
        }
      />
      <div className="flex flex-col space-y-4 mt-2">
        <div className="flex flex-col md:flex-row w-full md:space-x-4 space-y-2 md:space-y-0">
          <form
            className="flex w-full items-center gap-x-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(e);
            }}
          >
            {!driver && (
              <div className="w-full">
                <Select
                  name="driver_id"
                  value={driver}
                  onChange={(e) => setDriver(e)}
                  options={drivers?.map((driver) => ({
                    value: driver.id,
                    label: driver.name,
                  }))}
                  className="w-full"
                  placeholder={t("Driver")}
                  required
                />
              </div>
            )}
            {/* {driver && !merchant &&
              <div className="w-full">
                <Select
                  name="merchant_id"
                  value={merchant}
                  onChange={e => setMerchant(e)}
                  options={merchants?.map((merchant) => ({ value: merchant.id, label: merchant.name }))}
                  className="w-full"
                  required
                />
              </div>} */}
            {/* {driver && merchant &&
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
            } */}
            {/* <Button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-x-2"
            >
              <Plus className="w-5 h-5" />
            </Button> */}
          </form>

          {refreshBtn && (
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        <hr />
        {shipmentsMerchant ? (
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">#</TableHead>
                  <TableHead>{t("Merchant")}</TableHead>
                  <TableHead>{t("Shipments")}</TableHead>
                  <TableHead>{t("View")}</TableHead>
                  <TableHead>{t("Assign")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : shipmentsMerchant && shipmentsMerchant.length > 0 ? (
                  shipmentsMerchant.map((merchant, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{merchant.merchant?.name}</TableCell>
                      <TableCell>{merchant.shipments_count}</TableCell>
                      <TableCell>
                        <MerchantShipmentsView
                          trigger={
                            <Button
                              size="icon"
                              variant="default"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          }
                          shipments={merchant.shipments}
                          merchantName={merchant.merchant?.name}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          disabled={btnLoading}
                          type="button"
                          onClick={(e) => assignShipments(merchant)}
                        >
                          {btnLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <NoRecordFound />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p>{loading ? <Loader /> : ``}</p>
        )}
      </div>
    </div>
  );
}

export default PickupAssignShipment;
