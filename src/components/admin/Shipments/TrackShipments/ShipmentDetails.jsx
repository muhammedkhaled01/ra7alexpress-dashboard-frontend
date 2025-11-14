import PropTypes from 'prop-types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Clock, User, Phone } from "lucide-react";

function ShipmentDetails({ shipmentData }) {
    const { t } = useTranslation();

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("Shipment Details")}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Badge variant={
                            shipmentData.currentStatus === "CREATED"
                                ? "created"
                                : shipmentData.currentStatus === "DELIVERY_EXCEPTION"
                                    ? "exception"
                                    : shipmentData.currentStatus === "DELIVERED"
                                        ? "delivered"
                                        : "outline"
                        }>
                            {shipmentData.currentStatus}
                        </Badge>
                        <span className="text-sm text-gray-500">
                            {new Date(shipmentData.shipmentDate).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <div>
                                <span className="font-medium">{t("Estimated Delivery")}</span>
                                <p className="text-sm text-gray-500">
                                    {new Date(shipmentData.estimatedDelivery).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {shipmentData.driver && (
                            <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-gray-500" />
                                <div>
                                    <span className="font-medium">{t("Driver")}</span>
                                    <p className="text-sm text-gray-500">
                                        {shipmentData.driver.name}
                                    </p>
                                </div>
                            </div>
                        )}

                        {shipmentData.driver && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <div>
                                    <span className="font-medium">{t("Driver Phone")}</span>
                                    <p className="text-sm text-gray-500">
                                        {shipmentData.driver.phone}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

ShipmentDetails.propTypes = {
    shipmentData: PropTypes.shape({
        currentStatus: PropTypes.string.isRequired,
        shipmentDate: PropTypes.string.isRequired,
        estimatedDelivery: PropTypes.string,
        driver: PropTypes.shape({
            name: PropTypes.string,
            phone: PropTypes.string
        })
    }).isRequired
};

export default ShipmentDetails;