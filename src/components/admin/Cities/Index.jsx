import axiosMerchant from "@/axios";
import { useCallback, useEffect, useState } from "react";
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

import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import { can, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";

const CityIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);

  // Edit & Delete & Pagination Logic - Start
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("City access");
  const createAbility = can("City create");
  const updateAbility = can("City update");
  const deleteAbility = can("City delete");

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

  const handlePageChange = (pageNumber = currentPage) => {
    setCurrentPage(pageNumber);
  };

  // Edit & Delete & Pagination Logic - End

  const fetchCities = useCallback(async (pageNumber = 1) => {
    if (!accessAbility) {
      navigate("/unauthorized");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axiosMerchant.get('cities/index', {
        params: {
          page: pageNumber,
          per_page: itemsPerPage,
          ...(search && { query: search })
        }
      });
      
      if (response.data.data) {
        setCities(response.data.data.data || []);
        setLinks(response.data.data.links || []);
      } else {
        setCities([]);
        setLinks([]);
      }
    } catch (error) {
      handleError(error);
      setCities([]);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [search, itemsPerPage, accessAbility, navigate]);

  // Initial data fetch
  useEffect(() => {
    fetchCities(currentPage);
  }, [currentPage, fetchCities]);

  const handleSearch = useCallback((e) => {
    e?.preventDefault();
    setCurrentPage(1);
    setRefreshBtn(true);
    fetchCities(1);
  }, [fetchCities]);

  const handleRefresh = useCallback(() => {
    setSearch("");
    setRefreshBtn(false);
    setCurrentPage(1);
    fetchCities(1);
  }, [fetchCities]);

  const handleSubmitSuccess = () => {
    fetchCities(currentPage);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== "") {
        setRefreshBtn(true);
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, handleSearch]);


  return (
    <div>
      <PageTitle title={t("Cities")} />
      <div className="flex flex-wrap justify-between gap-3 mt-2">
        <div>
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex gap-x-2">
              <Input
                name="search"
                type="text"
                className="w-[200px]"
                value={search}
                placeholder={t("Search Cities")}
                onChange={(e) => setSearch(e.target.value)}
                icon={
                  refreshBtn && (
                    <RefreshCcw className="w-4 h-4 cursor-pointer" onClick={handleRefresh} />
                  )
                }
              />
              <Button type="button" variant="refresh" onClick={handleRefresh}>
                <RefreshCcw className="w-4 h-4" />
              </Button>
            </div>
          </form>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              {t("Show")}
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={1000}>1000</option>
            </select>
          </div>
        </div>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableHeader>
          </Table>
        ) : cities && cities.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead isFixed>{t("City")}</TableHead>
                <TableHead>{t("State")}</TableHead>
                <TableHead>{t("Country")}</TableHead>
                {/* <TableHead className="text-right">{t("Actions")}</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cities.map((city, index) => (
                <TableRow key={index}>
                  <TableCell isFixed>
                    {city.name}
                    <div className="flex justify-center gap-x-2 mt-2">
                      {updateAbility && (
                        <Button onClick={() => openEditDialog(city)} variant="edit" size="xs">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        )}
                        {deleteAbility && (
                        <Button onClick={() => openDeleteAlert(city)} variant="delete" size="xs">
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>{city.state?.en_name}</TableCell>
                  <TableCell>{city.state?.country?.name}</TableCell>
                  {/* <TableCell className="text-right"> */}
                    {/* <DropdownMenu> */}
                      {/* <DropdownMenuTrigger asChild> */}
                        {/* <Button variant="secondary" className="h-10 w-10 p-0"> */}
                          {/* <span className="sr-only">Open menu</span> */}
                          {/* <MoreHorizontal className="h-4 w-4" /> */}
                        {/* </Button> */}
                      {/* </DropdownMenuTrigger> */}
                      {/* <DropdownMenuContent align="end"> */}
                        {/* <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel> */}
                        {/* <DropdownMenuSeparator /> */}
                        {/* {updateAbility && ( */}
                          {/* <DropdownMenuItem */}
                            {/* onClick={() => openEditDialog(city)} */}
                          {/* > */}
                            {/* <EditIcon className="p-1" /> {t("Edit")} */}
                          {/* </DropdownMenuItem> */}
                        {/* )} */}
                        {/* {deleteAbility && ( */}
                          {/* <DropdownMenuItem */}
                            {/* onClick={() => openDeleteAlert(city)} */}
                          {/* > */}
                            {/* <Trash2Icon className="p-1" /> {t("Delete")} */}
                          {/* </DropdownMenuItem> */}
                        {/* )} */}
                      {/* </DropdownMenuContent> */}
                    {/* </DropdownMenu> */}
                  {/* </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <NoRecordFound />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </div>
      {links.length > 1 && (
        <Pagination
          links={links}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}
      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api="cities/delete"
        />
      )}
      {editDialogOpen && (
        <Edit
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeEditDialog}
        />
      )}
    </div>
  );
};

export default CityIndex;
