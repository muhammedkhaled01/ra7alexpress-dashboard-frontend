import React, { useEffect, useState, useCallback, useRef } from "react";
import PropTypes from 'prop-types';
import { GoogleMap, Polygon } from "@react-google-maps/api";
import { useGoogleMaps } from "@/contexts/GoogleMapsProvider";
import { useTranslation } from "react-i18next";
import ZonePolygon from "@/components/admin/Zones/ZonePolygon";
import { parsePolygon } from "@/utils/helpers";

const ZoneMap = ({ 
    width = "100%", 
    height = "500px", 
    polygonCoords, 
    setPolygonCoords, 
    zones, 
    enableZones = false, 
    enableStates = false, 
    states,
    isEditMode = false 
}) => {
    const { t } = useTranslation();
    const { isLoaded } = useGoogleMaps();
    const [map, setMap] = useState(null);
    const [drawingManager, setDrawingManager] = useState(null);
    const [shouldRenderPolygon, setShouldRenderPolygon] = useState(false);
    const polyRef = useRef(null);
    const [polygonLoaded, setPolygonLoaded] = useState(false);
    const listenersRef = useRef([]);
    const [mapCenter, setMapCenter] = useState({ lat: 23.5880, lng: 58.3829 });
    const [mapZoom, setMapZoom] = useState(10);

    console.log('ZoneMap - isLoaded:', isLoaded);
    console.log('ZoneMap - polygonCoords:', polygonCoords);
    console.log('ZoneMap - polygonLoaded:', polygonLoaded);

    const onLoad = useCallback((mapInstance) => {
        console.log('Map loaded');
        setMap(mapInstance);
        mapInstance.addListener('dragend', () => {
            const center = mapInstance.getCenter();
            setMapCenter({
                lat: center.lat(),
                lng: center.lng()
            });
        });

        mapInstance.addListener('zoom_changed', () => {
            setMapZoom(mapInstance.getZoom());
        });

        // Wait a bit for the map to be fully initialized
        setTimeout(() => {
            if (window.google && window.google.maps) {
                const drawingManagerInstance = new window.google.maps.drawing.DrawingManager({
                    drawingControl: true,
                    drawingControlOptions: {
                        position: window.google.maps.ControlPosition.TOP_CENTER,
                        drawingModes: ["polygon"],
                    },
                    polygonOptions: {
                        editable: true,
                        draggable: true,
                    },
                });

                drawingManagerInstance.setMap(mapInstance);
                setDrawingManager(drawingManagerInstance);

                window.google.maps.event.addListener(
                    drawingManagerInstance,
                    "polygoncomplete",
                    (polygon) => {
                        const path = polygon.getPath();
                        const coordinates = [];
                        path.forEach((latLng) => {
                            coordinates.push({ lat: latLng.lat(), lng: latLng.lng() });
                        });
                        console.log('New polygon drawn:', coordinates);
                        setPolygonCoords(coordinates);
                        polygon.setMap(null); // Remove the drawn polygon to avoid duplicates
                    }
                );

                // Set a small delay before rendering the polygon to ensure map is ready
                setTimeout(() => {
                    setShouldRenderPolygon(true);
                }, 500); // Increased delay to ensure map is fully ready
            }
        }, 100);
    }, []);

    const onUnmount = useCallback(() => {
        if (drawingManager) {
            drawingManager.setMap(null);
        }
        setMap(null);
        setDrawingManager(null);
        setShouldRenderPolygon(false);
        setPolygonLoaded(false);
        polyRef.current = null;

        // Clean up listeners
        if (listenersRef.current.length > 0) {
            listenersRef.current.forEach(listener => listener.remove());
            listenersRef.current = [];
        }
    }, [drawingManager]);

    // Clean up listeners when polygon unmounts
    const cleanupListeners = useCallback(() => {
        if (listenersRef.current.length > 0) {
            console.log('Cleaning up', listenersRef.current.length, 'event listeners');
            listenersRef.current.forEach(listener => listener.remove());
            listenersRef.current = [];
        }
    }, []);

    // Handle polygon updates when it's edited
    useEffect(() => {
        if (!polygonLoaded || !polyRef.current) return;

        console.log('Setting up polygon event listeners');
        const poly = polyRef.current;
        const path = poly.getPath();

        // Clean up existing listeners first
        cleanupListeners();

        // build coords and invoke update
        const notify = () => {
            try {
                const coords = path.getArray().map(p => ({
                    lat: p.lat(),
                    lng: p.lng(),
                }));
                console.log('Polygon updated:', coords);
                setPolygonCoords(coords);
            } catch (error) {
                console.error('Error updating polygon coordinates:', error);
            }
        };

        // Add a small delay to ensure the polygon is fully initialized
        setTimeout(() => {
            // listen for vertex edits and full drags
            const listeners = [
                path.addListener('insert_at', notify),  // vertex added
                path.addListener('set_at', notify),     // vertex moved
                path.addListener('remove_at', notify),  // vertex removed
                poly.addListener('drag', notify),       // continuous drag
                poly.addListener('dragend', notify),    // drag finished
            ];

            // Store listeners for cleanup
            listenersRef.current = listeners;

            console.log('Event listeners attached to polygon');
        }, 100);

        // cleanup on unmount
        return () => {
            console.log('Cleaning up polygon event listeners');
            cleanupListeners();
        };
    }, [polygonLoaded, setPolygonCoords, cleanupListeners]);

    useEffect(() => {
        // Log when coordinates are updated
        if (polygonCoords?.length) {
            console.log("Updated Polygon Coordinates:", polygonCoords);
        }
    }, [polygonCoords]);

    // Fallback: If we have coordinates but polygon hasn't rendered after a delay, force render
    useEffect(() => {
        if (polygonCoords?.length > 0 && isLoaded && !shouldRenderPolygon) {
            const timer = setTimeout(() => {
                console.log('Forcing polygon render after delay');
                setShouldRenderPolygon(true);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [polygonCoords, isLoaded, shouldRenderPolygon]);

    // Additional fallback: If coordinates change and we should render, ensure polygon is visible
    useEffect(() => {
        if (polygonCoords?.length > 0 && shouldRenderPolygon) {
            console.log('Polygon should be visible with coordinates:', polygonCoords);
        }
    }, [polygonCoords, shouldRenderPolygon]);

    // Periodic update mechanism to ensure all changes are captured
    useEffect(() => {
        if (!polygonLoaded || !polyRef.current) return;

        const interval = setInterval(() => {
            try {
                const poly = polyRef.current;
                if (poly && poly.getPath) {
                    const path = poly.getPath();
                    const coords = path.getArray().map(p => ({
                        lat: p.lat(),
                        lng: p.lng(),
                    }));

                    // Only update if coordinates have actually changed
                    const currentCoordsString = JSON.stringify(coords);
                    const lastCoordsString = JSON.stringify(polygonCoords);

                    if (currentCoordsString !== lastCoordsString) {
                        console.log('Periodic update detected change:', coords);
                        setPolygonCoords(coords);
                    }
                }
            } catch (error) {
                console.error('Error in periodic update:', error);
            }
        }, 1000); // Check every second

        return () => clearInterval(interval);
    }, [polygonLoaded, polygonCoords]);

    // Calculate bounds for the polygon
    const getPolygonBounds = useCallback((coords) => {
        if (!coords?.length) return null;
        
        const bounds = new window.google.maps.LatLngBounds();
        coords.forEach(coord => {
            bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
        });
        return bounds;
    }, []);

    // Fit map to polygon bounds when in edit mode and coordinates change
    useEffect(() => {
        if (isEditMode && map && polygonCoords?.length > 0) {
            const bounds = getPolygonBounds(polygonCoords);
            if (bounds) {
                // Add some padding around the polygon
                map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
            }
        }
    }, [polygonCoords, map, isEditMode, getPolygonBounds]);

    // Force re-render when coordinates change
    const polygonKey = polygonCoords?.length ? polygonCoords.map(coord => `${coord.lat},${coord.lng}`).join('|') : 'empty';

    const handlePolygonLoad = useCallback((poly) => {
        console.log('Polygon loaded:', poly);
        polyRef.current = poly;
        setPolygonLoaded(true);

        // Set up listeners immediately when polygon loads
        setTimeout(() => {
            if (poly && poly.getPath) {
                const path = poly.getPath();

                // Clean up existing listeners first
                cleanupListeners();

                const notify = () => {
                    try {
                        const coords = path.getArray().map(p => ({
                            lat: p.lat(),
                            lng: p.lng(),
                        }));
                        console.log('Polygon updated via load handler:', coords);
                        setPolygonCoords(coords);
                    } catch (error) {
                        console.error('Error updating polygon coordinates:', error);
                    }
                };

                // listen for vertex edits and full drags
                const listeners = [
                    path.addListener('insert_at', notify),  // vertex added
                    path.addListener('set_at', notify),     // vertex moved
                    path.addListener('remove_at', notify),  // vertex removed
                    poly.addListener('drag', notify),       // continuous drag
                    poly.addListener('dragend', notify),    // drag finished
                ];

                // Store listeners for cleanup
                listenersRef.current = listeners;
                console.log('Event listeners attached to polygon via load handler');
            }
        }, 200);
    }, [cleanupListeners, setPolygonCoords]);

    const handlePolygonUnmount = useCallback(() => {
        console.log('Polygon unmounted');
        cleanupListeners();
        polyRef.current = null;
        setPolygonLoaded(false);
    }, [cleanupListeners]);

    return isLoaded ? (
        <div style={{ position: 'relative', width, height }}>
            <GoogleMap
                mapContainerStyle={{ width, height }}
                center={mapCenter}
                zoom={mapZoom}
                onLoad={onLoad}
                onUnmount={onUnmount}
            >
                {/* Display Polygon if coordinates are provided and map is ready */}
                {shouldRenderPolygon && polygonCoords?.length > 0 && (
                    <Polygon
                        key={polygonKey}
                        paths={polygonCoords}
                        options={{
                            editable: true,
                            draggable: true,
                            fillColor: "#ffff00",
                            fillOpacity: 0.35,
                            strokeColor: "#ffd700",
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                        }}
                        onLoad={handlePolygonLoad}
                        onUnmount={handlePolygonUnmount}
                    />
                )}

                {enableZones && zones?.map((zone) => {
                    const coordinates = parsePolygon(zone.coordinates_geojson)[0]?.[0] || [];
                    const zoneKey = `${zone.id}-${coordinates.length}-${Date.now()}`;
                    return (
                        <ZonePolygon
                            key={zoneKey}
                            zone={{ ...zone, coordinates }}
                        />
                    );
                })}

                {(enableStates ?? false) && (states ?? []).map((state) => {
                    const coordinates = parsePolygon(state?.polygon_geojson ?? '')?.[0]?.[0] || [];
                    const zoneKey = `${state.id}-${coordinates.length}-${Date.now()}`;

                    return (
                        <ZonePolygon
                            key={zoneKey}
                            zone={{ ...state, coordinates }}
                            color="#FF0000"
                            fillOpacity={0.1}
                            strokeOpacity={0.2}
                        />
                    );
                })}
            </GoogleMap>
            {polygonCoords?.length > 0 && !shouldRenderPolygon && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    zIndex: 1000
                }}>
                    {t("Loading polygon...")}
                </div>
            )}
        </div>
    ) : (
        <div className="flex items-center justify-center" style={{ width, height }}>
            <p>{t("Loading...")}</p>
        </div>
    );
};

ZoneMap.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  polygonCoords: PropTypes.arrayOf(
    PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
    })
  ),
  setPolygonCoords: PropTypes.func.isRequired,
  zones: PropTypes.array,
  enableZones: PropTypes.bool,
  enableStates: PropTypes.bool,
  states: PropTypes.array,
  isEditMode: PropTypes.bool,
};

ZoneMap.defaultProps = {
  width: '100%',
  height: '500px',
  polygonCoords: [],
  zones: [],
  enableZones: false,
  enableStates: false,
  states: [],
  isEditMode: false,
};

export default ZoneMap;
