import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '@/contexts/GoogleMapsProvider';
import { Input } from '@/components/ui/input';

const Autocomplete = ({ 
  value, 
  onChange, 
  onPlaceSelect, 
  placeholder, 
  error, 
  className = "",
  ...props 
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const { isLoaded } = useGoogleMaps();
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    console.log('Autocomplete useEffect - isLoaded:', isLoaded);
    console.log('Autocomplete useEffect - inputRef.current:', inputRef.current);
    console.log('Autocomplete useEffect - autocompleteRef.current:', autocompleteRef.current);
    
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      console.log('Creating Google Maps Autocomplete...');
      
      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: ['OM'] }, // Restrict to Egypt
        });

        console.log('Autocomplete created successfully');

        autocompleteRef.current.addListener('place_changed', () => {
          console.log('Place changed event triggered');
          const place = autocompleteRef.current.getPlace();
          console.log('Selected place:', place);
          
          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const address = place.formatted_address || place.name;
            
            console.log('Place data:', { lat, lng, address });
            
            // Update the input value
            setInputValue(address);
            onChange?.(address);
            
            // Call the callback with place data
            onPlaceSelect?.({
              lat,
              lng,
              address,
              place
            });
          } else {
            console.log('No geometry found for selected place');
          }
        });

        console.log('Place changed listener added');
      } catch (error) {
        console.error('Error creating autocomplete:', error);
      }
    }

    return () => {
      if (autocompleteRef.current) {
        console.log('Cleaning up autocomplete listeners');
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isLoaded, onChange, onPlaceSelect]);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    console.log('Input changed:', newValue);
    setInputValue(newValue);
    onChange?.(newValue);
  };

  console.log('Autocomplete render - isLoaded:', isLoaded, 'inputValue:', inputValue);

  if (!isLoaded) {
    console.log('Google Maps not loaded yet, showing disabled input');
    return (
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        disabled
        {...props}
      />
    );
  }

  return (
    <Input
      ref={inputRef}
      value={inputValue}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={className}
      error={error}
      {...props}
    />
  );
};

export default Autocomplete; 