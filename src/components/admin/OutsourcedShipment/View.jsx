import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import ImagePreview from "@/components/misc/ImagePreview";
import { Table } from "@/components/ui/table";
import { convertBoolean, formatCurrentCurrency } from "@/utils/helpers";
import { useSelector } from "react-redux";
import { useLanguage } from "@/contexts/LanguageProvider";
function View({ tigger, record }) {
  const { t } = useTranslation();
  const { currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting)
  const {language} = useLanguage();


  return (
    <Sheet>
      <SheetTrigger>{tigger}</SheetTrigger>
      <SheetContent className="w-full sm:w-1/2 p-4 space-y-4">
        <SheetHeader>
          <SheetTitle>{t("Tracking No")}</SheetTitle>
          <SheetDescription>{record?.tracking_no}</SheetDescription>
        </SheetHeader>

        {/* Basic Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Basic")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <strong>{t("Tracking No")}</strong>
                <span>{record.tracking_no}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Customer PayType")}</strong>
                <span>{record.payment_type}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Delivery Fee")}</strong>
                <span>
                  {record.delivery_fee > 0 ? record.delivery_fee : 0} {formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)}
                </span>
              </div>
              <div className="flex justify-between">
                <strong>{t("COD")}</strong>
                <span>{record.amount > 0 ? record.amount : 0} {formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Package ID")}</strong>
                <span>-</span>
              </div>

              <div className="flex justify-between">
                <strong>{t("In Warehouse")}</strong>
                <span>{convertBoolean(record.shipment_information?.in_warehouse)} {record.assigned_to_shelf?.shelf.barcode ? `(${t("Shelf Barcode")}: ${record.assigned_to_shelf?.shelf.barcode})` : ``}</span>
              </div>

              <div className="flex justify-between">
                <strong>{t("Note")}</strong>
                <span>{record.notes}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {record.shipper &&
          <Card>
            <CardHeader>
              <CardTitle>{t("Shipper")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <strong>{t("Shipper")}</strong>
                  <span>
                    {record?.shipper?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("Country")}</strong>
                  <span>{record?.shipper?.country?.name}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("Main phone")}</strong>
                  <span>{record?.shipper?.contact}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("State")}</strong>
                  <span>{record?.shipper?.state?.name}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("Backup phone")}</strong>
                  <span>{record?.shipper?.backup_phone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("City")}</strong>
                  <span>{record?.shipper?.city?.name}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("Email")}</strong>
                  <span>{record?.shipper?.email || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("District")}</strong>
                  <span>{record?.shipper?.district || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("Zipcode")}</strong>
                  <span>{record?.shipper?.zipcode || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("Address")}</strong>
                  <span>{record?.shipper?.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>

        }
        {record.is_walkin == 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("Walkin Sender")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="flex justify-between">
                  <strong>{t("Name")}</strong>
                  <span>
                    {record?.customer_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("Phone")}</strong>
                  <span>{record?.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("ID Card")}</strong>
                  <span>{record?.customer_id_card}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {record.merchant &&
          <Card>
            <CardHeader>
              <CardTitle>{t("Merchant")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <strong>{t("Sender")}</strong>
                  <span>{record?.merchant?.name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("Country")}</strong>
                  <span>{record?.merchant?.merchant?.country?.name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("governorate")}</strong>
                  <span>{`${record?.merchant?.merchant?.governorate?.en_name} / ${record?.merchant?.merchant?.governorate?.ar_name}` || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("State")}</strong>
                  <span>{`${record?.merchant?.merchant?.state?.en_name} / ${record?.merchant?.merchant?.state?.ar_name}` || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("Email")}</strong>
                  <span>{record?.merchant?.email || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("Place")}</strong>
                  <span>{`${record?.merchant?.merchant?.place?.en_name} / ${record?.merchant?.merchant?.place?.ar_name}` || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("Latitude")}</strong>
                  <span>{(record?.merchant?.latitude ?? record?.merchant?.merchant?.place?.lat) || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <strong>{t("Longitude")}</strong>
                  <span>{(record?.merchant?.latitude ?? record?.merchant?.merchant?.place?.lng) || "-"}</span>
                </div>
                {/* <div className="flex justify-between">
                  <strong>{t("Zone")}</strong>
                  <span>{record?.merchant?.latitude || "-"}</span>
                </div> */}
              </div>
            </CardContent>
          </Card>}

        <Card>
          <CardHeader>
            <CardTitle>{t("Recipient")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <strong>{t("Recipient")}</strong>
                <span>{record?.consignee?.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Country")}</strong>
                <span>{record?.consignee?.country?.name || "-"}</span>
              </div>

              <div className="flex justify-between">
                <strong>{t("Main phone")}</strong>
                <span>{record?.consignee?.cellphone || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("governorate")}</strong>
                <span>{`${record?.consignee?.governorate?.en_name} / ${record?.consignee?.governorate?.ar_name}` || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Backup phone")}</strong>
                <span>{record?.consignee?.cellphone || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("State")}</strong>
                <span>{`${record?.consignee?.state?.en_name} / ${record?.consignee?.state?.ar_name}` || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Email")}</strong>
                <span>{record?.consignee?.email || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Place")}</strong>
                <span>{`${record?.consignee?.place?.en_name} / ${record?.consignee?.place?.ar_name}` || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("City")}</strong>
                <span>{record?.consignee?.city?.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("District")}</strong>
                <span>{record?.consignee?.district || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Zipcode")}</strong>
                <span>{record?.consignee?.zipcode || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Address")}</strong>
                <span>{record?.consignee?.address || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Latitude")}</strong>
                <span>{(record?.consignee?.latitude ?? record?.consignee?.place?.lat) || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Longitude")}</strong>
                <span>{(record?.consignee?.latitude ?? record?.consignee?.place?.lng) || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Zone")}</strong>
                <span>{record?.shipment_information?.zone?.name || "-"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Product Information")}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="min-w-full  ">
              <thead>
                <tr className="font-bold">
                  <td className="px-4 py-2 border-b">{t("Product")}</td>
                  <td className="px-4 py-2 border-b">{t("Category")}</td>
                  <td className="px-4 py-2 border-b">{t("Quantity")}</td>
                </tr>
              </thead>
              <tbody>
                {/* Loop through your products and display them here */}
                {record?.shipment_items.map((product, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 border-b">{product.name}</td>
                    <td className="px-4 py-2 border-b">{product.category}</td>
                    <td className="px-4 py-2 border-b">{product.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Core Log Section */}

        <Card>
          <CardHeader>
            <CardTitle>{t("Core Log")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <strong>{t("Pickup Time")}</strong>
                <span>{record?.pickup_time}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Package Status")}</strong>
                <span>{record?.shipment_histories[0]?.type || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("From")}</strong>
                <span>{record?.from || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Arrive Time")}</strong>
                <span>{record?.arrive_time || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Package Exception")}</strong>
                <span>{record?.package_exception || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Final")}</strong>
                <span>{record?.final || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("OFD Date")}</strong>
                <span>{record?.ofd_date || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Delivery Exception")}</strong>
                <span>{record?.delivery_exception || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Current")}</strong>
                <span>{record?.current || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Load Time")}</strong>
                <span>{record?.load_time || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("OFD Times")}</strong>
                <span>{record?.shipment_delivery?.ofd_count || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Launch RTO Time")}</strong>
                <span>{record?.launch_rto_time || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("RTO Load Time")}</strong>
                <span>{record?.rto_load_time || "-"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owner Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Ra7al Info")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <strong>{t("Owner")}</strong>
                <span>{record?.merchant?.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Customer ShipmentNo")}</strong>
                <span>-</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Length")}</strong>
                <span>{record?.shipment_information?.length || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Width")}</strong>
                <span>{record?.shipment_information?.width || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Height")}</strong>
                <span>{record?.shipment_information?.height || "-"}</span>
              </div>
              <div className="flex justify-between">
                <strong>{t("Weight")}</strong>
                <span>{record?.shipment_information?.weight || "-"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History Logs Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t("History Logs")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 text-left">{t("Action")}</th>
                  <th className="px-2 py-1 text-left">{t("Description")}</th>
                  <th className="px-2 py-1 text-left">{t("Operator")}</th>
                  <th className="px-2 py-1 text-left">{t("Operation Hub")}</th>
                  <th className="px-2 py-1 text-left">{t("Proof")}</th>
                  {/* <th className="px-2 py-1 text-left">{t("Action Name")}</th>
                  <th className="px-2 py-1 text-left">{t("Type")}</th> */}
                  <th className="px-2 py-1 text-left">{t("Time")}</th>
                </tr>
              </thead>

              <tbody>
                {record?.shipment_histories?.length > 0 ? (
                  record?.shipment_histories.map((history) => (
                    <tr key={history.id} className="hover:bg-gray-100">
                      {/* <td className="px-2 py-1">{history.operatorId}</td> */}
                      <td className="px-2 py-1">{history.name}</td>
                      <td className="px-2 py-1">{history.description}</td>
                      <td className="px-2 py-1">{history.operatorInfo}</td>
                      <td className="px-2 py-1">{history.operation_hub_name}</td>
                      <td className="px-2 py-1">{history.proof && <ImagePreview src={history.proof} alt="Proof" />}</td>
                      {/* <td className="px-2 py-1">{history.originActionName}</td>
                      <td className="px-2 py-1">{history.type}</td> */}
                      <td className="px-2 py-1">{history.time}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center px-4 py-2">
                      No shipment histories found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </SheetContent>
    </Sheet>
  );
}

export default View;
