import { useState } from "react";
import axiosMerchant from "@/axios";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Download } from "lucide-react";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";

function ZoneExportDialog({ open, onClose, onSubmitSuccess, zones }) {
    const [isLoading, setIsLoading] = useState(false);
    const [includeAll, setIncludeAll] = useState(true);
    const { t } = useTranslation();

    const handleExport = async () => {
        setIsLoading(true);
        try {
            const response = await axiosMerchant.get('zones/export', {
                params: {
                    include_all: includeAll
                },
                responseType: 'blob',
                timeout: 30000
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'zones_export.xlsx';

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => window.URL.revokeObjectURL(url), 100);
            toast.success(t("Export completed successfully"));
            onClose();

            if (onSubmitSuccess) {
                onSubmitSuccess();
            }
        } catch (error) {
            console.error('Export error:', error);
            if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
                toast.error(t("CORS error: Please check server configuration"));
            } else {
                handleError(error);
            }
            toast.error(t("Export failed"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("Export Zones")}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="include-all"
                            checked={includeAll}
                            onCheckedChange={(checked) => setIncludeAll(checked === true)}
                        />
                        <Label htmlFor="include-all" className="cursor-pointer">
                            {t("Include all zones (not just current page)")}
                        </Label>
                    </div>

                    <div className="text-sm text-muted-foreground">
                        {includeAll
                            ? t("Exporting all zones from the system")
                            : t("Exporting {count} zones from current page", { count: zones?.length || 0 })}
                    </div>
                </div>

                <div className="flex flex-row gap-x-2 justify-end">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            {t("Close")}
                        </Button>
                    </DialogClose>

                    <Button
                        type="button"
                        onClick={handleExport}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                {t("Export")}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ZoneExportDialog;