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
import {
  Download,
  EditIcon,
  EyeIcon,
  Filter,
  MoreHorizontal,
  Pencil,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import { can, handleError, hasRole } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import ExportDialog from "@/components/misc/ExportDialog";
import Search from "@/components/misc/Search";

const SafetyIncidentIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [incidents, setIncidents] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);

  // Edit & Delete & Pagination Logic - Start
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Safety Incident access");
  const createAbility = can("Safety Incident create");
  const updateAbility = can("Safety Incident update");
  const deleteAbility = can("Safety Incident delete");

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

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Edit & Delete & Pagination Logic - End

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
    fetchIncidents(currentPage);
  }, [currentPage]);

  const fetchIncidents = async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`safety-incidents?page=${pageNumber}`);
      setLinks(response.data.data.links);
      setIncidents(response.data.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!search || search.trim() === "") {
      return;
    }
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.get(`safety-incidents?query=${search}`);
      setIncidents(response.data.data);
      setLinks([]);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    fetchIncidents();
  };

  const handleSubmitSuccess = () => {
    fetchIncidents(currentPage);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      search.trim() !== "" ? setRefreshBtn(true) : setRefreshBtn(false)
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const getSeverityBadge = (severity) => {
    const colors = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[severity] || 'bg-gray-100 text-gray-800'}`}>
        {t(severity)}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Open': 'bg-blue-100 text-blue-800',
      'Under Investigation': 'bg-orange-100 text-orange-800',
      'Resolved': 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {t(status)}
      </span>
    );
  };

  return (
    <div>
      <PageTitle title={t("Safety Incidents")} />
      <div className="flex flex-wrap gap-3 mt-2 justify-between">
        <div>
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div>
        <div className="flex flex-row gap-x-2">
          <Search
            searchValue={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            onSearchSubmit={handleSearch}
            onRefresh={handleRefresh}
            showRefresh={refreshBtn}
            placeholder={t("Search Safety Incidents")}
          />
          <Button variant="download" type="button" onClick={e => setShowExport(true)}>
            <Download />
          </Button>
        </div>
      </div >

      <div className="shadow-md py-4 mt-2 rounded-lg">
        {loading ? (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : incidents && incidents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">#</TableHead>
                <TableHead>{t("Occurred At")}</TableHead>
                <TableHead>{t("Location")}</TableHead>
                <TableHead>{t("Description")}</TableHead>
                <TableHead>{t("Severity")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead>{t("Reported By")}</TableHead>
                <TableHead className="text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    {new Date(incident.occurred_at).toLocaleDateString()} {new Date(incident.occurred_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>{incident.location}</TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={incident.description}>
                      {incident.description}
                    </div>
                  </TableCell>
                  <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                  <TableCell>{getStatusBadge(incident.status)}</TableCell>
                  <TableCell>{incident.reported_by?.name || t("Unknown")}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">{t("Open menu")}</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate(`/safety-incidents/${incident.id}`)}>
                          <EyeIcon className="mr-2 h-4 w-4" />
                          {t("View")}
                        </DropdownMenuItem>
                        {updateAbility && (
                          <DropdownMenuItem onClick={() => openEditDialog(incident)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("Edit")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {deleteAbility && (
                          <DropdownMenuItem onClick={() => openDeleteAlert(incident)}>
                            <Trash2Icon className="mr-2 h-4 w-4" />
                            {t("Delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <NoRecordFound />
        )}
      </div>

      {incidents.length > 0 && links.length > 1 && (
        <Pagination
          links={links}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}

      {editDialogOpen && (
        <Edit
          open={editDialogOpen}
          onClose={closeEditDialog}
          record={selectedRecord}
          onSubmitSuccess={handleSubmitSuccess}
        />
      )}

      {deleteAlert && (
        <DeleteAlert
          open={deleteAlert}
          onClose={closeDeleteAlert}
          onDelete={async () => {
            try {
              await axiosMerchant.post("safety-incidents/delete", {
                id: selectedRecord.id,
              });
              handleSubmitSuccess();
              closeDeleteAlert();
            } catch (error) {
              handleError(error);
            }
          }}
        />
      )}

      {showExport && (
        <ExportDialog
          open={showExport}
          onClose={() => setShowExport(false)}
          endpoint="safety-incidents/export"
          filename="safety_incidents"
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'occurred_at', label: 'Occurred At' },
            { key: 'location', label: 'Location' },
            { key: 'description', label: 'Description' },
            { key: 'severity', label: 'Severity' },
            { key: 'status', label: 'Status' },
            { key: 'reportedBy.name', label: 'Reported By' },
            { key: 'assignedTo.name', label: 'Assigned To' },
            { key: 'investigation_notes', label: 'Investigation Notes' },
            { key: 'created_at', label: 'Created At' },
            { key: 'updated_at', label: 'Updated At' }
          ]}
        />
      )}
    </div>
  );
};

export default SafetyIncidentIndex; 