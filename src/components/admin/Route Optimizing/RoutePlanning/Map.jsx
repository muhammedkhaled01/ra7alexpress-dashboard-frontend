import React, { useMemo, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { GoogleMap, Marker, Polyline, LoadScript } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from '@/components/ui/card';

// Helper function to decode polyline
function decodePolyline(encoded) {
    if (!encoded) return [];
    
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    let coordinates = [];

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        coordinates.push({
            lat: lat / 1e5,
            lng: lng / 1e5
        });
    }

    return coordinates;
}

export default function RouteMap({ routes = [] }) {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        // Simulate API delay
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    }, [routes]);

    const bounds = useMemo(() => {
        if (!routes?.length) return null;
        
        const bounds = new window.google.maps.LatLngBounds();
        
        routes.forEach(route => {
            if (route.stops && route.stops.length > 0) {
                route.stops.forEach(stop => {
                    bounds.extend(new window.google.maps.LatLng(stop.latitude, stop.longitude));
                });
            }
        });
        
        return bounds;
    }, [routes]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Route Map Overview</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
                <LoadScript
                    googleMapsApiKey={import.meta.env.VITE_MAP_KEY}
                    libraries={['places']}
                >
                    <div className="w-full h-full">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                        ) : (
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={{ lat: 23.588, lng: 58.3829 }}
                                zoom={10}
                                onLoad={(map) => {
                                    if (bounds) {
                                        map.fitBounds(bounds);
                                    }
                                }}
                            >
                                {routes.map(route => (
                                    <React.Fragment key={route.id}>
                                        {route.stops?.map((stop, index) => (
                                            <Marker
                                                key={stop.stop_id}
                                                position={{ lat: stop.latitude, lng: stop.longitude }}
                                                label={{
                                                    text: `${index + 1}`,
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}
                                                title={`Stop ${index + 1}: ${stop.shipment_details?.address}`}
                                                icon={{
                                                    url: `/images/marker-${index === 0 ? 'start' : index === route.stops.length - 1 ? 'end' : 'stop'}.png`,
                                                    scaledSize: new window.google.maps.Size(30, 30)
                                                }}
                                            />
                                        ))}
                                        {route.polyline && (
                                            <Polyline
                                                path={decodePolyline(route.polyline)}
                                                options={{
                                                    strokeColor: '#FF0000',
                                                    strokeOpacity: 0.8,
                                                    strokeWeight: 2
                                                }}
                                            />
                                        )}
                                    </React.Fragment>
                                ))}
                            </GoogleMap>
                        )}
                    </div>
                </LoadScript>
            </CardContent>
        </Card>
    );
}

RouteMap.propTypes = {
    routes: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            stops: PropTypes.arrayOf(
                PropTypes.shape({
                    stop_id: PropTypes.number.isRequired,
                    shipment_id: PropTypes.number.isRequired,
                    sequence: PropTypes.number.isRequired,
                    latitude: PropTypes.number.isRequired,
                    longitude: PropTypes.number.isRequired,
                    shipment_details: PropTypes.shape({
                        customer_name: PropTypes.string,
                        address: PropTypes.string
                    })
                })
            ),
            polyline: PropTypes.string,
        })
    ),
};
