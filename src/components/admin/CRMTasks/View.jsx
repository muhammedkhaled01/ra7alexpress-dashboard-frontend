import React, { useEffect, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Link, useParams } from "react-router-dom";
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
import ImagePreview from "@/components/misc/ImagePreview";
import { toast } from "react-toastify";
import PageTitle from "../Layouts/PageTitle";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { useSelector } from "react-redux";
import { useLanguage } from "@/contexts/LanguageProvider";

function View({ task, isOpen, setIsOpen, onClose }) {
  const { currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting)
  const {language} = useLanguage();
  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState(task?.shipment);
  const [refresh, setRefresh] = useState(0);
  const { t } = useTranslation();
  const statusMapping = {
    Created: "created",
    "To Call": "to_call",
    Hold: "hold",
    Closed: "closed",
  };
  const reverseStatusMapping = Object.fromEntries(
    Object.entries(statusMapping).map(([k, v]) => [v, k])
  );
  const statusColors = {
    created: "bg-muted text-foreground hover:bg-muted/80 dark:bg-gray-900/70 dark:text-foreground dark:hover:bg-gray-900",
    to_call: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-100 dark:hover:bg-emerald-800",
    hold: "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800",
    closed: "bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-800 dark:text-rose-100 dark:hover:bg-rose-800",
  };
  useEffect(() => {
    if (isOpen) {
      setShipment(task?.shipment);
      fetchShipment(task?.shipment?.tracking_no);
    }
  }, [refresh, isOpen, onClose, task]);

  const fetchShipment = async (tracking_no) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.post("shipments/getSingle", {
        tracking_no: tracking_no,
      });
      toast.success(response.data.message);
      setShipment(response.data.data);
      setLoading(false);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableRefresh = () => {
    fetchShipment(task?.shipment?.tracking_no);
  };
  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="xl">
      <ModalHeader>
        <ModalTitle>
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
            View Task:
          </div>
        </ModalTitle>
      </ModalHeader>
      <ModalContent>
        {loading ? (
          <Loader />
        ) : (
          <div className="flex flex-col gap-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("Task Details")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-start gap-3">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">{t("Name")}:</span>
                    <span className="text-gray-800 dark:text-white">{task?.name ? item?.name : "No Task Name"}</span>
                  </div>
                  <div className="flex justify-start gap-3">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Title:</span>
                    <span className="text-gray-800 dark:text-white">{task?.title}</span>
                  </div>
                  <div className="flex justify-start gap-3">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Status:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-semibold ${statusColors[task?.status]}`}
                    >
                      {t(reverseStatusMapping[task?.status])}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("Shipment Details")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("Basic")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-bold">
                                {t("Tracking No")}
                              </TableCell>
                              <TableCell>{shipment?.tracking_no || "-"}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-bold">
                                {t("Customer PayType")}
                              </TableCell>
                              <TableCell>{shipment?.payment_type || "-"}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-bold">
                                {t("Delivery Fee")}
                              </TableCell>
                              <TableCell>
                                {shipment?.delivery_fee > 0 ? shipment?.delivery_fee : 0}{" "}
                                {formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-bold">
                                {t("Value")}
                              </TableCell>
                              <TableCell>
                                {shipment?.value > 0 ? shipment?.value : 0} {formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>

                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-bold">
                                {t("Amount")}
                              </TableCell>
                              <TableCell>
                                {shipment?.amount > 0 ? shipment?.amount : 0} {formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-bold">
                                {t("Fee Payer")}
                              </TableCell>
                              <TableCell>
                                {capitalize(shipment?.fee_payer) || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-bold">
                                {t("In Warehouse")}
                              </TableCell>
                              <TableCell>
                                {convertBoolean(
                                  shipment?.shipment_information?.in_warehouse
                                )}
                                {shipment?.assigned_to_shelf?.shelf.barcode
                                  ? `(Shelf Barcode: ${shipment?.assigned_to_shelf?.shelf.barcode})`
                                  : ``}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-bold">Note</TableCell>
                              <TableCell>{shipment?.notes || "-"}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {shipment && shipment.shipper && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t("Shipper")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("Shipper")}
                                </TableCell>
                                <TableCell>{shipment?.shipper?.name}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("Country")}
                                </TableCell>
                                <TableCell>
                                  {shipment?.shipper?.country?.name}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("Main phone")}
                                </TableCell>
                                <TableCell>{shipment?.shipper?.contact}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("State")}
                                </TableCell>
                                <TableCell>{shipment?.shipper?.state?.name}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("Backup phone")}
                                </TableCell>
                                <TableCell>
                                  {shipment?.shipper?.backup_phone || "-"}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>

                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("City")}
                                </TableCell>
                                <TableCell>{shipment?.shipper?.city?.name}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("Email")}
                                </TableCell>
                                <TableCell>
                                  {shipment?.shipper?.email || "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("District")}
                                </TableCell>
                                <TableCell>
                                  {shipment?.shipper?.district || "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("Zipcode")}
                                </TableCell>
                                <TableCell>
                                  {shipment?.shipper?.zipcode || "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("Address")}
                                </TableCell>
                                <TableCell>{shipment?.shipper?.address}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {shipment && shipment.is_walkin == 1 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t("Walkin Sender")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-4 text-sm">
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("Name")}
                                </TableCell>
                                <TableCell>{shipment?.customer_name}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("Phone")}
                                </TableCell>
                                <TableCell>{shipment?.customer_phone}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>

                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("ID Card")}
                                </TableCell>
                                <TableCell>{shipment?.customer_id_card}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {shipment && shipment.merchant && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t("Merchant")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("Sender")}
                                </TableCell>
                                <TableCell>{shipment?.merchant?.name || "-"}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("Country")}
                                </TableCell>
                                <TableCell>
                                  {shipment?.merchant?.merchant?.country?.name || "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("governorate")}
                                </TableCell>
                                <TableCell>
                                  {`${shipment?.merchant?.merchant?.governorate?.en_name} / ${shipment?.merchant?.merchant?.governorate?.ar_name}` ||
                                    "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("State")}
                                </TableCell>
                                <TableCell>
                                  {`${shipment?.merchant?.merchant?.state?.en_name} / ${shipment?.merchant?.merchant?.state?.ar_name}` ||
                                    "-"}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>

                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("Email")}
                                </TableCell>
                                <TableCell>{shipment?.merchant?.email || "-"}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("Place")}
                                </TableCell>
                                <TableCell>
                                  {`${shipment?.merchant?.merchant?.place?.en_name} / ${shipment?.merchant?.merchant?.place?.ar_name}` ||
                                    "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("Latitude")}
                                </TableCell>
                                <TableCell>
                                  {(shipment?.merchant?.latitude ??
                                    shipment?.merchant?.merchant?.place?.lat) ||
                                    "-"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-bold">
                                  {t("Longitude")}
                                </TableCell>
                                <TableCell>
                                  {(shipment?.merchant?.latitude ??
                                    shipment?.merchant?.merchant?.place?.lng) ||
                                    "-"}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>{t("Recipient")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <b>{t("Recipient")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.consignee?.name || "-"}
                              </TableCell>
                            </TableRow>

                            <TableRow>
                              <TableCell>
                                <b>{t("Main phone")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.consignee?.cellphone || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Backup phone")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.consignee?.cellphone || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Email")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.consignee?.email || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Country")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.consignee?.country?.name || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("governorate")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {`${shipment?.consignee?.governorate?.en_name} / ${shipment?.consignee?.governorate?.ar_name}` ||
                                  "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("State")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {`${shipment?.consignee?.state?.en_name} / ${shipment?.consignee?.state?.ar_name}` ||
                                  "-"}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <b>{t("Place")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {`${shipment?.consignee?.place?.en_name} / ${shipment?.consignee?.place?.ar_name}` ||
                                  "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("City")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.consignee?.city?.name || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Zipcode")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.consignee?.zipcode || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Address")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.consignee?.address || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Latitude")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {(shipment?.consignee?.latitude ??
                                  shipment?.consignee?.place?.lat) ||
                                  "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Longitude")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {(shipment?.consignee?.longitude ??
                                  shipment?.consignee?.place?.lng) ||
                                  "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Zone")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.shipment_information?.zone?.name || "-"}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Product Information Section */}
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
                          {shipment &&
                            shipment.shipment_items.map((product, index) => (
                              <TableRow key={index}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.category}</TableCell>
                                <TableCell>{product.quantity}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Core Log Section */}

                  <Card>
                    <CardHeader>
                      <CardTitle>{t("Core Log")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <b>{t("Pickup Time")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.pickup_time || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Package Status")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.shipment_histories[0]?.type || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("From")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.from || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Arrive Time")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.arrive_time || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Package Exception")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.package_exception || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Final")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.final || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("OFD Date")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.ofd_date || "-"}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>

                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <b>{t("Delivery Exception")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.delivery_exception || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Current")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.current || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Load Time")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.load_time || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("OFD Times")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.shipment_delivery?.ofd_count || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Launch RTO Time")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.launch_rto_time || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("RTO Load Time")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.rto_load_time || "-"}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Owner Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("Ra7al Info")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <b>{t("Owner")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.merchant?.name || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Customer ShipmentNo")}</b>
                              </TableCell>
                              <TableCell className="text-right">-</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Length")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.shipment_information?.length || "-"}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>

                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <b>{t("Width")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.shipment_information?.width || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Height")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.shipment_information?.height || "-"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <b>{t("Weight")}</b>
                              </TableCell>
                              <TableCell className="text-right">
                                {shipment?.shipment_information?.weight || "-"}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="">
                    <CardHeader>
                      <div className="flex flex-row space-x-3">
                        <CardTitle className="self-center">
                          {t("Transactions")}
                        </CardTitle>
                      </div>
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
                          {shipment &&
                            shipment.transactions?.map((transaction, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {transaction.from?.name ?? "-"}
                                </TableCell>
                                <TableCell>{transaction.to?.name ?? "-"}</TableCell>
                                <TableCell>{transaction.amount}</TableCell>
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
                <div className="grid-span-1 md:grid-span-2 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("History Logs")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table className="">
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
                          {shipment && shipment.shipment_histories?.length > 0 ? (
                            shipment?.shipment_histories.map((history, index) => (
                              <TableRow key={index}>
                                {/* <td className="px-2 py-1">{history.operatorId}</td> */}
                                <TableCell>
                                  {history?.name ?? "-"}
                                </TableCell>
                                <TableCell>
                                  {history?.description ?? "-"}
                                  {history?.name === "LOADED" && (
                                    <>
                                      <br />
                                      <a
                                        className="text-blue-600 underline hover:text-blue-800 transition-colors duration-150"
                                        target="_blank"
                                        href={`/trucks/view/${JSON.parse(history?.data).truck_barcode}`}
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
                                  {history.proof && (
                                    <ImagePreview
                                      src={
                                        history.proof
                                      }
                                      alt="Proof"
                                    />
                                  )}
                                </TableCell>
                                <TableCell>{history?.time ?? "-"}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell>{t("No shipment histories found")}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}

export default View;
