import { useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import axios from '@/axios';
import MapSection from './MapSection';
import DriverLocationsTable from './DriverLocationsTable';
import DriverHistoryDialog from './DriverHistoryDialog';

export default function GpsTracking() {
    const [drivers, setDrivers] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [driverHistory, setDriverHistory] = useState([]);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: 'AIzaSyCIlsv3vrcTW7qXJJb2XkyZjvfxqcrvSss',
        libraries: ['places'],
    });

    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const response = await axios.get('/driver-locations');
                setDrivers(response.data.map(driver => ({
                    id: driver.driver_id,
                    name: driver.driver_name,
                    location: { lat: driver.latitude, lng: driver.longitude },
                    lastUpdated: driver.last_updated,
                    status: driver.status,
                    isOffRoute: driver.status !== 'on_route',
                    idleTime: driver.status === 'idle' ? 15 : 0
                })));
            } catch (error) {
                console.error('Error fetching drivers:', error);
            }
        };
        fetchDrivers();
        const interval = setInterval(fetchDrivers, 30000);
        return () => {
            clearInterval(interval);
        };
    }, []);

    const handleViewHistory = async (driver) => {
        try {
            const response = await axios.get(`/driver-location-histories/${driver.id}`);
            setSelectedDriver(driver);
            setDriverHistory(response.data.map(entry => ({
                timestamp: entry.event_timestamp,
                status: entry.event_type.replace('_', ' '),
                location: { lat: entry.latitude, lng: entry.longitude }
            })));
            setShowHistory(true);
        } catch (error) {
            console.error('Error fetching driver history:', error);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen">
            <MapSection drivers={drivers} isLoaded={isLoaded} />
            <DriverLocationsTable drivers={drivers} handleViewHistory={handleViewHistory} />
            <DriverHistoryDialog 
                showHistory={showHistory} 
                setShowHistory={setShowHistory}
                selectedDriver={selectedDriver}
                driverHistory={driverHistory}
            />
        </div>
    );
}
