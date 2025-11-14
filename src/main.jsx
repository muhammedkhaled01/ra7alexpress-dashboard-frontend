import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { ContextProvider } from "./contexts/AuthContext.jsx";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./contexts/ThemeProvider.tsx";
import "./utils/i18n.js";
import "./index.css";
import "react-phone-input-2/lib/style.css";
import "./styles/phone-input.css";
import router from "./router/index.jsx";
import store from "./stores/store.jsx";
import { LanguageProvider } from "./contexts/LanguageProvider.jsx";
import { GoogleMapsProvider } from "./contexts/GoogleMapsProvider.jsx";
import { NotificationDropdownProvider } from "./contexts/NotificationDropdownContext.jsx";

function MainLayout() {
  return (
    <React.StrictMode>
      <ContextProvider>
        <Provider store={store}>
          <LanguageProvider>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
              <GoogleMapsProvider>
                <NotificationDropdownProvider>
                  <RouterProvider router={router} />
                </NotificationDropdownProvider>
              </GoogleMapsProvider>
            </ThemeProvider>
          </LanguageProvider>
          <Toaster
            position="top-center"
            reverseShipment={false}
            toastOptions={{
              className: "",
              duration: 5000,
              style: {
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                fontSize: "1rem",
                boxShadow: "var(--shadow)",
              },
            }}
          />
        </Provider>
      </ContextProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<MainLayout />);
