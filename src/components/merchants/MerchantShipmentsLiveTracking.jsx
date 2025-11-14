import axiosMerchant from "@/axios";
import React, { useEffect, useState } from "react";
import PageTitle from "../admin/Layouts/PageTitle";
import NoRecordFound from "../NoRecordFound";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { handleError } from "@/utils/helpers";
import Loader from "../Loader";
import { useTranslation } from "react-i18next";
import { 
  Search, 
  MapPin, 
  Clock, 
  Truck, 
  Phone, 
  RefreshCw, 
  Navigation,
  User,
  Home
} from "lucide-react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsProvider";

const MerchantShipmentsLiveTracking = () => {
    const [loading, setLoading] = useState(true);
    const [shipments, setShipments] = useState([]);
    const [selectedShipment, setSelectedShipment] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [map, setMap] = useState(null);
    const [infoWindow, setInfoWindow] = useState(null);

    const { t } = useTranslation();
    const { isLoaded } = useGoogleMaps();

    useEffect(() => {
        fetchActiveShipments();
        
        // Auto-refresh every 30 seconds following user's pattern
        let interval;
        if (autoRefresh) {
            interval = setInterval(fetchActiveShipments, 30000);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    // Center map on selected shipment or show all shipments
    useEffect(() => {
        if (map && selectedShipment?.driver_status) {
            map.panTo({
                lat: parseFloat(selectedShipment.driver_status.latitude),
                lng: parseFloat(selectedShipment.driver_status.longitude)
            });
            map.setZoom(15);
        } else if (map && shipments.length > 0) {
            // Fit all markers
            const bounds = new window.google.maps.LatLngBounds();
            shipments.forEach(shipment => {
                if (shipment.driver_status) {
                    bounds.extend({
                        lat: parseFloat(shipment.driver_status.latitude),
                        lng: parseFloat(shipment.driver_status.longitude)
                    });
                }
            });
            map.fitBounds(bounds);
        }
    }, [map, selectedShipment, shipments]);

    const fetchActiveShipments = async () => {
        setLoading(true);
        try {
            const response = await axiosMerchant.get('merchant/shipments/active-tracking');
            setShipments(response.data.data);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredShipments = shipments.filter(shipment =>
        shipment.tracking_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.consignee?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'OFD': return 'bg-blue-500';
            case 'DELIVERED': return 'bg-green-500';
            case 'DISPATCH': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    const formatTimeAgo = (date) => {
        const now = new Date();
        const updatedAt = new Date(date);
        const diffInMinutes = Math.floor((now - updatedAt) / (1000 * 60));
        
        if (diffInMinutes < 1) return t("Just now");
        if (diffInMinutes < 60) return `${diffInMinutes}m ${t("ago")}`;
        const hours = Math.floor(diffInMinutes / 60);
        return `${hours}h ${t("ago")}`;
    };

    const getDriverMarkerIcon = (shipment) => {
        const isSelected = selectedShipment?.id === shipment.id;
        const color = isSelected ? '#3b82f6' : '#10b981'; // Blue if selected, green otherwise
        
        return {
            url: `data:image/svg+xml,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="3" fill="white"/>
                </svg>`
            )}`,
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 32)
        };
    };

    const getDestinationMarkerIcon = () => {
        return {
            url: `data:image/svg+xml,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" width="24" height="24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <path d="M10 9h4v4h-4z" fill="white"/>
                </svg>`
            )}`,
            scaledSize: new window.google.maps.Size(24, 24),
            anchor: new window.google.maps.Point(12, 24)
        };
    };

    return (
        <div>
            <PageTitle title={t("Live Package Tracking")} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 h-[calc(100vh-200px)]">
                {/* Left Panel - Shipments List */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{t("Active Deliveries")}</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={fetchActiveShipments}
                                        disabled={loading}
                                    >
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    </Button>
                                    <Badge variant="secondary">
                                        {filteredShipments.length} {t("shipments")}
                                    </Badge>
                                </div>
            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder={t("Search by tracking number or name...")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </CardHeader>
                    </Card>

                    <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-350px)]">
                        {loading ? (
                            <div className="text-center">
                                    <Loader />
                            </div>
                        ) : filteredShipments && filteredShipments.length > 0 ? (
                            filteredShipments.map((shipment) => (
                                <div 
                                    key={shipment.id}
                                    className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-sm hover:border-blue-300 ${
                                        selectedShipment?.id === shipment.id 
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm' 
                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                    }`}
                                    onClick={() => setSelectedShipment(shipment)}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                                {shipment.tracking_no}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {shipment.consignee?.name}
                                            </p>
                                        </div>
                                        <Badge 
                                            variant="secondary"
                                            className={`${getStatusColor(shipment.status)} text-white text-xs px-2 py-1 ml-2 flex-shrink-0`}
                                        >
                                            {shipment.status}
                                        </Badge>
                                    </div>

                                    {/* Driver Info - Compact */}
                                    {shipment.driver && (
                                        <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                            <Truck className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                                    {shipment.driver.name}
                                                </p>
                                            </div>
                                            {shipment.driver.phone && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-5 w-5 p-0 flex-shrink-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(`tel:${shipment.driver.phone}`);
                                                    }}
                                                >
                                                    <Phone className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {/* Location & Time Info - Single Line */}
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1 min-w-0 flex-1">
                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">
                                                {shipment.consignee?.state?.en_name}, {shipment.consignee?.governorate?.en_name}
                                            </span>
                                        </div>
                                        {shipment.driver_status && (
                                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                                <Clock className="w-3 h-3" />
                                                <span>{formatTimeAgo(shipment.driver_status.last_updated)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* ETA - Compact */}
                                    {shipment.estimated_delivery && (
                                        <div className="mt-2 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded text-xs text-green-700 dark:text-green-400">
                                            <Clock className="w-3 h-3 inline mr-1" />
                                            {t("ETA")}: {new Date(shipment.estimated_delivery).toLocaleTimeString()}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                                    <NoRecordFound />
                        )}
                    </div>
                </div>

                {/* Right Panel - Map */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Navigation className="w-5 h-5" />
                                    {t("Live Map")}
                                </CardTitle>
                                {selectedShipment && (
                                    <Badge variant="outline">
                                        {t("Tracking")}: {selectedShipment.tracking_no}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        
                        <CardContent className="p-0 h-[calc(100%-80px)]">
                            {!isLoaded ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader />
                                </div>
                            ) : (
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={{ lat: 23.588, lng: 58.3829 }} // Default Egypt center
                                    zoom={11}
                                    onLoad={setMap}
                                    options={{
                                        zoomControl: true,
                                        streetViewControl: false,
                                        mapTypeControl: false,
                                        fullscreenControl: true,
                                    }}
                                >
                                    {/* Driver Markers */}
                                    {filteredShipments.map((shipment) => {
                                        if (!shipment.driver_status) return null;
                                        
                                        return (
                                            <Marker
                                                key={`driver-${shipment.id}`}
                                                position={{
                                                    lat: parseFloat(shipment.driver_status.latitude),
                                                    lng: parseFloat(shipment.driver_status.longitude)
                                                }}
                                                icon={getDriverMarkerIcon(shipment)}
                                                onClick={() => {
                                                    setSelectedShipment(shipment);
                                                    setInfoWindow(shipment.id);
                                                }}
                                            >
                                                {infoWindow === shipment.id && (
                                                    <InfoWindow
                                                        position={{
                                                            lat: parseFloat(shipment.driver_status.latitude),
                                                            lng: parseFloat(shipment.driver_status.longitude)
                                                        }}
                                                        onCloseClick={() => setInfoWindow(null)}
                                                    >
                                                        <div className="p-2 max-w-xs">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Truck className="w-4 h-4 text-blue-500" />
                                                                <span className="font-semibold">{shipment.driver?.name}</span>
                                                            </div>
                                                            <p className="text-sm mb-1">
                                                                <strong>{t("Package")}:</strong> {shipment.tracking_no}
                                                            </p>
                                                            <p className="text-sm mb-1">
                                                                <strong>{t("To")}:</strong> {shipment.consignee?.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {t("Updated")}: {new Date(shipment.driver_status.last_updated).toLocaleTimeString()}
                                                            </p>
                                                            {shipment.driver?.phone && (
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm" 
                                                                    className="mt-2 w-full"
                                                                    onClick={() => window.open(`tel:${shipment.driver.phone}`)}
                                                                >
                                                                    <Phone className="w-3 h-3 mr-1" />
                                                                    {t("Call Driver")}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </InfoWindow>
                                                )}
                                            </Marker>
                                        );
                                    })}

                                    {/* Destination Markers */}
                                    {selectedShipment && selectedShipment.consignee?.latitude && selectedShipment.consignee?.longitude && (
                                        <Marker
                                            position={{
                                                lat: parseFloat(selectedShipment.consignee.latitude),
                                                lng: parseFloat(selectedShipment.consignee.longitude)
                                            }}
                                            icon={getDestinationMarkerIcon()}
                                            title={`${t("Delivery to")}: ${selectedShipment.consignee.name}`}
                                        >
                                            <InfoWindow>
                                                <div className="p-2">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Home className="w-4 h-4 text-red-500" />
                                                        <span className="font-semibold">{t("Delivery Address")}</span>
                                                    </div>
                                                    <p className="text-sm">{selectedShipment.consignee.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {selectedShipment.consignee.streetAddress}
                                                    </p>
                                                </div>
                                            </InfoWindow>
                                        </Marker>
                                    )}
                                </GoogleMap>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default MerchantShipmentsLiveTracking;