import React, { createContext, useContext, useState, useRef } from "react";

const ImportProgressContext = createContext();

export const ImportProgressProvider = ({ children }) => {
    const [isFloatingDialogOpen, setIsFloatingDialogOpen] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [isImporting, setIsImporting] = useState(false);
    const [importResults, setImportResults] = useState(null);
    const [totalShipmentsToImport, setTotalShipmentsToImport] = useState(0);
    const [currentBatch, setCurrentBatch] = useState(0);
    const [totalBatches, setTotalBatches] = useState(0);
    const importControllerRef = useRef(null);
    const isImportingRef = useRef(false);

    React.useEffect(() => {
        isImportingRef.current = isImporting;
    }, [isImporting]);

    const resetImportState = () => {
        setIsFloatingDialogOpen(false);
        setImportProgress(0);
        setIsImporting(false);
        setImportResults(null);
        setTotalShipmentsToImport(0);
        setCurrentBatch(0);
        setTotalBatches(0);
        if (importControllerRef.current) {
            importControllerRef.current.abort();
        }
    };

    const stopImport = () => {
        setIsImporting(false);
        if (importControllerRef.current) {
            importControllerRef.current.abort();
        }
    };

    return (
        <ImportProgressContext.Provider
            value={{
                isFloatingDialogOpen,
                setIsFloatingDialogOpen,
                importProgress,
                setImportProgress,
                isImporting,
                setIsImporting,
                importResults,
                setImportResults,
                totalShipmentsToImport,
                setTotalShipmentsToImport,
                currentBatch,
                setCurrentBatch,
                totalBatches,
                setTotalBatches,
                importControllerRef,
                isImportingRef,
                resetImportState,
                stopImport,
            }}
        >
            {children}
        </ImportProgressContext.Provider>
    );
};

export const useImportProgress = () => useContext(ImportProgressContext);