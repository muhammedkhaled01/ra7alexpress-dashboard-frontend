import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
    Loader as LucideLoader,
    MapPin,
    Copy,
    Check,
    Printer as PrinterIcon,
    User,
    Package,
    Truck,
    CreditCard,
    FileText,
} from "lucide-react";
import Loader from "@/components/Loader";
import NoRecordFound from "@/components/NoRecordFound";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatCurrentCurrency } from '@/utils/helpers';
import { useSelector } from 'react-redux';
import { useLanguage } from '@/contexts/LanguageProvider';

export default function ShipmentDetailsDialog({
    viewDialogOpen,
    setViewDialogOpen,
    viewLoading,
    viewShipment,
    copiedTrackingNo,
    handleCopy,
    formatDate,
    isPrinting,
    handlePrint
}) {
    const { t } = useTranslation();
    const { currencyEnglishName, currencyArabicName } = useSelector((state) => state.setting)
    const {language} = useLanguage();
    const InfoSection = ({ title, icon: Icon, children, className }) => (
        <div className={cn("p-4 rounded-lg border bg-card", className)}>
            <div className="flex items-center gap-2 mb-3">
                {Icon && <Icon size={18} className="text-muted-foreground" />}
                <h3 className="font-semibold text-sm text-card-foreground">{title}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {children}
            </div>
        </div>
    );

    const InfoItem = ({ label, value, copyable = false, className }) => (
        <div className={cn("flex flex-col gap-1", className)}>
            <span className="text-xs text-muted-foreground font-medium">{label}</span>
            <div className="flex items-center gap-2 min-h-6">
                <span className="text-sm text-card-foreground font-medium break-words">
                    {value || "-"}
                </span>
                {copyable && value && value !== "-" && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 ml-1"
                        onClick={() => handleCopy(value, "text")}
                    >
                        {copiedTrackingNo === value ? (
                            <Check size={12} />
                        ) : (
                            <Copy size={12} />
                        )}
                    </Button>
                )}
            </div>
        </div>
    );

    const StatusBadge = ({ status }) => {
        const statusConfig = {
            CREATED: { variant: "secondary", label: t("Created") },
            COLLECTED: { variant: "default", label: t("Collected") },
            IN_TRANSIT: { variant: "warning", label: t("In Transit") },
            DELIVERED: { variant: "success", label: t("Delivered") },
            CANCELLED: { variant: "destructive", label: t("Cancelled") }
        };

        const config = statusConfig[status] || { variant: "secondary", label: status };

        return (
            <Badge variant={config.variant} className="text-xs">
                {config.label}
            </Badge>
        );
    };

    // Helper function to get nested values safely
    const getNestedValue = (obj, path, defaultValue = '-') => {
        if (!obj) return defaultValue;
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result === null || result === undefined) return defaultValue;
            result = result[key];
        }
        
        return result !== undefined && result !== null ? result : defaultValue;
    };

    return (
        <Sheet open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <SheetContent className="w-full sm:max-w-3xl lg:max-w-4xl p-0 bg-background">
                <div className="h-full overflow-y-auto">
                    <SheetHeader className="px-6 py-4 border-b bg-muted/40">
                        <div className="flex items-center justify-between">
                            <div>
                                <SheetTitle className="text-lg">{t("Shipment Details")}</SheetTitle>
                                <SheetDescription className="flex items-center gap-2 text-sm">
                                    <Package size={16} />
                                    {t("Tracking")}: {getNestedValue(viewShipment, 'tracking_no')}
                                </SheetDescription>
                            </div>
                            <Button
                                onClick={() => handlePrint(viewShipment)}
                                size="sm"
                                variant="outline"
                                disabled={isPrinting[getNestedValue(viewShipment, 'id')]}
                            >
                                {isPrinting[getNestedValue(viewShipment, 'id')] ? (
                                    <LucideLoader className="h-4 w-4 animate-spin" />
                                ) : (
                                    <PrinterIcon className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </SheetHeader>

                    {viewLoading ? (
                        <div className="py-16">
                            <Loader />
                        </div>
                    ) : viewShipment ? (
                        <div className="p-4 space-y-4">
                            {/* Shipment Overview */}
                            <InfoSection title={t("Shipment Overview")} icon={Package}>
                                <InfoItem label={t("Tracking No")} value={getNestedValue(viewShipment, 'tracking_no')} copyable />
                                <InfoItem label={t("Created Date")} value={formatDate(getNestedValue(viewShipment, 'created_at'))} />
                                <InfoItem label={t("Status")} value={<StatusBadge status={getNestedValue(viewShipment, 'status')} />} />
                                <InfoItem label={t("Payment Type")} value={getNestedValue(viewShipment, 'payment_type')} />
                            </InfoSection>

                            {/* Financial Info */}
                            <InfoSection title={t("Financial Information")} icon={CreditCard}>
                                <InfoItem label={t("Delivery Fee")} value={`${getNestedValue(viewShipment, 'delivery_fee', '0')} ${formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)}`} />
                                <InfoItem label={t("Total Amount")} value={`${getNestedValue(viewShipment, 'amount', '0')} ${formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)}`} />
                                <InfoItem label={t("Fee Payer")} value={getNestedValue(viewShipment, 'fee_payer')} />
                                <InfoItem label={t("COD Value")} value={`${getNestedValue(viewShipment, 'value', '0')} ${formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)}`} />
                            </InfoSection>

                            {/* Sender Information */}
                            <InfoSection title={t("Sender Information")} icon={User}>
                                <InfoItem label={t("Name")} value={getNestedValue(viewShipment, 'customer_name')} />
                                <InfoItem label={t("Phone")} value={getNestedValue(viewShipment, 'customer_phone')} copyable />
                                <InfoItem label={t("Country")} value={getNestedValue(viewShipment, 'sender_country.name')} />
                                <InfoItem label={t("Governorate")} value={getNestedValue(viewShipment, 'sender_governorate.en_name')} />
                                <InfoItem label={t("State")} value={getNestedValue(viewShipment, 'sender_state.en_name')} />
                                <InfoItem label={t("Area")} value={getNestedValue(viewShipment, 'sender_place.en_name')} />
                                <InfoItem label={t("Street Address")} value={getNestedValue(viewShipment, 'sender_streetAddress')} className="md:col-span-2" />
                                <InfoItem label={t("District")} value={getNestedValue(viewShipment, 'sender_district')} />
                                <InfoItem label={t("Zip Code")} value={getNestedValue(viewShipment, 'sender_zipcode')} />
                                <InfoItem label={t("Location URL")} value={getNestedValue(viewShipment, 'sender_location_url')} copyable className="md:col-span-2" />
                                <InfoItem 
                                    label={t("Coordinates")} 
                                    value={`Lat: ${getNestedValue(viewShipment, 'sender_latitude', 'N/A')}, Lng: ${getNestedValue(viewShipment, 'sender_longitude', 'N/A')}`} 
                                    className="md:col-span-2" 
                                />
                                <InfoItem label={t("Notes")} value={getNestedValue(viewShipment, 'sender_notes')} className="md:col-span-2" />
                            </InfoSection>

                            {/* Receiver Information */}
                            <InfoSection title={t("Receiver Information")} icon={User}>
                                <InfoItem label={t("Name")} value={getNestedValue(viewShipment, 'consignee.name')} />
                                <InfoItem label={t("Email")} value={getNestedValue(viewShipment, 'consignee.email')} copyable />
                                <InfoItem label={t("Phone")} value={getNestedValue(viewShipment, 'consignee.cellphone')} copyable />
                                <InfoItem label={t("Alt Phone")} value={getNestedValue(viewShipment, 'consignee.alternatePhone')} copyable />
                                <InfoItem label={t("ID Number")} value={getNestedValue(viewShipment, 'consignee.identify')} />
                                <InfoItem label={t("Tax Number")} value={getNestedValue(viewShipment, 'consignee.taxNumber')} />
                                <InfoItem label={t("Country")} value={getNestedValue(viewShipment, 'consignee.country.name')} />
                                <InfoItem label={t("Governorate")} value={getNestedValue(viewShipment, 'consignee.governorate.en_name')} />
                                <InfoItem label={t("State")} value={getNestedValue(viewShipment, 'consignee.state.en_name')} />
                                <InfoItem label={t("Area")} value={getNestedValue(viewShipment, 'consignee.place.en_name')} />
                                <InfoItem label={t("Street Address")} value={getNestedValue(viewShipment, 'consignee.streetAddress')} className="md:col-span-2" />
                                <InfoItem label={t("District")} value={getNestedValue(viewShipment, 'consignee.district')} />
                                <InfoItem label={t("Zip Code")} value={getNestedValue(viewShipment, 'consignee.zipcode')} />
                                <InfoItem label={t("Location URL")} value={getNestedValue(viewShipment, 'location_url')} />
                                <InfoItem 
                                    label={t("Coordinates")} 
                                    value={`Lat: ${getNestedValue(viewShipment, 'consignee.latitude', 'N/A')}, Lng: ${getNestedValue(viewShipment, 'consignee.longitude', 'N/A')}`} 
                                    className="md:col-span-2" 
                                />
                            </InfoSection>

                            {/* Delivery Options */}
                            <InfoSection title={t("Delivery Options")} icon={Truck}>
                                <InfoItem label={t("Priority")} value={getNestedValue(viewShipment, 'delivery_priority')} />
                                <InfoItem label={t("Preferred Time")} value={getNestedValue(viewShipment, 'delivery_time')} />
                                <InfoItem label={t("Allow Return")} value={getNestedValue(viewShipment, 'allow_return') ? t("Yes") : t("No")} />
                                <InfoItem label={t("Need Invoice")} value={getNestedValue(viewShipment, 'need_invoice') ? t("Yes") : t("No")} />
                                <InfoItem label={t("Fragile")} value={getNestedValue(viewShipment, 'is_fragile') ? t("Yes") : t("No")} />
                                <InfoItem label={t("Outsourced")} value={getNestedValue(viewShipment, 'is_outsourced') ? t("Yes") : t("No")} />
                                <InfoItem label={t("Walk-in")} value={getNestedValue(viewShipment, 'is_walkin') ? t("Yes") : t("No")} />
                            </InfoSection>

                            {/* Package Details */}
                            <InfoSection title={t("Package Details")} icon={Package}>
                                {getNestedValue(viewShipment, 'shipment_items', []).length > 0 ? (
                                    <>
                                        {viewShipment.shipment_items.map((item, index) => (
                                            <InfoItem
                                                key={index}
                                                label={t("Item")}
                                                value={`${getNestedValue(item, 'name')} (${getNestedValue(item, 'category')}) x${getNestedValue(item, 'quantity')}`}
                                                className="md:col-span-2"
                                            />
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        <InfoItem label={t("Weight")} value={getNestedValue(viewShipment, 'shipment_information.weight') ? `${getNestedValue(viewShipment, 'shipment_information.weight')} kg` : "-"} />
                                        <InfoItem label={t("Length")} value={getNestedValue(viewShipment, 'shipment_information.length') ? `${getNestedValue(viewShipment, 'shipment_information.length')} cm` : "-"} />
                                        <InfoItem label={t("Width")} value={getNestedValue(viewShipment, 'shipment_information.width') ? `${getNestedValue(viewShipment, 'shipment_information.width')} cm` : "-"} />
                                        <InfoItem label={t("Height")} value={getNestedValue(viewShipment, 'shipment_information.height') ? `${getNestedValue(viewShipment, 'shipment_information.height')} cm` : "-"} />
                                        <InfoItem label={t("Package Type")} value={getNestedValue(viewShipment, 'shipment_information.type')} />
                                        <InfoItem label={t("Package Value")} value={getNestedValue(viewShipment, 'value') ? `${getNestedValue(viewShipment, 'value')} ${formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)}` : "-"} />
                                        <InfoItem label={t("In Warehouse")} value={getNestedValue(viewShipment, 'shipment_information.in_warehouse') ? t("Yes") : t("No")} />
                                    </>
                                )}
                            </InfoSection>

                            {/* Shipper Information */}
                            <InfoSection title={t("Shipper Information")} icon={User}>
                                <InfoItem label={t("Name")} value={getNestedValue(viewShipment, 'shipper.name')} />
                                <InfoItem label={t("Email")} value={getNestedValue(viewShipment, 'shipper.email')} copyable />
                                <InfoItem label={t("Contact")} value={getNestedValue(viewShipment, 'shipper.contact')} copyable />
                                <InfoItem label={t("Address")} value={getNestedValue(viewShipment, 'shipper.address')} className="md:col-span-2" />
                                <InfoItem label={t("Zip Code")} value={getNestedValue(viewShipment, 'shipper.zip_code')} />
                                <InfoItem label={t("Website")} value={getNestedValue(viewShipment, 'shipper.website')} copyable className="md:col-span-2" />
                            </InfoSection>

                            {/* Additional Info */}
                            <InfoSection title={t("Additional Information")} icon={FileText}>
                                <InfoItem label={t("Notes")} value={getNestedValue(viewShipment, 'notes')} className="md:col-span-2" />
                            </InfoSection>

                            {/* Quick Actions */}
                            <div className="flex justify-center gap-3 pt-4">
                                <Button
                                    onClick={() => setViewDialogOpen(false)}
                                    variant="default"
                                    size="sm"
                                >
                                    {t("Close")}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-16">
                            <NoRecordFound />
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

ShipmentDetailsDialog.propTypes = {
    viewDialogOpen: PropTypes.bool.isRequired,
    setViewDialogOpen: PropTypes.func.isRequired,
    viewLoading: PropTypes.bool.isRequired,
    viewShipment: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        tracking_no: PropTypes.string,
        status: PropTypes.string,
        created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        payment_type: PropTypes.string,
        fee_payer: PropTypes.string,
        delivery_fee: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        customer_name: PropTypes.string,
        customer_phone: PropTypes.string,
        sender_streetAddress: PropTypes.string,
        sender_location_url: PropTypes.string,
        sender_district: PropTypes.string,
        sender_zipcode: PropTypes.string,
        sender_notes: PropTypes.string,
        sender_country: PropTypes.shape({
            id: PropTypes.number,
            name: PropTypes.string,
            code: PropTypes.string,
            phonecode: PropTypes.number
        }),
        sender_governorate: PropTypes.shape({
            id: PropTypes.number,
            en_name: PropTypes.string,
            ar_name: PropTypes.string
        }),
        sender_state: PropTypes.shape({
            id: PropTypes.number,
            en_name: PropTypes.string,
            ar_name: PropTypes.string
        }),
        sender_place: PropTypes.shape({
            id: PropTypes.number,
            en_name: PropTypes.string,
            ar_name: PropTypes.string
        }),
        allow_return: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
        delivery_priority: PropTypes.string,
        delivery_time: PropTypes.string,
        need_invoice: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
        is_fragile: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
        is_outsourced: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
        is_walkin: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
        package_type: PropTypes.string,
        package_value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        notes: PropTypes.string,
        consignee: PropTypes.shape({
            name: PropTypes.string,
            email: PropTypes.string,
            cellphone: PropTypes.string,
            alternatePhone: PropTypes.string,
            identify: PropTypes.string,
            taxNumber: PropTypes.string,
            streetAddress: PropTypes.string,
            district: PropTypes.string,
            zipcode: PropTypes.string,
            latitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            longitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            country: PropTypes.shape({
                name: PropTypes.string
            }),
            state: PropTypes.shape({
                en_name: PropTypes.string
            })
        }),
        shipment_items: PropTypes.arrayOf(
            PropTypes.shape({
                name: PropTypes.string.isRequired,
                category: PropTypes.string.isRequired,
                quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
            })
        ),
        shipment_information: PropTypes.shape({
            weight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            length: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            in_warehouse: PropTypes.oneOfType([PropTypes.bool, PropTypes.number])
        }),
        shipper: PropTypes.shape({
            name: PropTypes.string,
            email: PropTypes.string,
            contact: PropTypes.string,
            address: PropTypes.string,
            zip_code: PropTypes.string,
            website: PropTypes.string
        }),
        created_by: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        facility_type: PropTypes.string,
        shipment_type_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }),
    copiedTrackingNo: PropTypes.string,
    handleCopy: PropTypes.func.isRequired,
    formatDate: PropTypes.func.isRequired,
    isPrinting: PropTypes.objectOf(PropTypes.bool),
    handlePrint: PropTypes.func.isRequired
};

ShipmentDetailsDialog.defaultProps = {
    viewShipment: null,
    copiedTrackingNo: '',
    isPrinting: {}
};