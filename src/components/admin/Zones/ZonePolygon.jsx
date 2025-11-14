import { useState, useRef } from "react";
import { Polygon, OverlayView } from "@react-google-maps/api";
import { useLanguage } from "@/contexts/LanguageProvider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function ZonePolygon({
    zone,
    color = "#3f51b5",
    fillOpacity = 0.4,
    strokeOpacity = 0.8
}) {
    const [isHovered, setIsHovered] = useState(false);
    const hoverTimeout = useRef(null);

    const coordinates = zone.coordinates;
    const center = coordinates.reduce(
        (acc, curr) => ({
            lat: acc.lat + curr.lat,
            lng: acc.lng + curr.lng
        }),
        { lat: 0, lng: 0 }
    );
    center.lat /= coordinates.length;
    center.lng /= coordinates.length;

    const handleMouseOver = () => {
        clearTimeout(hoverTimeout.current);
        setIsHovered(true);
    };
    const handleMouseOut = () => {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = setTimeout(() => {
            setIsHovered(false);
        }, 150);
    };

    const { language } = useLanguage();

    return (
        <>
            <Polygon
                paths={coordinates}
                options={{
                    fillColor: isHovered ? "#FFEB3B" : color,
                    fillOpacity: isHovered ? fillOpacity + 0.2 : fillOpacity,
                    strokeColor: isHovered ? "#1a237e" : color,
                    strokeOpacity,
                    strokeWeight: isHovered ? 3 : 2,
                    editable: false,
                    draggable: false,
                    clickable: true,
                    zIndex: isHovered ? 2 : 1
                }}
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
            />

            {isHovered && zone?.name && (
                <OverlayView
                    position={center}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-4 h-4 bg-white rounded-full border-2 border-white flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                                <span className="text-xs">i</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p className="text-sm">
                                {zone.name}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </OverlayView>
            )}
        </>
    );
}
