import PropTypes from 'prop-types';
import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import Select from "@/components/misc/Select";
import { Label } from "@/components/ui/label";
import { RefreshCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DateTimeRangePicker } from '@/components/misc/DateTimeRangePicker';

function CODCollectionFilter({
  drivers,
  itemsPerPage,
  setItemsPerPage,
  companies,
  selectedDriver,
  selectedCompany,
  manifestId,
  dateRange,
  createTimeRange,
  onDriverChange,
  onCompanyChange,
  onManifestIdChange,
  onDateRangeChange,
  onCreateTimeRangeChange,
  onReset,
  tabName,
}) {

  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const Icon = isOpen ? ChevronUp : ChevronDown;
  // Fields grouped by visual rows (first row, rest)
  const firstRowFields = (
    <>
      {/* Manifest ID */}
      <div className="col-span-2 flex flex-col gap-1">
        <Label>{t('Manifest ID')}</Label>
        <Input
          value={manifestId}
          onChange={(e) => onManifestIdChange(e.target.value)}
          placeholder={t('Enter manifest IDs')}
        />
      </div>

      {/* Show */}
      <div className="col-span-2 flex flex-col gap-1">
        <Label>{t('Show')}</Label>
        <Select
          value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
          onChange={(selectedOption) => {
            setItemsPerPage(Number(selectedOption.value));
          }}
          options={[
            { value: 5, label: '5' },
            { value: 8, label: '8' },
            { value: 15, label: '15' },
            { value: 25, label: '25' },
            { value: 50, label: '50' },
            { value: 100, label: '100' }
          ]}
          className="w-20 text-sm"
          isSearchable={false}
        />
      </div>

      {/* Driver */}
      <div className="col-span-2 flex flex-col gap-1">
        <Label>{t('Driver')}</Label>
        <Select
          value={selectedDriver ? { value: selectedDriver, label: drivers?.find(d => d.id === selectedDriver)?.name || '' } : null}
          onChange={(selectedOption) => onDriverChange(selectedOption?.value)}
          options={drivers?.map(driver => ({
            value: driver?.id,
            label: driver?.name
          })) || []}
          placeholder={t('Select Driver...')}
          noOptionsMessage={() => t('No drivers available')}
          isClearable={true}
        />
      </div>

    </>
  );
  const handleDateRangeChange = (key, value) => onDateRangeChange((prev) => ({ ...prev, [key]: value }));
  const handleCreateTimeRangeChange = (key, value) => onCreateTimeRangeChange((prev) => ({ ...prev, [key]: value }));
  const additionalFields = (
    <>
      {/* Date Range */}
      {/* Company */}
      <div className="col-span-2 flex flex-col gap-1">
        <Label>{t('Company')}</Label>
        <Select
          value={selectedCompany ? { value: selectedCompany, label: companies?.find(c => c.id === selectedCompany)?.name || '' } : null}
          onChange={(selectedOption) => onCompanyChange(selectedOption?.value)}
          options={companies?.map(company => ({
            value: company.id,
            label: company.name
          })) || []}
          placeholder={t('Select Company...')}
          noOptionsMessage={() => t('No companies available')}
          isClearable={true}
        />
      </div>
      <div className="col-span-3 flex flex-col gap-1">
        <Label>{t('Receive Date Range')}</Label>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <DateTimeRangePicker
            filters={{
              from: dateRange.from,
              to: dateRange.to,
              from_time: dateRange.from_time,
              to_time: dateRange.to_time,
            }}
            onChange={handleDateRangeChange}
            t={t}
          />
        </div>
      </div>
      {tabName === "completed" && (
        <div className="col-span-3 flex flex-col gap-1">
          <Label>{t('Manifest Create Time Range')}</Label>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <DateTimeRangePicker
              filters={{
                from: createTimeRange.from,
                to: createTimeRange.to,
                from_time: createTimeRange.from_time,
                to_time: createTimeRange.to_time,
              }}
              onChange={handleCreateTimeRangeChange}
              t={t}
            />
          </div>
        </div>
      )}

      {/* Confirm Time */}
      {/* <div className="col-span-3 flex flex-col gap-1">
        <Label>{t('Confirm Time Range')}</Label>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <Input
            type="date"
            value={confirmTimeRange.from}
            onChange={(e) => onConfirmTimeRangeChange(prev => ({ ...prev, from: e.target.value }))}
          />
          <span className="text-gray-500 text-center">{t('To')}</span>
          <Input
            type="date"
            value={confirmTimeRange.to}
            onChange={(e) => onConfirmTimeRangeChange(prev => ({ ...prev, to: e.target.value }))}
          />
        </div>
      </div> */}
    </>
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="bg-white dark:bg-muted shadow-md rounded-lg">
      <CollapsibleTrigger asChild>
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 rounded-t-lg">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{t('Filter')}</h2>
          </div>
          <Button variant="refresh" onClick={onReset}>
            <RefreshCcw />
          </Button>
        </div>
      </CollapsibleTrigger>

      <div className="p-4">
        <div className="grid grid-cols-1 relative md:grid-cols-6 gap-y-4 md:gap-4">
          {firstRowFields}
          <Icon onClick={() => setIsOpen(!isOpen)} className={`w-5 ${isOpen ? "opacity-0" : "opacity-100"} h-5 absolute -bottom-5 left-1/2 -translate-x-1/2 transition-all duration-300 cursor-pointer`} />
        </div>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="additional"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="grid relative grid-cols-1 md:grid-cols-6 gap-y-4 md:gap-4 mt-4">
                {additionalFields}
                <Icon onClick={() => setIsOpen(!isOpen)} className={`w-5 ${isOpen ? "opacity-100" : "opacity-0"} h-5 absolute -bottom-5 left-1/2 -translate-x-1/2 transition-all duration-300 cursor-pointer`} />

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Collapsible>
  );
}

CODCollectionFilter.propTypes = {
  drivers: PropTypes.array.isRequired,
  companies: PropTypes.array.isRequired,
  selectedDriver: PropTypes.string,
  selectedCompany: PropTypes.string,
  manifestId: PropTypes.string,
  dateRange: PropTypes.shape({
    from: PropTypes.string,
    to: PropTypes.string,
    from_time: PropTypes.string,
    to_time: PropTypes.string,
  }).isRequired,
  createTimeRange: PropTypes.shape({
    from: PropTypes.string,
    to: PropTypes.string,
    from_time: PropTypes.string,
    to_time: PropTypes.string,
  }).isRequired,
  confirmTimeRange: PropTypes.shape({
    from: PropTypes.string,
    to: PropTypes.string
  }).isRequired,
  onDriverChange: PropTypes.func.isRequired,
  onCompanyChange: PropTypes.func.isRequired,
  onManifestIdChange: PropTypes.func.isRequired,
  onDateRangeChange: PropTypes.func.isRequired,
  onCreateTimeRangeChange: PropTypes.func.isRequired,
  onConfirmTimeRangeChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  tabName: PropTypes.string,
  setItemsPerPage: PropTypes.func.isRequired,
  itemsPerPage: PropTypes.bool.isRequired,
};

export default CODCollectionFilter;
