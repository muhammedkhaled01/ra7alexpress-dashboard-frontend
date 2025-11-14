import React from "react";

const ZoneStaticMap = ({ polygonCoords, width = 200, height = 200 }) => {
    const apiKey = "AIzaSyCIlsv3vrcTW7qXJJb2XkyZjvfxqcrvSss";
    const path = JSON.parse(polygonCoords)
        ?.map(coord => `${coord.lat},${coord.lng}`)
        .join("|");

    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=${width}x${height}&path=color:0x0000ff|weight:2|${path}&key=${apiKey}`;

    return (
        <img
            src={mapUrl}
            alt="Static Map"
            width={width}
            height={height}
            style={{ borderRadius: "8px" }}
        />
    );
};

export default ZoneStaticMap;
