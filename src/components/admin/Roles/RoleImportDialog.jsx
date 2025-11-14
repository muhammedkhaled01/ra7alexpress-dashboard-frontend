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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

function RoleImportDialog({ open, onClose, onSubmitSuccess }) {
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
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

            const response = await axiosMerchant.post('roles/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success === true) {
                toast.success(response.data.message || t("Roles imported successfully"));
                onClose();
                if (onSubmitSuccess) {
                    onSubmitSuccess();
                }
            }
            // Handle import with errors (success is array of error messages)
            else if (Array.isArray(response.data.success)) {
                response.data.success.forEach(message => {
                    toast.error(message);
                });
            }
            // Handle other error cases
            else {
                toast.error(response.data.message || t("Import failed"));
            }

        } catch (error) {
            // Handle API errors
            if (error.response?.data) {
                const responseData = error.response.data;

                // Priority 1: Check if success array contains error messages
                if (Array.isArray(responseData.success)) {
                    responseData.success.forEach(message => {
                        toast.error(message);
                    });
                }
                // Priority 2: Check traditional errors object
                else if (responseData.errors) {
                    const errors = Array.isArray(responseData.errors)
                        ? responseData.errors
                        : Object.values(responseData.errors).flat();

                    errors.forEach(errMsg => toast.error(errMsg));
                }
                // Priority 3: General message
                else if (responseData.message) {
                    toast.error(responseData.message);
                }
                // Fallback
                else {
                    toast.error(t("An error occurred during import"));
                }
            } else if (error.request) {
                toast.error(t("No response from server. Please try again later."));
            } else {
                toast.error(t("Error: ") + error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        if (document.getElementById('role-import-file')) {
            document.getElementById('role-import-file').value = '';
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const downloadTemplate = () => {
        // إنشاء بيانات النموذج
        const templateData = [
            ['name', 'permissions'],
            ['Manager', 'User access,User create,User update'],
            ['Supervisor', 'Role access,Role create,Role update'],
            ['Viewer', 'User access,Role access'],
            ['Editor', 'User access,User create,User update,Role access,Role create,Role update']
        ];

        // تحويل إلى CSV
        const csvContent = templateData.map(row =>
            row.map(field => `"${field}"`).join(',')
        ).join('\n');

        // إنشاء ملف للتحميل
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'roles_import_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="sm:max-w-2xl bg-background text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-foreground">{t("Import Roles")}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="role-import-file" className="text-foreground">
                            {t("Select Excel File")}
                        </Label>
                        <Input
                            id="role-import-file"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileChange}
                            className="cursor-pointer border-input bg-background text-foreground"
                        />
                        <p className="text-sm text-muted-foreground">
                            {t("Supported formats: .xlsx, .xls, .csv")}
                        </p>
                    </div>

                    {file && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{file.name}</span>
                        </div>
                    )}

                    <div className="p-4 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                            {t("File Format Requirements")}
                        </h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                            <li>• <strong>{t("Required columns")}:</strong> name</li>
                            <li>• <strong>{t("Optional columns")}:</strong> permissions</li>
                            <li>• <strong>{t("Role names")}:</strong> {t("Must be unique")}</li>
                            <li>• <strong>{t("Permissions format")}:</strong> {t("Separate with commas (e.g., User access,User create)")}</li>
                            <li>• <strong>{t("Permission names")}:</strong> {t("Must match existing permission names")}</li>
                            <li>• <strong>{t("First row")}:</strong> {t("Must contain column headers")}</li>
                        </ul>
                    </div>

                    <div className="p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                            {t("Download Template")}
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                            {t("Download our template file to ensure proper formatting")}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40"
                            onClick={downloadTemplate}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {t("Download CSV Template")}
                        </Button>
                    </div>
                </div>

                <div className="flex flex-row gap-x-2 justify-end pt-4 border-t border-border">
                    <Button
                        type="button"
                        variant="outline"
                        className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                        onClick={downloadTemplate}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        {t("Template")}
                    </Button>

                    <DialogClose asChild>
                        <Button type="button" variant="secondary" className="border-border">
                            {t("Close")}
                        </Button>
                    </DialogClose>

                    <Button
                        type="button"
                        onClick={handleImport}
                        disabled={!file || isLoading}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                {t("Import")}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default RoleImportDialog;