import React, { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const { i18n } = useTranslation();
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem("language") || "ar";
    });

    const changeLanguage = (lang) => {
        setLanguage(lang);
        i18n.changeLanguage(lang);
        localStorage.setItem("language", lang);
    };

    useEffect(() => {
        i18n.changeLanguage(language);
    }, [language, i18n]);

    return (
        <LanguageContext.Provider value={{ language, changeLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
