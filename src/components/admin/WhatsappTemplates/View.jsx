import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

function View({ record, onClose }) {
  const { t } = useTranslation();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[500px] dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>{t("View WhatsApp Template")}</DialogTitle>
        </DialogHeader>
        <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
          <div>
            <label className="text-sm font-medium mb-1 block dark:text-gray-200">{t("Template Key")}</label>
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-md dark:text-gray-200">
              <span className="font-medium">{record.name}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block dark:text-gray-200">{t("Message Content")}</label>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md whitespace-pre-wrap dark:text-gray-200">
              {record.message}
            </div>
          </div>
          {record.variables && record.variables.length > 0 && (
            <div className="input-container">
              <label className="text-sm font-medium mb-1 block dark:text-gray-200">{t("Available Variables")}</label>
              <div className="flex flex-wrap gap-2 dark:bg-gray-700 dark:text-gray-200">
                {record.variables.map((variable, index) => (
                  <Badge key={index} variant="outline">
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-1 block dark:text-gray-200">{t("Created At")}</label>
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-md dark:text-gray-200">
              {new Date(record.created_at).toLocaleString()}
            </div>
          </div>
          {record.updated_at && (
            <div className="input-container">
              <label className="text-sm font-medium mb-1 block dark:text-gray-200">{t("Updated At")}</label>
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-md dark:text-gray-200">
                {new Date(record.updated_at).toLocaleString()}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-x-2 mt-4">
          <DialogClose asChild>
            <Button variant="secondary">{t("Close")}</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

View.propTypes = {
  record: PropTypes.shape({
    name: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    variables: PropTypes.array,
    created_at: PropTypes.string.isRequired,
    updated_at: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

export default View;
