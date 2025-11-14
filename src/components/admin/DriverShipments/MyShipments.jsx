import React, { useState, useEffect } from "react";
import axiosMerchant from "@/axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import Select from "@/components/misc/Select";

import Loader from "@/components/Loader";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import View from "./DriverContact";
import { getSetting, handleError, hasRole } from "@/utils/helpers";
import { Loader2 } from "lucide-react";
import { getUser } from "@/stores/features/authFeature";
import {
  getDeliveryExceptions,
  getSystemDeliveryExceptions,
} from "@/stores/features/ajaxFeature";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";

function MyShipments() {
  const [activeTab, setActiveTab] = useState("pending");
  const [data, setData] = useState({ pending: [], signed: [] });
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [shipmentAmount, setShipmentAmount] = useState(null);

  const [selectedException, setSelectedException] = useState(null);
  const [futureDeliveryDate, setFutureDeliveryDate] = useState("");

  const [bankTransfer, setBankTransfer] = useState(false);
  const [cash, setCash] = useState(false);

  const [error, setError] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const [returnStatus, setReturnStatus] = useState(null);

  const { t } = useTranslation();
  const dispatch = useDispatch();

  const user = useSelector((store) => store.auth.user);
  const deliveryExceptions = useSelector(
    (store) => store.ajax.deliveryExceptions
  );
  const systemDeliveryExceptions = useSelector(
    (store) => store.ajax.systemDeliveryExceptions
  );

  const driver_call_count = getSetting("driver_call_count");

  const fetchShipments = async (type) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosMerchant.get(`/driver/shipments/my-shipments/${type}`);
      setData((prev) => ({ ...prev, [type]: response.data.data }));
      console.log(response.data.data)
    } catch (err) {
      setError(t("Error fetching data."));
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    const form = new FormData(e.currentTarget);
    if (selectedShipment.payment_type === "Paid" || selectedShipment.payment_type === "PPD") {
      try {
        form.append("shipment_id", selectedShipment.id);
        const response = await axiosMerchant.post(`/driver/shipments/deliver`, form);
        toast.success(response.data.message);
        fetchShipments(activeTab);
      } catch (err) {
        handleError(err);
      }
    } else if (selectedShipment.payment_type == "COD") {
      try {
        form.append("shipment_id", selectedShipment.id);
        const response = await axiosMerchant.post(`/driver/shipments/deliver`, form);
        toast.success(response.data.message);
        fetchShipments(activeTab);
      } catch (err) {
        handleError(err);
      }
    }

    setBtnLoading(false);
  };

  const handleConfirm = async (trackingNo) => {
    try {
      const response = await axiosMerchant.post("/shipments/confirm-assign-shipment", {
        tracking_no: trackingNo,
        driver_id: user?.driver.user_id,
      });
      toast.success(response.data.message);
      fetchShipments(activeTab);
    } catch (error) {
      console.error("Error confirming shipment:", error);
      toast.success(response.data.message);
    }
  };

  const handleReturn1 = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    const form = new FormData(e.currentTarget);
    form.append("shipment_id", selectedShipment.shipment_id);

    try {
      let return_status = selectedException.name

      let api = "";
      if (return_status == "NO_ANSWER") {
        api = "no_answer";
      } else if (return_status == "FUTURE_DELIVERY") {
        api = "future_delivery";
        form.append('future_delivery_date', futureDeliveryDate)
      } else {
        api = "general_exception";
      }


      console.log(return_status)
      const response = await axiosMerchant.post(`driver/shipments/return/${api}`, form);
      toast.success(response.data.message);
      setSelectedShipment(null);
    } catch (err) {
      handleError(err);
    } finally {
      fetchShipments(activeTab);
      setBtnLoading(null);
      setReturnStatus(null);
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    const form = new FormData();

    let return_status = selectedException.value

    const future_delivery_date = e.target.elements.future_delivery_date?.value;
    const proofFile = e.target.elements.proof?.files[0];

    form.append("delivery_exception", return_status);


    if (proofFile) {
      form.append("proof", proofFile);
    }

    if (future_delivery_date) {
      form.append('future_delivery_date', future_delivery_date);
    }


    form.append('tracking_no', selectedShipment.tracking_no);

    try {
      const response = await axiosMerchant.post(`driver/shipments/return`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success(response.data.message);
      setSelectedShipment(null);
    } catch (err) {
      handleError(err);
    } finally {
      fetchShipments(activeTab);
      setBtnLoading(false);
      setReturnStatus(null);
    }
  };

  useEffect(() => {
    fetchShipments(activeTab);
    if (!user) dispatch(getUser());
    if (!deliveryExceptions) dispatch(getDeliveryExceptions());
    if (!systemDeliveryExceptions) dispatch(getSystemDeliveryExceptions());
  }, [activeTab]);

  const openViewDialog = (record) => {
    setSelectedShipment(record);
    setViewDialogOpen(true);
  };

  const closeViewDialog = () => {
    setSelectedShipment(null);
    setViewDialogOpen(false);
  };

  const exceptions = [
    {
      label: "Delivery Exceptions",
      options: deliveryExceptions
        ? deliveryExceptions.map((deliveryException) => ({
          value: deliveryException.name,
          label: deliveryException.name,
        }))
        : [],
    },
    // {
    //   label: "System Delivery Exceptions",
    //   options: systemDeliveryExceptions
    //     ? Object.entries(systemDeliveryExceptions).map(([key, exception]) => ({
    //         value: key,
    //         label: exception.label,
    //         name: exception.name,
    //       }))
    //     : [],
    // },
  ];



  const [isPaymentValid, setIsPaymentValid] = useState(false);

  useEffect(() => {
    if (selectedShipment) {
      setShipmentAmount(selectedShipment.amount);
    }
  }, [selectedShipment]);

  useEffect(() => {
    const cashValue = parseFloat(cash) || 0;
    const bankTransferValue = parseFloat(bankTransfer) || 0;
    const totalPayment = cashValue + bankTransferValue;
    console.log(totalPayment, parseFloat(shipmentAmount));
    setIsPaymentValid(totalPayment === parseFloat(shipmentAmount));
  }, [cash, bankTransfer, shipmentAmount]);

  const navigate = useNavigate()

  const canAccess = hasRole("Driver")

  if (!canAccess) {
    return navigate("/unauthorized");
  }


  const renderTable = (shipments) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell>{t("Tracking No")}</TableCell>
          <TableCell>{t("Amount")}</TableCell>
          <TableCell>{t("Payment Type")}</TableCell>
          <TableCell>{t("Status")}</TableCell>
          <TableCell>{t("Assigned At")}</TableCell>
          {activeTab === "pending" && (
            <TableCell>{t("Actions")}</TableCell>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {shipments?.length > 0 ? (
          shipments.map((shipment) => (
            <TableRow key={shipment.id}>
              <TableCell>{shipment?.tracking_no || t("N/A")}</TableCell>
              <TableCell>{shipment?.amount || t("N/A")}</TableCell>
              <TableCell>{shipment?.payment_type || t("N/A")}</TableCell>
              <TableCell>{shipment?.status || t("N/A")}</TableCell>
              <TableCell>
                {shipment
                  ? new Date(shipment?.current_assignment?.assigned_at).toLocaleString()
                  : t("Not Assigned")}
              </TableCell>
              <TableCell>
                {activeTab === "pending" ? (
                  <Button
                    className="btn btn-warning mr-2"
                    onClick={() => handleConfirm(shipment?.tracking_no)}
                  >
                    {t("Confirm")}
                  </Button>
                ) : (
                  <div className="flex">
                    {activeTab === "signed" && (
                      <Button
                        className="btn btn-primary mr-2"
                        onClick={() => openViewDialog(shipment)}
                      >
                        {t("Contact Customer")}
                      </Button>)}

                    {/* Deliver Case */}
                    <Dialog className="">
                      {activeTab === "signed" && (
                        <DialogTrigger className="">
                          <Button
                            className="btn btn-secondary"
                            onClick={() => setSelectedShipment(shipment)}
                          >
                            {t("Deliver")}
                          </Button>
                        </DialogTrigger>)}
                      {selectedShipment?.id === shipment.id && (
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {t(
                                shipment.payment_type == "Paid"
                                  ? "Proof of Delivery"
                                  : "Confirm Delivery"
                              )}
                            </DialogTitle>
                          </DialogHeader>
                          {shipment.payment_type == "COD" ? (
                            <span>{t("Please confirm the delivery The Delivery Amount is: " + shipment.amount)}</span>
                          ) : (
                            <span>{t("Please confirm the delivery The Delivery")}</span>
                          )}

                          <form
                            onSubmit={handleDeliver}
                            encType="form-data/multipart"
                          >
                            {shipment.payment_type == "COD" && (
                              <>
                                <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 mt-2 mb-2">
                                  <div>
                                    <label htmlFor="payment_cash">
                                      {t("Cash")}:
                                    </label>
                                    <Input
                                      id="payment_cash"
                                      name="payment_cash"
                                      type="number"
                                      value={cash}
                                      onChange={(e) => setCash(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor="payment_bank_transfer">
                                      {t("Bank Transfer")}:
                                    </label>
                                    <Input
                                      id="payment_bank_transfer"
                                      name="payment_bank_transfer"
                                      type="number"
                                      value={bankTransfer}
                                      onChange={(e) =>
                                        setBankTransfer(e.target.value)
                                      }
                                    />
                                  </div>
                                </div>
                                <div>
                                  <strong>{t("Note")}</strong>
                                  <Textarea name="description"></Textarea>
                                </div>
                              </>
                            )}
                            {shipment.payment_type == "Paid" || shipment.payment_type == "PPD" && (
                              <Card>
                                <CardContent>
                                  {shipment.fee_payer === "customer" && (
                                    <div className="mt-4">
                                      <label className="block text-sm font-medium mb-2">
                                        {t("Customer Delivery Fees")}: {shipment.delivery_fee}
                                      </label>
                                      <Input
                                        type="number"
                                        name="customer_delivery_fee"
                                        className="form-input w-full"
                                      />
                                    </div>
                                  )}
                                  <div className="mt-4">
                                    <label className="block text-sm font-medium mb-2">
                                      {t("upload-file")}
                                    </label>
                                    <Input
                                      type="file"
                                      name="proof"
                                      className="form-input w-full"
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            <div className="flex justify-end mt-6">
                              <Button
                                variant="destructive"
                                className="mr-2"
                                onClick={() => setSelectedShipment(null)}
                              >
                                {t("Cancel")}
                              </Button>
                              <Button
                                className="btn btn-primary"
                                type="submit"
                                disabled={!isPaymentValid || btnLoading}
                              >
                                {btnLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  t("Submit")
                                )}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      )}
                    </Dialog>
                    &nbsp;&nbsp;
                    {/* Return Case */}
                    <Dialog>
                      {activeTab === "signed" && (<DialogTrigger>
                        <Button
                          className="btn btn-secondary disabled:cursor-not-allowed"
                          onClick={() => setSelectedShipment(shipment)}
                        // disabled={shipment?.shipment_delivery?.driver_call_count < driver_call_count}
                        >
                          {t("Return")}
                        </Button>
                      </DialogTrigger>)}
                      {selectedShipment?.id === shipment.id && (
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t("Return Shipment")}</DialogTitle>
                            <DialogDescription>
                              {t(
                                "Please provide a reason for the return and upload supporting evidence."
                              )}
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            encType="form-data/multipart"
                            onSubmit={handleReturn}
                          >
                            <Card>
                              <CardContent>
                                <div className="mt-4">
                                  <label className="block text-sm font-medium mb-2">
                                    {t("Reason for Return")}
                                  </label>
                                  <Select
                                    name="delivery_exception"
                                    options={exceptions}
                                    onChange={(option) =>
                                      setSelectedException(option)
                                    }
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    value={selectedException}
                                  />
                                </div>
                                {selectedException &&
                                  selectedException.value ===
                                  "FUTURE_DELIVERY" && (
                                    <div className="mt-4">
                                      <label
                                        htmlFor="future_delivery_date"
                                        className="block text-sm font-medium mb-2"
                                      >
                                        {t("Future Delivery Date")}
                                      </label>
                                      <Input
                                        id="future_delivery_date"
                                        name="future_delivery_date"
                                        type="date"
                                        onChange={(e) => setFutureDeliveryDate(e.target.value)}
                                      />
                                      {futureDeliveryDate && (
                                        <p className="mt-2 text-sm text-gray-600">
                                          {t("Selected Date")}:{" "}
                                          {futureDeliveryDate}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                <div className="mt-4">
                                  <label className="block text-sm font-medium mb-2">
                                    {t("upload-file")}
                                  </label>
                                  <Input
                                    type="file"
                                    name="proof"
                                    className="form-input w-full"
                                  />
                                </div>
                              </CardContent>
                            </Card>
                            <div className="flex justify-end mt-6">
                              <Button
                                variant="destructive"
                                className="mr-2"
                                onClick={() => setSelectedShipment(null)}
                              >
                                {t("Cancel")}
                              </Button>
                              <Button
                                className="btn btn-primary"
                              // disabled={
                              //   btnLoading ||
                              //   (returnStatus === "NO_ANSWER" &&
                              //     shipment?.shipment?.shipment_delivery
                              //       ?.driver_call_count <
                              //     driver_call_count)
                              // }
                              >
                                {btnLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  t("Submit")
                                )}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      )}
                    </Dialog>
                  </div>
                )}
              </TableCell>

            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan="6">{t("No shipments found.")}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">{t("My Shipments")}</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">{t("To Confirm")}</TabsTrigger>
          <TabsTrigger value="signed">{t("Confirmed")}</TabsTrigger>
          <TabsTrigger value="completed">{t("Completed")}</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          {loading ? (
            <Loader />
          ) : error ? (
            <p>{error}</p>
          ) : (
            renderTable(data.pending)
          )}
        </TabsContent>
        <TabsContent value="signed">
          {loading ? (
            <Loader />
          ) : error ? (
            <p>{error}</p>
          ) : (
            renderTable(data.signed)
          )}
        </TabsContent>
        <TabsContent value="completed">
          {loading ? (
            <Loader />
          ) : error ? (
            <p>{error}</p>
          ) : (
            renderTable(data.completed)
          )}
        </TabsContent>
      </Tabs>
      {viewDialogOpen && (
        <View
          record={selectedShipment}
          onClose={closeViewDialog}
          fetchShipments={fetchShipments}
        />
      )}
    </div>
  );
}

export default MyShipments;
