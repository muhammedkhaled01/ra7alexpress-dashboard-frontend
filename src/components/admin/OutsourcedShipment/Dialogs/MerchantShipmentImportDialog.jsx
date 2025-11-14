import React, { useState } from "react";
import axiosMerchant from "@/axios";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText, CheckCircle, XCircle, ExternalLink, Download } from "lucide-react";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";

function MerchantShipmentImportDialog({ open, onClose, onSubmitSuccess }) {
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const { t } = useTranslation();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewData(null);
            setShowPreview(false);
        }
    };

    const handlePreview = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error(t("Please select a file"));
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axiosMerchant.post('merchant/shipments/import_preview', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            // Handle both success and error responses that contain preview data
            if (response.data.data) {
                setPreviewData(response.data);
                setShowPreview(true);
                
                if (response.data.success) {
                    toast.success(t("Preview generated successfully"));
                } else {
                    toast.warning(t("Preview generated with missing dependencies"));
                }
            } else {
                throw new Error(response.data.message || "Failed to generate preview");
            }
        } catch (error) {
            console.log("error", error);
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error(t("Please select a file"));
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('confirm_import', '1');

            const response = await axiosMerchant.post('merchant/shipments/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success(response.data.message || t("Shipments imported successfully"));
            onClose();
            if (onSubmitSuccess) {
                onSubmitSuccess();
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await axiosMerchant.get('merchant/shipments/import_template', {
                responseType: 'blob',
            });
            
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Get filename from response headers or use default
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'shipment_import_template.xlsx';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success(t("Template downloaded successfully"));
        } catch (error) {
            handleError(error);
        }
    };

    const resetForm = () => {
        setFile(null);
        setPreviewData(null);
        setShowPreview(false);
        if (document.getElementById('shipment-import-file')) {
            document.getElementById('shipment-import-file').value = '';
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const hasMissingChannels = () => {
        if (!previewData?.data) return false;
        const { missingCountries, missingGovernorates, missingStates } = previewData.data;
        return missingCountries?.length > 0 || missingGovernorates?.length > 0 || missingStates?.length > 0;
    };

    const hasMissingCommissions = () => {
        return false; // Merchant shipments don't need commissions as they use Ra7al Express internal delivery
    };

    const canImport = () => {
        return previewData?.data?.importableShipments?.length > 0;
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="sm:max-w-[90vw] sm:mx-auto lg:max-w-[1000px]">
                <DialogHeader>
                    <DialogTitle>{t("Import Shipments")}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="shipment-import-file">{t("Select File")}</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadTemplate}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {t("Download Template")}
                            </Button>
                        </div>
                        <Input
                            id="shipment-import-file"
                            type="file"
                            accept=".csv,.xlsx"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                        />
                        <p className="text-sm text-muted-foreground">
                            {t("Supported formats: .csv, .xlsx")}
                        </p>
                    </div>

                    {file && !showPreview && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                        </div>
                    )}

                    {showPreview && previewData && (
                        <div className="space-y-4">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="font-medium">
                                        {t("Importable Shipments")}: {previewData.data?.importableShipments?.length || 0}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                    <span className="font-medium">
                                        {t("Problematic Shipments")}: {previewData.data?.unimportableShipments?.length || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Invalid Location Data Warning */}
                            {hasMissingChannels() && (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <h4 className="font-medium text-yellow-800 mb-2">
                                        {t("Invalid Location Data")}
                                    </h4>
                                    <p className="text-sm text-yellow-700 mb-3">
                                        {t("The following location names were not found in the system:")}
                                    </p>
                                    <div className="grid grid-cols-3 gap-4">
                                        {previewData.data?.missingCountries?.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-1 mb-2">
                                                    <span className="font-medium text-sm">{t("Invalid Countries")}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {previewData.data.missingCountries.map((country, index) => (
                                                        <Badge key={index} variant="outline" className="text-xs">
                                                            {country}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {previewData.data?.missingGovernorates?.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-1 mb-2">
                                                    <span className="font-medium text-sm">{t("Invalid Governorates")}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {previewData.data.missingGovernorates.map((gov, index) => (
                                                        <Badge key={index} variant="outline" className="text-xs">
                                                            {gov}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {previewData.data?.missingStates?.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-1 mb-2">
                                                    <span className="font-medium text-sm">{t("Invalid States/Cities")}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {previewData.data.missingStates.map((state, index) => (
                                                        <Badge key={index} variant="outline" className="text-xs">
                                                            {state}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}



                            {/* Preview Results */}
                            <ScrollArea className="max-h-[300px] w-full border rounded-lg">
                                <div className="p-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {previewData.data?.importableShipments?.length > 0 && (
                                            <div>
                                                <h4 className="font-medium text-green-700 mb-2">
                                                    {t("Importable Shipments")}
                                                </h4>
                                                <div className="space-y-1">
                                                    {previewData.data.importableShipments.map((shipment, index) => (
                                                        <Badge key={index} variant="outline" className="text-green-700 border-green-300 text-xs">
                                                            {shipment}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {previewData.data?.unimportableShipments?.length > 0 && (
                                            <div>
                                                <h4 className="font-medium text-red-700 mb-2">
                                                    {t("Problematic Shipments")}
                                                </h4>
                                                <div className="space-y-1">
                                                    {previewData.data.unimportableShipments.map((shipment, index) => (
                                                        <Badge key={index} variant="destructive" className="text-xs">
                                                            {shipment}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <div className="flex flex-row gap-x-2 justify-end">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            {t("Close")}
                        </Button>
                    </DialogClose>
                    
                    {!showPreview ? (
                        <Button 
                            type="button" 
                            onClick={handlePreview} 
                            disabled={!file || isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <FileText className="h-4 w-4 mr-2" />
                                    {t("Preview")}
                                </>
                            )}
                        </Button>
                    ) : (
                        <>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={resetForm}
                            >
                                {t("Back")}
                            </Button>
                            <Button 
                                type="button" 
                                onClick={handleImport} 
                                disabled={isLoading || !canImport()}
                                className={hasMissingChannels() || hasMissingCommissions() ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        {hasMissingChannels() || hasMissingCommissions() 
                                            ? t("Import Anyway") 
                                            : t("Import")} 
                                        ({previewData?.data?.importableShipments?.length || 0})
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default MerchantShipmentImportDialog; 