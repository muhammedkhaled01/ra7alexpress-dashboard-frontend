import PropTypes from 'prop-types';
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosMerchant from "@/axios";
import { useDispatch, useSelector } from "react-redux";
import { getDrivers } from "@/stores/features/ajaxFeature";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible';
import Select from "@/components/misc/Select";
import { driverName } from '@/utils/helpers';

function SalaryBillManagementFilters({
  searchTerm,
  filters,
  itemsPerPage,
  setItemsPerPage,
  setFilters,
  onSearchTermChange,
  onReset,
  onSearchSubmit
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const drivers = useSelector((store) => store.ajax.drivers);
  const [companies, setCompanies] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const Icon = isOpen ? ChevronUp : ChevronDown;

  useEffect(() => {
    if (!drivers) dispatch(getDrivers());
  }, [dispatch, drivers]);

  const fetchCompanies = useCallback(() => {
    axiosMerchant.get(`companies`).then((response) => {
      setCompanies(response.data.data.data.map(company => ({
        value: company.id,
        label: company.name
      })));
    }).catch((error) => {
      console.error('Error fetching companies:', error);
    });
  }, []);

  const fetchHubs = useCallback(async () => {
    try {
      const response = await axiosMerchant.get("/hubs/all");
      setHubs(
        response.data.data.map((hub) => ({
          value: hub.id,
          label: hub.name,
        }))
      );
    } catch (error) {
      console.error('Error fetching hubs:', error);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axiosMerchant.get("/employees");
      setEmployees(
        response.data.data.map((employee) => ({
          value: employee.id,
          label: employee.name,
        }))
      );
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, []);
  useEffect(() => {
    fetchCompanies();
    fetchHubs();
    fetchEmployees();
  }, [fetchCompanies, fetchHubs, fetchEmployees]);

  const firstRowFields = (
    <>
      {/* Statement ID */}
      <div className="col-span-2 flex flex-col gap-1">
        <Label>{t('Statement ID')}</Label>
        <Input
          type="text"
          value={searchTerm}
          placeholder={t('Enter Statement ID')}
          onChange={(e) => {
            onSearchTermChange(e.target.value);
            const timer = setTimeout(() => {
              searchTerm.trim() !== "" ? onSearchSubmit() : onSearchSubmit();
            }, 500);
            return () => clearTimeout(timer);
          }}
        />
      </div>

      {/* Date Range */}
      <div className="col-span-4 flex flex-col gap-1">
        <Label>{t('Date Range')}</Label>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => {
              const dateValue = e.target.value;
              setFilters(prev => ({ ...prev, dateFrom: dateValue }));
              onSearchSubmit();
            }}
          />
          <span className="text-gray-500 text-center">{t('To')}</span>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => {
              const dateValue = e.target.value;
              setFilters(prev => ({ ...prev, dateTo: dateValue }));
              onSearchSubmit();
            }}
          />
        </div>
      </div>
    </>
  );

  const additionalFields = (
    <>

      {/* Status */}
      <div className="col-span-2 flex flex-col gap-1">
        <Label>{t('Status')}</Label>
        <Select
          value={filters.status ? { value: filters.status, label: filters.status === 'pending' ? t('Pending') : t('Paid') } : null}
          onChange={(selectedOption) => {
            setFilters(prev => ({ ...prev, status: selectedOption?.value }));
            onSearchSubmit();
          }}
          options={[
            { value: 'pending', label: t('Pending') },
            { value: 'paid', label: t('Paid') }
          ]}
          placeholder={t('Select Status...')}
          isClearable={true}
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
      {/* Company */}
      <div className="col-span-2 flex flex-col gap-1">
        <Label>{t('Company')}</Label>
        <Select
          value={filters.company ? { value: filters.company, label: companies?.find(c => c.value === filters.company)?.label || '' } : null}
          onChange={(selectedOption) => {
            setFilters(prev => ({ ...prev, company: selectedOption?.value }));
            onSearchSubmit();
          }}
          options={companies}
          placeholder={t('Select Company...')}
          noOptionsMessage={() => t('No companies available')}
          isClearable={true}
        />
      </div>
      {/* Hub */}
      <div className="col-span-2 flex flex-col gap-1">
        <Label>{t('Hub')}</Label>
        <Select
          value={filters.hub ? { value: filters.hub, label: hubs?.find(h => h.value === filters.hub)?.label || '' } : null}
          onChange={(selectedOption) => {
            setFilters(prev => ({ ...prev, hub: selectedOption?.value }));
            onSearchSubmit();
          }}
          options={hubs}
          placeholder={t('Select Hub...')}
          noOptionsMessage={() => t('No hubs available')}
          isClearable={true}
        />
      </div>

      {/* Employee */}
      <div className="col-span-2 flex flex-col gap-1">
        <Label>{t('Employee')}</Label>
        <Select
          value={filters.driver ? {
            value: filters.driver,
            label: drivers?.find(d => d.id === filters.driver)?.name || ''
          } : null}
          onChange={(selectedOption) => {
            setFilters(prev => ({ ...prev, driver: selectedOption?.value }));
            onSearchSubmit();
          }}
          options={drivers?.map((driver) => ({
            value: driver.id,
            label: driverName(driver),
          }))}
          placeholder={t('Select Driver...')}
          noOptionsMessage={() => t('No drivers available')}
          isClearable={true}
        />
      </div>

    </>
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="bg-white dark:bg-muted shadow-md rounded-lg">
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-y-4 md:gap-4">
          {additionalFields}
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
              <div className="grid grid-cols-1 md:grid-cols-6 gap-y-4 md:gap-4 mt-4">
                {firstRowFields}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Collapsible>
  );
}

SalaryBillManagementFilters.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired,
  onSearchTermChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  setItemsPerPage: PropTypes.func.isRequired,
  itemsPerPage: PropTypes.bool.isRequired,
};

export default SalaryBillManagementFilters;
