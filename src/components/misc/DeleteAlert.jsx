import { useState } from "react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import axiosMerchant from "@/axios";
import { toast } from 'react-hot-toast';
import { Loader2 } from "lucide-react";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import PropTypes from 'prop-types';

function DeleteAlert({ onSubmitSuccess, record, onClose, api, title, message, multiple = false }) {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation()
    if (!title) title = multiple ? t("Delete Selected") : t("Delete Title");
    if (!message) message = multiple ? t("Are you sure you want to delete the selected items?") : t("Delete Message");
    
    const handleDelete = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        try {
            const response = await axiosMerchant.post(api, multiple ? { ids: record } : {
                id: record?.id,
            });
            toast.success(response.data.message);
            onClose();
            if (onSubmitSuccess) {
                onSubmitSuccess();
            }

        } catch (error) {
            handleError(error)
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={true} onOpenChange={onClose}>
            <AlertDialogTrigger></AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader className="sm:max-w-[1000px]">
                    <AlertDialogTitle>{t(title)}</AlertDialogTitle>
                    <AlertDialogDescription>{typeof message === "string" ? t(message) : message}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t("Delete Cancel")}</AlertDialogCancel>
                    <AlertDialogAction disabled={isLoading} onClick={handleDelete}>
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            t("Delete Continue")
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    );
}

DeleteAlert.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  record: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  api: PropTypes.string.isRequired,
  onSubmitSuccess: PropTypes.func,
  title: PropTypes.string,
  message: PropTypes.string,
  multiple: PropTypes.bool
};

export default DeleteAlert;