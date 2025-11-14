import PropTypes from 'prop-types';
import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

function SalaryBillDetails({
  searchTerm,
  filters,
  hubs,
  companies,
  onSearchTermChange,
  onFiltersChange,
  onReset
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const Icon = isOpen ? ChevronUp : ChevronDown;
  const firstRowFields = (
    <>
      {/* Statement ID */}
      <div className="col-span-2 flex flex-col gap-1">
        <Label>{t('Statement ID')}</Label>
        <Input
          type="text"
          placeholder={t('Statement ID')}
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>

      {/* Status */}
      <div className="col-span-2 flex flex-col gap-1">
        <Label>{t('Status')}</Label>
        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange(prev => ({ ...prev, status: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('Select Status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paid">{t('Paid')}</SelectItem>
            <SelectItem value="pending">{t('Pending')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hub */}
      <div className="col-span-2 flex flex-col gap-1">
        <Label>{t('Hub')}</Label>
        <Select
          value={filters.hub}
          onValueChange={(value) => onFiltersChange(prev => ({ ...prev, hub: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('Select Hub')} />
          </SelectTrigger>
          <SelectContent>
            {(hubs || []).map(hub => (
              <SelectItem key={hub?.id || ''} value={(hub?.id || '').toString()}>
                {hub?.name || ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Company */}
      <div className="col-span-2 flex flex-col gap-1">
        <Label>{t('Company')}</Label>
        <Select
          value={filters.company}
          onValueChange={(value) => onFiltersChange(prev => ({ ...prev, company: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('Select Company...')} />
          </SelectTrigger>
          <SelectContent>
            {(companies || []).map(company => (
              <SelectItem key={company?.id || ''} value={(company?.id || '').toString()}>
                {company?.name || ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );

  const additionalFields = (
    <>
      {/* Statement Date */}
      <div className="col-span-4 flex flex-col gap-1">
        <Label>{t('Statement Date')}</Label>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <Input
            type="datetime-local"
            value={filters.statementDateFrom}
            onChange={e => onFiltersChange(prev => ({ ...prev, statementDateFrom: e.target.value }))}
            placeholder={t('From')}
          />
          <span className="text-gray-500 text-center">{t('To')}</span>
          <Input
            type="datetime-local"
            value={filters.statementDateTo}
            onChange={e => onFiltersChange(prev => ({ ...prev, statementDateTo: e.target.value }))}
            placeholder={t('To')}
          />
        </div>
      </div>

      {/* Create Time */}
      <div className="col-span-4 flex flex-col gap-1">
        <Label>{t('Create Time')}</Label>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <Input
            type="datetime-local"
            value={filters.createTimeFrom}
            onChange={e => onFiltersChange(prev => ({ ...prev, createTimeFrom: e.target.value }))}
            placeholder={t('From')}
          />
          <span className="text-gray-500 text-center">{t('To')}</span>
          <Input
            type="datetime-local"
            value={filters.createTimeTo}
            onChange={e => onFiltersChange(prev => ({ ...prev, createTimeTo: e.target.value }))}
            placeholder={t('To')}
          />
        </div>
      </div>
    </>
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="bg-white dark:bg-muted shadow-md rounded-lg overflow-hidden">
      <CollapsibleTrigger asChild>
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 rounded-t-lg">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{t('Filter Salary Bill')}</h2>
            <Icon className="w-5 h-5 transition-transform duration-300" />
          </div>
          <Button variant="refresh" onClick={onReset}>
            <RefreshCcw />
          </Button>
        </div>
      </CollapsibleTrigger>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-8 gap-y-4 md:gap-4">
          {firstRowFields}
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
              <div className="grid grid-cols-1 md:grid-cols-8 gap-y-4 md:gap-4 mt-4">
                {additionalFields}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Collapsible>
  );
}

SalaryBillDetails.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  filters: PropTypes.shape({
    status: PropTypes.string,
    hub: PropTypes.string,
    company: PropTypes.string,
    statementDateFrom: PropTypes.string,
    statementDateTo: PropTypes.string,
    createTimeFrom: PropTypes.string,
    createTimeTo: PropTypes.string
  }).isRequired,
  hubs: PropTypes.array.isRequired,
  companies: PropTypes.array.isRequired,
  onSearchTermChange: PropTypes.func.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired
};

export default SalaryBillDetails;
