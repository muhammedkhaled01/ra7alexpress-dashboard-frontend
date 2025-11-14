import React, { createContext, useContext, useState } from 'react';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type) => {
    setAlert({ message, type });
  };

  const hideAlert = () => {
    setAlert(null);
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alert && (
        <div className={`alert alert-${alert.type}`} role="alert">
          {alert.message}
          <button type="button" className="btn-close" onClick={hideAlert}></button>
        </div>
      )}
    </AlertContext.Provider>
  );
};
