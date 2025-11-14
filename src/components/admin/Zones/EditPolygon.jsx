import React, { useEffect, useRef, useMemo } from 'react';
import { Polygon } from '@react-google-maps/api';
import throttle from 'lodash/throttle';  // npm install lodash

/**
 * EditPolygon
 * - Stable key ensures no remount on each render.
 * - Listens to insert_at, set_at, remove_at, drag and dragend.
 * - Throttles updates to once every 50ms but still fires for each event.
 */
export const EditPolygon = ({ zoneId, paths, onUpdate }) => {
  const polyRef = useRef(null);

  // Throttle so we don’t hammer state on every pixel of drag
  const throttledUpdate = useMemo(
    () => throttle((newCoords) => onUpdate(newCoords), 50),
    [onUpdate]
  );

  useEffect(() => {
    const poly = polyRef.current;
    if (!poly) return;
    const path = poly.getPath();

    // build coords and invoke update
    const notify = () => {
      const coords = path.getArray().map(p => ({
        lat: p.lat(),
        lng: p.lng(),
      }));
      throttledUpdate(coords);
    };

    // listen for vertex edits and full drags
    const listeners = [
      path.addListener('insert_at', notify),  // vertex added
      path.addListener('set_at', notify),     // vertex moved
      path.addListener('remove_at', notify),  // vertex removed
      poly.addListener('drag', notify),       // continuous drag
      poly.addListener('dragend', notify),    // drag finished
    ];

    // cleanup on unmount
    return () => listeners.forEach(l => l.remove());
  }, [throttledUpdate]);

  return (
    <Polygon
      key={`edit-${zoneId}`}            // stable identity
      paths={paths}
      options={{
        editable: true,
        draggable: true,
        fillColor: '#ffcc00',
        fillOpacity: 0.5,
        strokeColor: '#ffd700',
        strokeWeight: 2,
      }}
      onLoad={p => (polyRef.current = p)}
      onUnmount={() => (polyRef.current = null)}
    />
  );
};

export default EditPolygon;
