import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosMerchant from "@/axios";
import { toast } from 'react-hot-toast';
import { Loader2, Download, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { handleError, printExportData } from "@/utils/helpers";
import moment from "moment";

function ExportData({
  model,
  endpoint,
  onClose,
  title = "Export Data",
  fields = [],
  filters = [],
  defaultFormat = "csv"
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [exportFormat, setExportFormat] = useState(defaultFormat);
  const [dateRange, setDateRange] = useState({
    from: moment().subtract(6, 'months').format('YYYY-MM-DD'),
    to: moment().format('YYYY-MM-DD')
  });

  const [filterValues, setFilterValues] = useState({});
  const { t } = useTranslation();

  useEffect(() => {
    if (fields && fields.length > 0) {
      setSelectedColumns(fields.map(field => field.key));
    }
  }, [fields]);

  // Initialize filter values
  useEffect(() => {
    if (filters && filters.length > 0) {
      const initialValues = {};
      filters.forEach(filter => {
        initialValues[filter.key] = filter.defaultValue || '';
      });
      setFilterValues(initialValues);
    }
  }, [filters]);

  const handleColumnToggle = (columnKey) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnKey)) {
        return prev.filter(key => key !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedColumns(fields.map(field => field.key));
  };

  const handleDeselectAll = () => {
    setSelectedColumns([]);
  };

  const handleFilterChange = (key, value) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (selectedColumns.length === 0) {
      toast.error(t("Please select at least one column"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosMerchant.post(
        endpoint || `${model}/export`,
        {
          format: exportFormat,
          columns: selectedColumns,
          from_date: dateRange.from || undefined,
          to_date: dateRange.to || undefined,
          ...filterValues,
        },
        { responseType: exportFormat === 'pdf' ? 'json' : 'blob' }
      );

      console.log(response)

      if (exportFormat === 'pdf') {
        // PDF handling
        printExportData(response.data.html);
      } else {
        // Excel/CSV handling
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${model}_export_${new Date().toISOString().slice(0, 10)}.${exportFormat}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }

      toast.success(t("Export completed successfully"));
      onClose();
    } catch (error) {
      handleError(error);
      console.error("Export failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-full md:max-w-[600px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title || t("Export Data")}</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Range */}
          <div>
            <label className="text-sm text-gray-500 mb-1 block">{t("Date")}</label>
            <div className="flex flex-col md:flex-row gap-2 items-center">
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-full"
              />
              <span className="text-gray-500">{t("to")}</span>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>

          {/* Custom Filters */}
          {filters.map(filter => (
            <div key={filter.key}>
              <label className="text-sm text-gray-500 mb-1 block">{filter.label}</label>
              {filter.type === 'select' ? (
                <Select
                  value={filterValues[filter.key]}
                  onValueChange={(value) => handleFilterChange(filter.key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filter.placeholder || t("Select option")} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={filter.type || 'text'}
                  value={filterValues[filter.key]}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  placeholder={filter.placeholder}
                />
              )}
            </div>
          ))}

          {/* File Type Selection */}
          <div>
            <label className="text-sm text-gray-500 mb-1 block">{t("Select File Type")}</label>
            <div className="grid grid-cols-6 gap-1">
              {['CSV', 'PDF'].map(format => (
                <Button
                  key={format}
                  type="button"
                  variant={exportFormat.toUpperCase() === format ? "default" : "outline"}
                  onClick={() => setExportFormat(format.toLowerCase())}
                  className="w-full"
                >
                  {format}
                </Button>
              ))}
            </div>
          </div>

          {/* Column Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-gray-500">{t("Select Columns")}</label>
              <div className="space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                  {t("Select All")}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll}>
                  {t("Deselect All")}
                </Button>
              </div>
            </div>

            <div className="max-h-[200px] overflow-y-auto border rounded-md p-2">
              {fields.map((field) => (
                <div key={field.key} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={`column-${field.key}`}
                    checked={selectedColumns.includes(field.key)}
                    onCheckedChange={() => handleColumnToggle(field.key)}
                  />
                  <label
                    htmlFor={`column-${field.key}`}
                    className="text-sm cursor-pointer"
                  >
                    {t(field.label) || t(field.key)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-x-2 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || selectedColumns.length === 0}
              className=""
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {t("Download")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ExportData;
