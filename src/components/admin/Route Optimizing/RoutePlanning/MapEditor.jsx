import PropTypes from 'prop-types';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

export default function MapEditor({
    isLoaded,
    latLng,
    onMapClick,
    deliveryLocations,
    shipments
}) {
    return (
        <div className="h-64 w-full">
            {isLoaded ? (
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={latLng || { lat: 23.588, lng: 58.3829 }}
                    zoom={10}
                    onClick={onMapClick}
                >
                    {latLng && <Marker position={latLng} />}
                    {deliveryLocations.map((loc, index) => (
                        <Marker
                            key={loc}
                            position={{
                                lat: shipments.find(o => o.id === loc)?.lat || 0,
                                lng: shipments.find(o => o.id === loc)?.lng || 0
                            }}
                            label={`${index + 1}`}
                        />
                    ))}
                </GoogleMap>
            ) : (
                <div className="h-64 w-full flex items-center justify-center bg-gray-100">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            )}
        </div>
    );
}

MapEditor.propTypes = {
    isLoaded: PropTypes.bool.isRequired,
    latLng: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
    }),
    onMapClick: PropTypes.func.isRequired,
    deliveryLocations: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ])
    ).isRequired,
    shipments: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.number
            ]).isRequired,
            lat: PropTypes.number,
            lng: PropTypes.number
        })
    ).isRequired,
};
