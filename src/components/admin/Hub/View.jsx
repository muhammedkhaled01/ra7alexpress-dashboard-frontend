import React, { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import axiosMerchant from "@/axios";
import { can, handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsProvider";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Building } from "lucide-react";
import Loader from "@/components/Loader";
import PageTitle from "../Layouts/PageTitle";

function HubView() {
    const [hub, setHub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const params = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { isLoaded } = useGoogleMaps();

    const canAccess = can("Hub access");

    useEffect(() => {
        if (!canAccess) {
            navigate("/unauthorized");
            return;
        }

        fetchHubData();
    }, [params.hub_id]);

    const fetchHubData = async () => {
        setLoading(true);
        try {
            const response = await axiosMerchant.get(`hubs/show/${params.id}`);
            setHub(response.data.data);
        } catch (error) {
            setError(error);
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    if (!canAccess) {
        return null;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader />
            </div>
        );
    }

    if (error || !hub) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{t("Failed to load hub information")}</p>
                <Button onClick={() => navigate("/hubs")} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t("Back to Hubs")}
                </Button>
            </div>
        );
    }

    const hubLocation = hub.lat && hub.lng ? { lat: parseFloat(hub.lat), lng: parseFloat(hub.lng) } : null;
    const defaultCenter = { lat: 23.588, lng: 58.3829 }; // Egypt center
    console.log(hubLocation);
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageTitle title={t("Hub Details")} />
                <Button onClick={() => navigate("/hubs")} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t("Back to Hubs")}
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hub Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="w-5 h-5" />
                            {t("Hub Information")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-semibold">{t("Name")}</TableCell>
                                    <TableCell>{hub.name}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-semibold">{t("Location")}</TableCell>
                                    <TableCell className="flex items-center justify-center gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        {hub.location || t("Not specified")}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-semibold">{t("Contact Number")}</TableCell>
                                    <TableCell className="flex items-center justify-center gap-2">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        {hub.contact_number || t("Not specified")}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-semibold">{t("Address")}</TableCell>
                                    <TableCell>{hub.address || t("Not specified")}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-semibold">{t("Country")}</TableCell>
                                    <TableCell className="flex items-center justify-center gap-2">
                                        <Globe className="w-4 h-4 text-muted-foreground" />
                                        {hub.country?.name || t("Not specified")}
                                    </TableCell>
                                </TableRow>
                                {hub.governorate && (
                                    <TableRow>
                                        <TableCell className="font-semibold">{t("Governorate")}</TableCell>
                                        <TableCell>
                                            {hub.governorate.en_name && hub.governorate.ar_name
                                                ? `${hub.governorate.en_name} / ${hub.governorate.ar_name}`
                                                : hub.governorate.name || hub.governorate.en_name
                                            }
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow>
                                    <TableCell className="font-semibold">{t("State")}</TableCell>
                                    <TableCell>
                                        {hub.state?.en_name && hub.state?.ar_name
                                            ? `${hub.state.en_name} / ${hub.state.ar_name}`
                                            : hub.state?.name || hub.state?.en_name || t("Not specified")
                                        }
                                    </TableCell>
                                </TableRow>
                                {hub.place && (
                                    <TableRow>
                                        <TableCell className="font-semibold">{t("Place")}</TableCell>
                                        <TableCell>
                                            {hub.place.en_name && hub.place.ar_name
                                                ? `${hub.place.en_name} / ${hub.place.ar_name}`
                                                : hub.place.name || hub.place.en_name
                                            }
                                        </TableCell>
                                    </TableRow>
                                )}
                                {hub.city && (
                                    <TableRow>
                                        <TableCell className="font-semibold">{t("City")}</TableCell>
                                        <TableCell>{hub.city.name}</TableCell>
                                    </TableRow>
                                )}
                                <TableRow>
                                    <TableCell className="font-semibold">{t("Created At")}</TableCell>
                                    <TableCell>
                                        {new Date(hub.created_at).toLocaleDateString()} {new Date(hub.created_at).toLocaleTimeString()}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-semibold">{t("Last Updated")}</TableCell>
                                    <TableCell>
                                        {new Date(hub.updated_at).toLocaleDateString()} {new Date(hub.updated_at).toLocaleTimeString()}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Map Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            {t("Location on Map")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoaded ? (
                            <div className="space-y-4">
                                <GoogleMap
                                    mapContainerStyle={{ width: "100%", height: "400px" }}
                                    center={hubLocation && hubLocation.lat && hubLocation.lng ? { lat: parseFloat(hubLocation.lat), lng: parseFloat(hubLocation.lng) } : defaultCenter}
                                    zoom={hubLocation && hubLocation.lat && hubLocation.lng ? 15 : 10}
                                    options={{
                                        zoomControl: true,
                                        streetViewControl: false,
                                        mapTypeControl: true,
                                        fullscreenControl: true,
                                    }}
                                >
                                    {(hubLocation && hubLocation.lat && hubLocation.lng) && (
                                        <Marker
                                            position={{
                                                lat: parseFloat(hubLocation.lat),
                                                lng: parseFloat(hubLocation.lng)
                                            }}
                                            key={`${hubLocation.lat},${hubLocation.lng}`}
                                            icon={{
                                                url: `data:image/svg+xml,${encodeURIComponent('<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'#6b7280\' width=\'24\' height=\'24\'><path d=\'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z\'/></svg>')}`
                                            }}
                                        />
                                    )}
                                </GoogleMap>

                                {hubLocation ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-muted-foreground">{t("Latitude")}</label>
                                            <p className="text-sm">{hub.lat}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-muted-foreground">{t("Longitude")}</label>
                                            <p className="text-sm">{hub.lng}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground">
                                        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>{t("No location coordinates available")}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex justify-center items-center h-64">
                                <Loader />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}

export default HubView;
