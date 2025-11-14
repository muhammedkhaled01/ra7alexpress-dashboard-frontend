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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import ImageHoverPreview from "@/components/misc/ImageHoverPreview";
import LocationMap from "@/components/misc/LocationMap";
import { useLanguage } from "@/contexts/LanguageProvider";
import { useSelector } from "react-redux";

function ShipmentViewNew({ shipment: _shipment, isOpen, setIsOpen, onClose, deleted = false }) {
  const [loading, setLoading] = useState(true);
  const { currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting)
  const {language} = useLanguage();
  const [shipment, setShipment] = useState(_shipment);
  const [refresh, setRefresh] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setShipment(_shipment);
      fetchShipment(_shipment?.tracking_no);
    } else {
      onClose();
      return;
    }
  }, [refresh, isOpen, onClose, _shipment]);

  const fetchShipment = async (tracking_no) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.post(`${deleted ? "shipment-archive/show" : "shipments/getSingle"}`, {
        tracking_no: tracking_no,
      });
      toast.success(response.data.message);
      console.log(response.data.data);
      setShipment(response.data.data);
      setLoading(false);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableRefresh = () => {
    fetchShipment(_shipment?.tracking_no);
  };
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
        {loading ? (
          <Loader />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t("Basic")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1  gap-4">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-bold">
                            {t("Tracking No")}
                          </TableCell>
                          <TableCell>{shipment?.tracking_no || "-"} - {shipment?.id}</TableCell>
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
                        {shipment?.status == "DELIVERED" && (
                          <TableRow>
                            <TableCell className="font-bold">
                              {t("OTP")}
                            </TableCell>
                            <TableCell>
                              {shipment?.shipment_delivery?.delivery_otp}
                            </TableCell>
                          </TableRow>
                        )}
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
                            {shipment?.assigned_to_shelf?.shelf_barcode
                              ? `(Shelf Barcode: ${shipment?.assigned_to_shelf?.shelf_barcode})`
                              : ``}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold">{t("Note")}</TableCell>
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
                            <TableCell>{language === 'en' ? shipment?.shipper?.state?.en_name : shipment?.shipper?.state?.ar_name}</TableCell>
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
                    <div className="grid grid-cols-1 gap-4">
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
                              {`${language === 'en' ? (shipment?.merchant?.merchant?.governorate ? shipment?.merchant?.merchant?.governorate?.en_name : "-") : (shipment?.merchant?.merchant?.governorate ? shipment?.merchant?.merchant?.governorate?.ar_name : "-")}` ||
                                "-"}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-bold">
                              {t("State")}
                            </TableCell>
                            <TableCell>
                              {`${language === 'en' ? (shipment?.merchant?.merchant?.state ? shipment?.merchant?.merchant?.state?.en_name : "-") : (shipment?.merchant?.merchant?.state ? shipment?.merchant?.merchant?.state?.ar_name : "-")}` ||
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
                              {`${language === 'en' ? (shipment?.merchant?.merchant?.place ? shipment?.merchant?.merchant?.place?.en_name : "-") : (shipment?.merchant?.merchant?.place ? shipment?.merchant?.merchant?.place?.ar_name : "-")}` ||
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
                  <div className="grid grid-cols-1 gap-4 text-sm">
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
                            {shipment?.consignee?.alternatePhone || "-"}
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
                            {`${language === 'en' ? (shipment?.consignee?.governorate ? shipment?.consignee?.governorate?.en_name : "-") : (shipment?.consignee?.governorate ? shipment?.consignee?.governorate?.ar_name : "-")}` ||
                              "-"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <b>{t("State")}</b>
                          </TableCell>
                          <TableCell className="text-right">
                            {`${language === 'en' ? (shipment?.consignee?.state ? shipment?.consignee?.state?.en_name : "-") : (shipment?.consignee?.state ? shipment?.consignee?.state?.ar_name : "-")}` ||
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
                            {`${language === 'en' ? (shipment?.consignee?.place ? shipment?.consignee?.place?.en_name : "-") : (shipment?.consignee?.place ? shipment?.consignee?.place?.ar_name : "-")}` ||
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
                            {shipment?.consignee?.streetAddress || "-"}
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

              {/* Old Address Section */}
              {shipment && shipment.consignee && shipment.consignee.old_address && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("Previous Address")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-bold">
                            {t("Country")}
                          </TableCell>
                          <TableCell>{shipment.consignee.old_address?.country?.name || "-"}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold">
                            {t("ShipmentView.Governorate")}
                          </TableCell>
                          <TableCell>
                            {shipment.consignee.old_address?.governorate?.en_name && shipment.consignee.old_address?.governorate?.ar_name
                              ? `${language === 'en' ? shipment.consignee.old_address.governorate.en_name : shipment.consignee.old_address.governorate.ar_name}`
                              : "-"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold">
                            {t("State")}
                          </TableCell>
                          <TableCell>
                            {shipment.consignee.old_address?.state?.en_name && shipment.consignee.old_address?.state?.ar_name
                              ? `${language === 'en' ? shipment.consignee.old_address.state.en_name : shipment.consignee.old_address.state.ar_name}`
                              : "-"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold">
                            {t("Place")}
                          </TableCell>
                          <TableCell>
                            {shipment.consignee.old_address?.place?.en_name && shipment.consignee.old_address?.place?.ar_name
                              ? `${language === 'en' ? shipment.consignee.old_address.place.en_name : shipment.consignee.old_address.place.ar_name}`
                              : "-"}
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
                          <TableCell>{shipment.consignee.old_address?.city?.name || "-"}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold">
                            {t("Zipcode")}
                          </TableCell>
                          <TableCell>{shipment.consignee.old_address?.zipcode || "-"}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold">
                            {t("Street Address")}
                          </TableCell>
                          <TableCell>{shipment.consignee.old_address?.streetAddress || "-"}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold">
                            {t("Location")}
                          </TableCell>
                          <TableCell>{shipment.consignee.old_address?.location || "-"}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

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
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <Table>
                      <TableBody>
                        {shipment?.shipment_information?.in_warehouse && shipment?.assigned_to_shelf &&
                          <TableRow>
                            <TableCell>
                              <b>{t("Assigned to Shelf")}</b>
                            </TableCell>
                            <TableCell className="text-right">
                              {shipment?.assigned_to_shelf?.barcode || "-"}
                            </TableCell>
                          </TableRow>}
                        {!shipment?.shipment_information?.in_warehouse && shipment?.current_assignment &&
                          <TableRow>
                            <TableCell>
                              <b>{t("Currently Assigned to ")}</b>
                            </TableCell>
                            <TableCell className="text-right">
                              {shipment?.current_assignment?.driver?.name || "-"}
                            </TableCell>
                          </TableRow>}
                        {/* <TableRow>
                          <TableCell>
                            <b>{t("Pickup Time")}</b>
                          </TableCell>
                          <TableCell className="text-right">
                            {shipment?.pickup_time || "-"}
                          </TableCell>
                        </TableRow> */}
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
                  <div className="grid grid-cols-1  gap-4 text-sm">
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

              {/* Package Location Section */}
              <LocationMap shipment={shipment} />

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
                              {history?.name ?? "Edited"}
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
                                <ImageHoverPreview
                                  src={
                                    history.proof
                                  }
                                  alt="Proof"
                                />
                              )}
                            </TableCell>
                            <TableCell>{new Date(history?.time).toLocaleString() ?? "-"}</TableCell>
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
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default ShipmentViewNew;
