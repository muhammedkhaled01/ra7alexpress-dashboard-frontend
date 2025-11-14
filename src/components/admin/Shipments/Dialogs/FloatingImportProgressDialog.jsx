import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { XCircle, StopCircle, UploadCloud, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { useImportProgress } from "@/contexts/ImportProgressProvider";

const useTranslation = () => ({
    t: (key) => key
});

const FloatingImportProgressDialog = ({ className }) => {
    const {
        isFloatingDialogOpen,
        importProgress,
        isImporting,
        importResults,
        totalShipmentsToImport,
        resetImportState,
        stopImport,
    } = useImportProgress();
    const { t } = useTranslation();

    const handleClose = () => {
        if (!isImporting) {
            resetImportState();
        } else {
            toast.info(t("Import is running in the background. Click the icon to view progress."));
        }
    };

    if (!isFloatingDialogOpen) return null;

    const importedCount = importResults?.imported || 0;
    const skippedCount = importResults?.skipped || 0;
    const errorCount = importResults?.errors?.length || 0;
    const totalProcessed = importedCount + skippedCount;
    const remainingCount = totalShipmentsToImport - totalProcessed;
    const isCompleted = importProgress >= 100 || (!isImporting && totalProcessed >= totalShipmentsToImport);

    const calculatedProgress = totalShipmentsToImport > 0
        ? Math.min(100, Math.round((totalProcessed / totalShipmentsToImport) * 100))
        : (isCompleted ? 100 : 0);

    return (
        <div
            className={`fixed bottom-6 z-50 w-full max-w-sm space-y-3 p-4 bg-white border border-blue-200 rounded-xl shadow-lg transition-all duration-300 transform scale-100 backdrop-blur-sm ${className}`}
            style={{
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.05)',
            }}
        >
            <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                    {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                        <UploadCloud className="h-5 w-5 text-blue-600 animate-pulse" />
                    )}
                    <h4 className="font-bold text-blue-900 text-base">
                        {isCompleted ? t("Import Complete") : t("Importing Shipments")}
                    </h4>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="p-1 h-8 w-8 text-gray-500 hover:text-gray-900 transition-colors"
                    title={t("Close and Run in Background")}
                >
                    <XCircle className="h-5 w-5" />
                </Button>
            </div>

            <div className="space-y-2">
                <Progress value={isCompleted ? 100 : calculatedProgress} className="w-full h-2 bg-blue-100" indicatorClassName={isCompleted ? "bg-green-500" : "bg-blue-500"} />

                <div className="flex justify-between text-xs font-semibold text-gray-600">
                    <span>{isCompleted ? 100 : calculatedProgress}% {t("Completed")}</span>
                    <span>{t("Total")}: {totalShipmentsToImport}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
                <Badge variant="secondary" className="justify-center bg-green-100 text-green-700 font-medium">
                    {t("Imported")}: {importedCount}
                </Badge>
                <Badge variant="secondary" className="justify-center bg-red-100 text-red-700 font-medium">
                    {t("Skipped")}: {skippedCount}
                </Badge>

                <Badge variant="secondary" className="justify-center bg-yellow-100 text-yellow-700 font-medium">
                    {t("Remaining")}: {remainingCount > 0 ? remainingCount : 0}
                </Badge>
                {errorCount > 0 && (
                    <Badge variant="secondary" className="justify-center bg-red-100 text-red-700 font-medium border border-red-300">
                        {t("Errors")}: {errorCount}
                    </Badge>
                )}
            </div>

            {!isCompleted && isImporting && (
                <div className="pt-2 border-t flex justify-end">
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={stopImport}
                        className="h-8"
                    >
                        <StopCircle className="h-4 w-4 ml-2 rtl:mr-2 rtl:ml-0" />
                        {t("Stop Import")}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default FloatingImportProgressDialog;