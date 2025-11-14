import axiosMerchant from "@/axios";
import React, { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "../../NoRecordFound";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  EditIcon,
  EyeIcon,
  Filter,
  MoreHorizontal,
  RefreshCcw,
  Trash2Icon,
  Check,
  Plus,
  Truck,
  Pencil,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import { can, handleError, hasRole } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import ExportDialog from "@/components/misc/ExportDialog";
import Search from "@/components/misc/Search";
import Select from "@/components/misc/Select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTrucks } from "@/stores/features/ajaxFeature";
import { useSelector, useDispatch } from "react-redux";
import moment from '@/utils/moment';

const MaintenanceScheduleIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [schedules, setSchedules] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);

  const dispatch = useDispatch();
  const trucks = useSelector(state => state.ajax.trucks);
  const trucksLoading = useSelector(state => state.ajax.loading);

  useEffect(() => {
    if (!trucks || trucks.length === 0) {
      dispatch(getTrucks());
    }
  }, [dispatch, trucks]);

  // Filters
  const today = moment().format('YYYY-MM-DD');
  const [filters, setFilters] = useState({
    date_from: today,
    date_to: today,
    maintenance_type: '',
    status: '',
    truck_id: ''
  });

  // Edit & Delete & Pagination Logic - Start
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Maintenance Schedule access");
  const createAbility = can("Maintenance Schedule create");
  const updateAbility = can("Maintenance Schedule update");
  const deleteAbility = can("Maintenance Schedule delete");

  // DELETE ALERT
  const openDeleteAlert = (record) => {
    setselectedRecord(record);
    setDeleteAlert(true);
  };

  const closeDeleteAlert = () => {
    setselectedRecord(null);
    setDeleteAlert(false);
  };

  const openEditDialog = (record) => {
    setselectedRecord(record);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setselectedRecord(null);
    setEditDialogOpen(false);
  };

  const openCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Edit & Delete & Pagination Logic - End

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
    fetchSchedules(currentPage);
  }, [currentPage]);



  const fetchSchedules = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Add pagination
      params.append('page', pageNumber);

      // Add search query
      if (search && search.trim()) {
        params.append('query', search.trim());
      }

      // Add filters
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.maintenance_type) params.append('maintenance_type', filters.maintenance_type);
      if (filters.status) params.append('status', filters.status);
      if (filters.truck_id) params.append('truck_id', filters.truck_id);

      const url = `maintenance-schedules?${params.toString()}`;
      const response = await axiosMerchant.get(url);

      // Handle both paginated and non-paginated responses
      if (response.data.data && typeof response.data.data === 'object' && response.data.data.links) {
        // Paginated response
        setLinks(response.data.data.links);
        setSchedules(response.data.data.data || []);
      } else if (Array.isArray(response.data.data)) {
        // Non-paginated response (search results or direct array)
        setSchedules(response.data.data);
        setLinks([]);
      } else {
        // Fallback for unexpected response structure
        setSchedules([]);
        setLinks([]);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) {
      e.preventDefault();
    }
    setCurrentPage(1);
    await fetchSchedules(1);
  };

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    setCurrentPage(1);
    setFilters({
      date_from: today,
      date_to: today,
      maintenance_type: '',
      status: '',
      truck_id: ''
    });
    fetchSchedules(1);
  };

  const handleSubmitSuccess = () => {
    fetchSchedules(currentPage);
    // Refresh trucks data if needed
    dispatch(getTrucks());
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleMarkComplete = async (record) => {
    try {
      await axiosMerchant.post('maintenance-schedules/mark-complete', {
        id: record.id
      });
      handleSubmitSuccess();
    } catch (error) {
      handleError(error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeVariant = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  const getMaintenanceTypeLabel = (type) => {
    const types = {
      'oil_change': 'Oil Change',
      'tire_replacement': 'Tire Replacement',
      'brake_service': 'Brake Service',
      'general_inspection': 'General Inspection',
      'filter_change': 'Filter Change',
      'others': 'Others'
    };
    return types[type] || type;
  };

  // Options for filters
  const maintenanceTypeOptions = [
    { value: '', label: t('All Types') },
    { value: 'oil_change', label: t('Oil Change') },
    { value: 'tire_replacement', label: t('Tire Replacement') },
    { value: 'brake_service', label: t('Brake Service') },
    { value: 'general_inspection', label: t('General Inspection') },
    { value: 'filter_change', label: t('Filter Change') },
    { value: 'others', label: t('Others') }
  ];

  const statusOptions = [
    { value: '', label: t('All Statuses') },
    { value: 'pending', label: t('Pending') },
    { value: 'completed', label: t('Completed') },
    { value: 'overdue', label: t('Overdue') }
  ];

  // Generate truck options for filter
  const truckOptions = [
    { value: '', label: t('All Trucks') },
    ...(trucks || []).map(truck => ({
      value: truck.id?.toString() || '',
      label: `${truck.barcode || 'N/A'} - ${truck.number_plate || 'N/A'} ${truck.company ? `(${truck.company})` : ''}`
    }))
  ];

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== "") {
        setRefreshBtn(true);
        handleSearch();
      } else {
        setRefreshBtn(false);
        // If search is cleared, refetch with current filters
        fetchSchedules(1);
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Apply filters when they change
  useEffect(() => {
    setCurrentPage(1);
    fetchSchedules(1);
  }, [filters]);

  return (
    <div>
      <PageTitle title={t("Maintenance Schedule")} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">{t("Total Trucks")}</p>
                <p className="text-2xl font-bold">{trucks ? trucks.length : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-600">{t("Pending")}</p>
                <p className="text-2xl font-bold">
                  {schedules ? schedules.filter(s => s.status === 'pending').length : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 bg-red-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-600">{t("Overdue")}</p>
                <p className="text-2xl font-bold">
                  {schedules ? schedules.filter(s => s.status === 'overdue').length : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-600">{t("Completed")}</p>
                <p className="text-2xl font-bold">
                  {schedules ? schedules.filter(s => s.status === 'completed').length : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 mt-4 justify-between">
        <div>
          {createAbility && (
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              {t("Schedule Maintenance")}
            </Button>
          )}
        </div>
        <div className="flex flex-row gap-x-2">
          <Search
            searchValue={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            onSearchSubmit={handleSearch}
            onRefresh={handleRefresh}
            showRefresh={refreshBtn}
            placeholder={t("Search Maintenance Schedules...")}
          />
          <Button type="button" variant="download" onClick={e => setShowExport(true)}>
            <Download />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t("Filter Schedules")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="input-container">
              <label>{t("Select Truck")}</label>
              <Select
                options={truckOptions}
                value={truckOptions.find(opt => opt.value === filters.truck_id)}
                onChange={(opt) => handleFilterChange('truck_id', opt?.value || '')}
                isLoading={trucksLoading}
                placeholder={t("Select a truck...")}
              />
            </div>
            <div className="input-container">
              <label>{t("From Date")}</label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
            <div className="input-container">
              <label>{t("To Date")}</label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
            <div className="input-container">
              <label>{t("Maintenance Type")}</label>
              <Select
                options={maintenanceTypeOptions}
                value={maintenanceTypeOptions.find(opt => opt.value === filters.maintenance_type)}
                onChange={(opt) => handleFilterChange('maintenance_type', opt?.value || '')}
              />
            </div>
            <div className="input-container">
              <label>{t("Status")}</label>
              <Select
                options={statusOptions}
                value={statusOptions.find(opt => opt.value === filters.status)}
                onChange={(opt) => handleFilterChange('status', opt?.value || '')}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="refresh"
                onClick={handleRefresh}
                title={t("Reset Filters")}
                className="transition-transform duration-500"
              >
                <RefreshCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        {loading ? (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : schedules && schedules.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">#</TableHead>
                  <TableHead>{t("Vehicle ID")}</TableHead>
                  <TableHead>{t("License Plate")}</TableHead>
                  <TableHead>{t("Company")}</TableHead>
                  <TableHead>{t("Maintenance Date")}</TableHead>
                  <TableHead>{t("Maintenance Type")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("Notes")}</TableHead>
                  <TableHead className="text-right">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule, index) => (
                  <TableRow
                    key={schedule.id}
                    className={schedule.status === 'overdue' ? 'bg-red-50/20 dark:bg-red-900/20' : ''}
                  >
                    <TableCell className="font-medium">
                      {(currentPage - 1) * 15 + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{schedule.truck?.barcode || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{schedule.truck?.number_plate || 'N/A'}</TableCell>
                    <TableCell>{schedule.truck?.company || 'N/A'}</TableCell>
                    <TableCell>{formatDate(schedule.scheduled_at)}</TableCell>
                    <TableCell>{getMaintenanceTypeLabel(schedule.maintenance_type)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(schedule.status)}>
                        {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={schedule.notes}>
                      {schedule.notes || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" className="h-10 w-10 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {schedule.status !== 'completed' && updateAbility && (
                            <DropdownMenuItem
                              onClick={() => handleMarkComplete(schedule)}
                            >
                              <Check className="mr-2 h-4 w-4" /> {t("Mark Complete")}
                            </DropdownMenuItem>
                          )}
                          {updateAbility && (
                            <DropdownMenuItem
                              onClick={() => openEditDialog(schedule)}
                            >
                              <Pencil className="mr-2 h-4 w-4" /> {t("Edit")}
                            </DropdownMenuItem>
                          )}
                          {deleteAbility && (
                            <DropdownMenuItem
                              onClick={() => openDeleteAlert(schedule)}
                            >
                              <Trash2Icon className="mr-2 h-4 w-4" /> {t("Delete")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {links && links.length > 0 && (
              <Pagination
                links={links}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <NoRecordFound />
        )}
      </div>

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"maintenance-schedules/delete"}
        />
      )}

      {editDialogOpen && (
        <Edit
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          trucks={trucks}
          onClose={closeEditDialog}
        />
      )}

      {createDialogOpen && (
        <Create
          onSubmitSuccess={handleSubmitSuccess}
          trucks={trucks}
          onClose={closeCreateDialog}
        />
      )}

      {showExport && (
        <ExportDialog
          model="maintenance-schedules"
          endpoint="maintenance-schedules/export"
          fields={[
            { key: "id", label: "ID" },
            { key: "truck.barcode", label: "Vehicle ID" },
            { key: "truck.number_plate", label: "License Plate" },
            { key: "truck.company", label: "Company" },
            { key: "maintenance_type", label: "Maintenance Type" },
            { key: "scheduled_at", label: "Scheduled Date" },
            { key: "status", label: "Status" },
            { key: "notes", label: "Notes" },
            { key: "created_at", label: "Created At" },
            { key: "updated_at", label: "Updated At" },
          ]}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default MaintenanceScheduleIndex; 