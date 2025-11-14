import React, { useState, useCallback } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { useImportProgress } from "@/contexts/ImportProgressProvider";
import Select from "@/components/misc/Select";
import { useEffect } from "react";

const useTranslation = () => ({
    t: (key) => key
});

function ShipmentImportDialog({ open, onClose, onSubmitSuccess, is_outsourced=false }) {
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [partners, setPartners] = useState([]);
    const [selectedMarketplacePartner, setSelectedMarketplacePartner] = useState(null);
    const [loadingPartners, setLoadingPartners] = useState(false);
    const {
        setIsFloatingDialogOpen,
        setImportProgress,
        setIsImporting,
        setImportResults,
        setTotalShipmentsToImport,
        setCurrentBatch,
        setTotalBatches,
        isImporting,
        currentBatch,
        importControllerRef,
        isImportingRef,
        resetImportState,
    } = useImportProgress();
    const { t } = useTranslation();

    useEffect(() => {
        if (open) {
            fetchPartners();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const fetchPartners = async () => {
        setLoadingPartners(true);
        try {
            const response = await axiosMerchant.get('partners/all');
            if (response.data.data && Array.isArray(response.data.data)) {
                const partnerOptions = response.data.data.map(partner => ({
                    value: partner.id,
                    label: partner.name
                }));
                setPartners(partnerOptions);
            }
        } catch (error) {
            handleError(error);
        } finally {
            setLoadingPartners(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewData(null);
            setShowPreview(false);
            resetImportState();
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
            formData.append('is_outsourced', is_outsourced ? "1" : "0");
            if (selectedMarketplacePartner) {
                formData.append('marketplace_partner_id', selectedMarketplacePartner.value);
            }

            const response = await axiosMerchant.post('shipments/import_preview', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.data) {
                setPreviewData(response.data.data);
                setShowPreview(true);
                setTotalShipmentsToImport(response.data.data.data?.importableShipments?.length || 0);

                if (response.data.success) {
                    toast.success(t("Preview generated successfully"));
                } else {
                    toast.warning(t("Preview generated with missing dependencies"));
                }
            } else {
                throw new Error(response.data.message || "Failed to generate preview");
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const processSingleBatch = async (sessionId, batchNumber) => {
        if (!sessionId || !isImportingRef.current) {
            return { success: false, completed: false };
        }

        try {
            if (importControllerRef.current) {
                importControllerRef.current.abort();
            }
            importControllerRef.current = new AbortController();

            const batchResponse = await axiosMerchant.post('shipments/process_batch', {
                batch: batchNumber,
                session_id: sessionId
            }, {
                signal: importControllerRef.current.signal
            });

            if (!batchResponse.data.success) {
                throw new Error(batchResponse.data.message || `Batch ${batchNumber} failed`);
            }

            const { progress, batch_results, cumulative_results, completed } = batchResponse.data.data;

            setImportProgress(progress);
            setCurrentBatch(batchNumber);
            setImportResults(cumulative_results);

            if (batch_results.imported > 5 || batch_results.skipped > 0) {
                toast.success(`Batch ${batchNumber}: ${batch_results.imported} imported, ${batch_results.skipped} skipped`);
            }

            return {
                success: true,
                completed,
                cumulative_results,
                progress
            };

        } catch (error) {
            if (error.name === 'AbortError') {
                return { success: false, completed: false, aborted: true };
            }
            
            toast.error(`Batch ${batchNumber} failed: ${error.message}`);
            
            return { success: false, completed: false, error: error.message };
        }
    };

    const processAllBatches = async (sessionId, totalBatches) => {
        if (!sessionId || !isImportingRef.current) {
            return;
        }

        try {
            for (let batchNumber = 1; batchNumber <= totalBatches; batchNumber++) {
                if (!isImportingRef.current) {
                    break;
                }

                const result = await processSingleBatch(sessionId, batchNumber);
                
                if (!result.success) {
                    if (result.aborted) {
                        break;
                    }
                    continue;
                }

                if (result.completed) {
                    toast.success(t("Import completed successfully"));
                    setImportResults(result.cumulative_results);
                    setIsImporting(false);
                    
                    setTimeout(() => {
                        if (onSubmitSuccess) {
                            onSubmitSuccess();
                        }
                    }, 500);
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, 300));
            }

            if (currentBatch >= totalBatches && isImportingRef.current) {
                toast.success(t("Import completed successfully"));
                setIsImporting(false);

                setTimeout(() => {
                    if (onSubmitSuccess) {
                        onSubmitSuccess();
                    }
                }, 500);
            }
        } catch (error) {
            toast.error(`Import failed: ${error.message}`);
            setIsImporting(false);
            setIsFloatingDialogOpen(false);
        }
    };

    const startBatchImport = async () => {
        if (!file) {
            toast.error(t("Please select a file"));
            return;
        }

        setIsImporting(true);
        setImportProgress(0);
        setImportResults(null);
        setCurrentBatch(0);
        setTotalBatches(0);
        
        setIsFloatingDialogOpen(true); 

        try {
            if (importControllerRef.current) {
                importControllerRef.current.abort();
            }

            const startFormData = new FormData();
            startFormData.append('file', file);
            startFormData.append('confirm_import', '1');
            startFormData.append('batch_size', '5');
            startFormData.append('is_outsourced', is_outsourced ? "1" : '0');
            if (selectedMarketplacePartner) {
                startFormData.append('marketplace_partner_id', selectedMarketplacePartner.value);
            }

            const startResponse = await axiosMerchant.post('shipments/import', startFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!startResponse.data.success) {
                throw new Error(startResponse.data.message || "Failed to start import");
            }

            const { total_batches, session_id } = startResponse.data.data;
            setTotalBatches(total_batches);
            setCurrentBatch(0);
            
            onClose(); 

            processAllBatches(session_id, total_batches);

        } catch (error) {
            handleError(error);
            toast.error(t("Import failed to start"));
            setIsImporting(false);
            setIsFloatingDialogOpen(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await axiosMerchant.get('shipments/import_template', {
                responseType: 'blob',
            });

            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

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
        setSelectedMarketplacePartner(null);
        resetImportState();
        
        if (document.getElementById('shipment-import-file')) {
            document.getElementById('shipment-import-file').value = '';
        }
    };

    const handleClose = () => {
        if (isImporting) {
            setIsFloatingDialogOpen(true);
            onClose();
        } else {
            resetForm();
            onClose();
        }
    };

    const hasMissingChannels = () => {
        if (!previewData?.addresses) return false;
        const { countries, governorates, states } = previewData.addresses;
        return countries?.length > 0 || governorates?.length > 0 || states?.length > 0;
    };

    const hasMissingCommissions = () => {
        return previewData?.data?.commissions?.length > 0;
    };

    const canImport = () => {
        return previewData?.data?.importableShipments?.length > 0;
    };

    return (
        <Dialog 
            open={open} 
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    handleClose();
                }
            }}
        >
            <DialogContent className="sm:max-w-[90vw] sm:mx-auto lg:max-w-[1000px] max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>{t("Import Shipments")}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4 overflow-y-auto max-h-[70vh]">
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="shipment-import-file">{t("Select File")}</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadTemplate}
                                disabled={isImporting}
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
                            disabled={isImporting}
                        />
                        <p className="text-sm text-muted-foreground">
                            {t("Supported formats: .csv, .xlsx")}
                        </p>
                    </div>

                    {file && !showPreview && !isImporting && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                        </div>
                    )}

                    {showPreview && previewData && !isImporting && (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>{t("Assign Marketplace for Imported Orders")}</Label>
                                <Select
                                    value={selectedMarketplacePartner}
                                    onChange={setSelectedMarketplacePartner}
                                    options={partners}
                                    placeholder={t("Select Marketplace Partner")}
                                    isClearable
                                    isLoading={loadingPartners}
                                    isDisabled={isImporting}
                                />
                            </div>
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

                            {previewData.data?.total_records && (
                                <div className="p-3 bg-gray-50 border rounded-lg">
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium">{t("Total Records")}: </span>
                                            {previewData.data.total_records}
                                        </div>
                                        <div>
                                            <span className="font-medium">{t("Batch Size")}: </span>
                                            {previewData.data.batch_size || 10}
                                        </div>
                                        <div>
                                            <span className="font-medium">{t("Total Batches")}: </span>
                                            {previewData.data.total_batches ||
                                                Math.ceil(previewData.data.total_records / 10)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {hasMissingChannels() && (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <h4 className="font-medium text-yellow-800 mb-2">
                                        {t("Missing Channels Required")}
                                    </h4>
                                    <p className="text-sm text-yellow-700 mb-3">
                                        {t("The following channels need to be created before importing:")}
                                    </p>
                                    <div className="grid grid-cols-3 gap-4">
                                        {previewData.addresses?.countries?.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-1 mb-2">
                                                    <span className="font-medium text-sm">{t("Country Channels")}</span>
                                                    <a href="/channels/country/2" target="_blank" className="inline-block">
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                                <div className="space-y-1">
                                                    {previewData.addresses.countries.map((country, index) => (
                                                        <Badge key={index} variant="outline" className="text-xs">
                                                            {country}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {previewData.addresses?.governorates?.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-1 mb-2">
                                                    <span className="font-medium text-sm">{t("Governorate Channels")}</span>
                                                    <a href="/channels/governorate/2" target="_blank" className="inline-block">
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                                <div className="space-y-1">
                                                    {previewData.addresses.governorates.map((gov, index) => (
                                                        <Badge key={index} variant="outline" className="text-xs">
                                                            {gov}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {previewData.addresses?.states?.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-1 mb-2">
                                                    <span className="font-medium text-sm">{t("State Channels")}</span>
                                                    <a href="/channels/state/2" target="_blank" className="inline-block">
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                                <div className="space-y-1">
                                                    {previewData.addresses.states.map((state, index) => (
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

                            {hasMissingCommissions() && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center gap-1 mb-2">
                                        <h4 className="font-medium text-red-800">{t("Missing Commissions")}</h4>
                                        <a href="/shippers/commissions/2" target="_blank" className="inline-block">
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                    <p className="text-sm text-red-700 mb-3">
                                        {t("Commission rates are missing for the following states:")}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {previewData.data.commissions.map((commission, index) => (
                                            <Badge key={index} variant="destructive" className="text-xs">
                                                {commission}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                            disabled={!file || isLoading || isImporting}
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
                                disabled={isImporting}
                            >
                                {t("Back")}
                            </Button>
                            <Button
                                type="button"
                                onClick={startBatchImport}
                                disabled={isLoading || !canImport() || isImporting}
                                className={hasMissingChannels() || hasMissingCommissions() ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                            >
                                {isImporting ? (
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

export default ShipmentImportDialog;