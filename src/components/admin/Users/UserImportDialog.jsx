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
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

function UserImportDialog({ open, onClose, onSubmitSuccess }) {
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
            const response = await axiosMerchant.post('users/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.data.success === true) {
                toast.success(response.data.message || t("Users imported successfully"));
                onClose();
                if (onSubmitSuccess) {
                    onSubmitSuccess();
                }
            } else {
                if (Array.isArray(response.data.success) && response.data.success.length > 0) {
                    response.data.success.forEach(message => {
                        toast.error(message);
                    });
                }
                else if (response.data.errors && typeof response.data.errors === 'object') {
                    Object.entries(response.data.errors).forEach(([field, messages]) => {
                        if (Array.isArray(messages)) {
                            messages.forEach(message => {
                                toast.error(`${field}: ${message}`);
                            });
                        } else {
                            toast.error(`${field}: ${messages}`);
                        }
                    });
                }
                else if (response.data.message) {
                    toast.error(response.data.message);
                } else {
                    toast.error(t("An error occurred during import"));
                }
            }
        } catch (error) {
            if (error.response) {
                const responseData = error.response.data;
                if (responseData && Array.isArray(responseData.success) && responseData.success.length > 0) {
                    responseData.success.forEach(message => {
                        toast.error(message);
                    });
                }
                else if (responseData && responseData.errors) {
                    if (typeof responseData.errors === 'object') {
                        Object.values(responseData.errors).flat().forEach(errMsg => {
                            toast.error(errMsg);
                        });
                    } else if (Array.isArray(responseData.errors)) {
                        responseData.errors.forEach(errMsg => toast.error(errMsg));
                    }
                }
                else if (responseData && responseData.message) {
                    toast.error(responseData.message);
                } else {
                    toast.error(error.response.statusText || t("An error occurred"));
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
        if (document.getElementById('user-import-file')) {
            document.getElementById('user-import-file').value = '';
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const downloadTemplate = () => {
        const templateData = [
            ['name', 'email', 'phone', 'country_code', 'role', 'branches', 'stations', 'hubs', 'password'],
            ['John Doe', 'john@example.com', '91234567', '+968', 'User', 'Main Branch', 'Downtown Station', 'Central Hub', 'Password123'],
            ['Jane Smith', 'jane@example.com', '92345678', '+968', 'User', '', 'Station A, Station B', '', 'Password123'],
            ['Ahmed Ali', 'ahmed@example.com', '93456789', '+968', 'User', '', '', 'Hub North', 'Password123'],
            ['Maria Garcia', 'maria@example.com', '94567890', '+968', 'User', 'Branch East', 'Station West', '', 'Password123']
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
        link.setAttribute('download', 'users_import_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="sm:max-w-2xl bg-background text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-foreground">{t("Import Users")}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="user-import-file" className="text-foreground">
                            {t("Select Excel File")}
                        </Label>
                        <Input
                            id="user-import-file"
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
                            <li>• <strong>{t("Required columns")}:</strong> name, email, role, password</li>
                            <li>• <strong>{t("Optional columns")}:</strong> phone, country_code, branches, stations, hubs</li>
                            <li>• <strong>{t("Password requirements")}:</strong> {t("At least 8 characters, one uppercase, one lowercase, one number")}</li>
                            <li>• <strong>{t("Phone format")}:</strong> {t("Egypti phone number (e.g., 91234567)")}</li>
                            <li>• <strong>{t("Country code")}:</strong> {t("e.g., +968 for Egypt")}</li>
                            <li>• <strong>{t("Multiple values")}:</strong> {t("Separate with commas (e.g., Branch A, Branch B)")}</li>
                            <li>• <strong>{t("Available roles")}:</strong> Super Admin, HubAdmin, Branch Admin, Station Admin, User</li>
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

                    <div className="p-4 bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">
                            {t("Important Notes")}
                        </h4>
                        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                            <li>• {t("Emails must be unique across the system")}</li>
                            <li>• {t("Phone numbers must follow Egypti format")}</li>
                            <li>• {t("Role names must match exactly with available roles")}</li>
                            <li>• {t("Branch/Station/Hub names must exist in the system")}</li>
                            <li>• {t("Passwords will be encrypted before storage")}</li>
                            <li>• {t("Large files may take several minutes to process")}</li>
                        </ul>
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

export default UserImportDialog;