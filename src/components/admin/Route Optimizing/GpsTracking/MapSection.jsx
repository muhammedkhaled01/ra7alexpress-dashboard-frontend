import { GoogleMap, Marker } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';

const MapSection = ({ drivers, isLoaded }) => {
MapSection.propTypes = {
    drivers: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        location: PropTypes.shape({
            lat: PropTypes.number.isRequired,
            lng: PropTypes.number.isRequired
        }).isRequired,
        status: PropTypes.string.isRequired,
        isOffRoute: PropTypes.bool.isRequired,
        idleTime: PropTypes.number.isRequired,
        lastUpdated: PropTypes.string.isRequired
    })).isRequired,
    isLoaded: PropTypes.bool.isRequired
};
    return (
        <div className="flex-1">
            <div className="h-full">
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={{ lat: 23.588, lng: 58.3829 }}
                        zoom={12}
                        options={{
                            mapTypeControl: true,
                            mapTypeControlOptions: {
                                style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                                position: window.google.maps.ControlPosition.TOP_RIGHT
                            },
                            zoomControl: true,
                            zoomControlOptions: {
                                position: window.google.maps.ControlPosition.RIGHT_BOTTOM
                            },
                            fullscreenControl: true,
                            fullscreenControlOptions: {
                                position: window.google.maps.ControlPosition.RIGHT_BOTTOM
                            }
                        }}
                    >
                        {drivers.map(driver => (
                            <Marker
                                key={driver.id}
                                position={driver.location}
                                label={{ text: driver.name[0], color: 'white', fontWeight: 'bold' }}
                                icon={{
                                    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
                                    fillColor: driver.isOffRoute ? '#ef4444' : 
                                            driver.status === 'idle' ? '#f59e0b' : '#22c55e',
                                    fillOpacity: 1,
                                    strokeWeight: 1,
                                    strokeColor: '#fff',
                                    scale: 2,
                                    anchor: { x: 12, y: 24 },
                                    labelOrigin: { x: 12, y: 9 }
                                }}
                                title={`${driver.name} - ${driver.status}`}
                            />
                        ))}
                    </GoogleMap>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapSection;
