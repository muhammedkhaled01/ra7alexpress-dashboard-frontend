import React from 'react';
import { GoogleMap, Marker } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { MapPin, Clock } from "lucide-react";
import { useGoogleMaps } from "@/contexts/GoogleMapsProvider";

const LocationMap = ({ shipment }) => {
  const { t } = useTranslation();
  const { isLoaded } = useGoogleMaps();

  // Check if shipment has driver and driver status with location
  const hasDriverLocation = shipment?.driver_status && shipment.driver_status.latitude && shipment.driver_status.longitude;
  
  const formatLastUpdated = (lastUpdated) => {
    if (!lastUpdated) return "-";
    try {
      return new Date(lastUpdated).toLocaleString();
    } catch (error) {
      return "-";
    }
  };

  const openInGoogleMaps = () => {
    if (hasDriverLocation) {
      const { latitude, longitude } = shipment.driver_status;
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      window.open(url, '_blank');
    }
  };

  if (!shipment?.driver_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t("Package Location")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>{t("Package is in warehouse")}</p>
            {/* <p>{t("Status")}: {owner}</p> */}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasDriverLocation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t("Package Location")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>{t("Driver location not available")}</p>
            <p className="text-sm">{t("Assigned to")}: {shipment.driver?.name}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          {t("Package Location")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Driver Info */}
          <div className="flex items-center justify-between">
            <span className="font-medium">{t("With Driver")}: {shipment.driver?.name}</span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatLastUpdated(shipment.driver_status.last_updated)}
            </span>
          </div>

          {/* Location Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">{t("Latitude")}:</span>
                <p>{shipment.driver_status.latitude}</p>
              </div>
              <div>
                <span className="font-medium">{t("Longitude")}:</span>
                <p>{shipment.driver_status.longitude}</p>
              </div>
            </div>
            {shipment.driver_status.location && (
              <div className="mt-2">
                <span className="font-medium">{t("Location")}:</span>
                <p>{shipment.driver_status.location}</p>
              </div>
            )}
          </div>

          {/* Map Display */}
          <div className="relative">
            <div className="h-[200px] rounded-lg overflow-hidden">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{
                    lat: parseFloat(shipment.driver_status.latitude),
                    lng: parseFloat(shipment.driver_status.longitude)
                  }}
                  zoom={15}
                >
                  <Marker
                    position={{
                      lat: parseFloat(shipment.driver_status.latitude),
                      lng: parseFloat(shipment.driver_status.longitude)
                    }}
                    title={`${shipment.driver?.name} - ${t("Package Location")}`}
                    icon={{
                      url: `data:image/svg+xml,${encodeURIComponent(
                        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#22c55e" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>`
                      )}`
                    }}
                  />
                </GoogleMap>
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-muted rounded-lg">
                  <p>{t("Loading...")}</p>
                </div>
              )}
            </div>
            
            {/* Fallback button */}
            <div className="mt-2">
              <button
                onClick={openInGoogleMaps}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                {t("Open in Google Maps")}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationMap; 