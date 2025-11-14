import React, { createContext, useContext, useState } from "react";
import { LoadScript } from "@react-google-maps/api";
import Loader from "../components/Loader";

const GoogleMapsContext = createContext();

const libraries = ["places", "drawing", "geometry", "visualization"];

export const GoogleMapsProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  const handleLoad = () => {
    console.log("Google Maps API loaded successfully");
    setIsLoaded(true);
    setError(null);
  };

  const handleError = (error) => {
    console.error("Google Maps API loading error:", error);
    setError(error);
  };

  const apiKey = import.meta.env.VITE_MAP_KEY;
  console.log("Google Maps API Key available:", !!apiKey);

  if (!apiKey) {
    console.error("VITE_MAP_KEY environment variable is not set");
    return (
      <div className="flex justify-center items-center h-screen w-screen">
        <div className="text-red-500">
          <p>Google Maps API Key is not configured</p>
          <p>Please set VITE_MAP_KEY in your environment variables</p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={libraries}
      onLoad={handleLoad}
      onError={handleError}
      loadingElement={
        <div className="flex justify-center items-center h-screen w-screen">
          <Loader />
        </div>
      }
    >
      <GoogleMapsContext.Provider value={{ isLoaded, error }}>
        {children}
      </GoogleMapsContext.Provider>
    </LoadScript>
  );
};

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error("useGoogleMaps must be used within a GoogleMapsProvider");
  }
  return context;
};

export default GoogleMapsProvider;
