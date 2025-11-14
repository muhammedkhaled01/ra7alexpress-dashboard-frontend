import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

function ViewItems({ record, onSubmitSuccess, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [checklist, setChecklist] = useState(null);
  const [loadingItemId, setLoadingItemId] = useState(null);

  const { t } = useTranslation();

  useEffect(() => {
    if (record) {
      fetchChecklistDetails();
    }
  }, [record]);

  const fetchChecklistDetails = async () => {
    setIsLoading(true);
    try {
      const response = await axiosMerchant.get(`compliance-checklists/show/${record.id}`);
      if (response.data.success) {
        setChecklist(response.data.data);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemToggle = async (itemId, currentStatus) => {
    setLoadingItemId(itemId);
    try {
      const response = await axiosMerchant.post(
        `compliance-checklists/${record.id}/items/${itemId}/mark`,
        { is_completed: !currentStatus }
      );
      
      if (response.data.success) {
        toast.success(t('Item status updated successfully'));
        // Update the local state
        setChecklist(response.data.data.checklist);
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingItemId(null);
    }
  };

  const getStatusBadge = (status) => {
    return (
      <Badge
        variant={status === 'Compliant' ? 'default' : 'destructive'}
        className={status === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
      >
        {status === 'Compliant' ? (
          <CheckCircle className="w-3 h-3 mr-1" />
        ) : (
          <XCircle className="w-3 h-3 mr-1" />
        )}
        {t(status)}
      </Badge>
    );
  };

  const completedCount = checklist?.items?.filter(item => item.is_completed)?.length || 0;
  const totalCount = checklist?.items?.length || 0;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("Checklist Items")} - {record?.name}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : checklist ? (
          <div className="space-y-4">
            {/* Checklist Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-gray-600 dark:text-white">{t("Category")}</h3>
                  <p className="text-lg">{checklist.category}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-600 dark:text-white">{t("Status")}</h3>
                  <div className="mt-1">
                    {getStatusBadge(checklist.status)}
                  </div>
                </div>
                <div>
                    <h3 className="font-semibold text-sm text-gray-600 dark:text-white">{t("Progress")}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="bg-gray-200 rounded-full h-2 flex-1">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {completedCount}/{totalCount} ({completionPercentage}%)
                    </span>
                  </div>
                </div>
              </div>
              
              {checklist.last_completed && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="font-semibold text-sm text-gray-600 dark:text-white">{t("Last Completed")}</h3>
                    <p className="text-sm text-gray-700 dark:text-white flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(checklist.last_completed).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Checklist Items */}
            <div>
              <h3 className="font-semibold text-lg mb-3">{t("Checklist Items")}</h3>
              <div className="space-y-2">
                {checklist.items && checklist.items.length > 0 ? (
                  checklist.items.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 border rounded-lg transition-colors duration-200 ${
                        item.is_completed 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`item-${item.id}`}
                          checked={item.is_completed}
                          disabled={loadingItemId === item.id}
                          onCheckedChange={() => handleItemToggle(item.id, item.is_completed)}
                          className="h-5 w-5"
                        />
                        <label
                          htmlFor={`item-${item.id}`}
                          className={`flex-grow cursor-pointer text-sm ${
                            item.is_completed 
                              ? 'line-through text-gray-500 dark:text-white' 
                            : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {item.description}
                        </label>
                        {loadingItemId === item.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                        <div className="flex items-center">
                          {item.is_completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>{t("No items found for this checklist")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Completion Status Info */}
            {checklist.items && checklist.items.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>{t("Note")}:</strong> {' '}
                  {completionPercentage === 100 
                    ? t("All items are completed! This checklist is now compliant.")
                    : t("Complete all items to mark this checklist as compliant.")
                  }
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>{t("Unable to load checklist details")}</p>
          </div>
        )}
        
        <div className="flex justify-end gap-x-2 mt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t("Close")}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ViewItems; 