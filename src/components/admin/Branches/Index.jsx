import axiosMerchant from "@/axios";
import React, { useEffect, useState, useCallback } from "react";
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
import { Link, useLocation, useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Plus,
  RefreshCcw,
  Sheet,
  Trash2Icon,
} from "lucide-react";
import { can, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import { closeTab } from "@/stores/features/tabsFeature";
import { useDispatch } from "react-redux";
import Select from "@/components/misc/Select";

const BranchIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(8);


  // Edit & Delete & Pagination Logic - Start
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Branch access");
  const createAbility = can("Branch create");
  const updateAbility = can("Branch update");
  const deleteAbility = can("Branch delete");

  // DELETE ALERT
  const openDeleteAlert = (record) => {
    setselectedRecord(record);
    setDeleteAlert(true);
  };

  const closeDeleteAlert = () => {
    setselectedRecord(null);
    setDeleteAlert(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Edit & Delete & Pagination Logic - End

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
    fetchBranches(currentPage);
  }, [currentPage, itemsPerPage]);

  const fetchBranches = async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`branches?page=${pageNumber}&per_page=${itemsPerPage}`);
      setLinks(response.data.data.links);
      setBranches(response.data.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };



  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`branches?query=${search}`);
      setBranches(response.data.data || response.data.data.data);
      setLinks([]);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [search, setLoading, setBranches, setLinks]);
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    if (location.state?.closeTabId) {
      dispatch(closeTab(location.state.closeTabId));
      // Clear the state so it doesnt runagain
      window.history.replaceState(null, document.title);
      handleRefresh();
    }
  }, [location.state, dispatch]);

  useEffect(() => {
    if (location.state?.from === '/branches/create-branch' || location.state?.from === '/branches/edit-branch') {
      handleRefresh();
    }
  }, [location])

  const handleRefresh = () => {
    setSearch("");
    fetchBranches();
  };

  const handleSubmitSuccess = () => {
    fetchBranches(currentPage);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== "") {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, handleSearch]);
  return (
    <div>
      <PageTitle title={t("Branches")} />
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 space-y-4 md:space-y-0">
        <div className="flex justify-start">
          {createAbility && (
            <Link to={"/branches/create-branch"}>
              <Button type="button" className="flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>{t("Create Branch")}</span>
              </Button>
            </Link>
          )}
        </div>

        <form className="flex md:items-center flex-col md:flex-row gap-2" onSubmit={handleSearch}>
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-full md:w-[200px]"
              value={search}
              placeholder={t("Search Branches...")}
              onChange={(e) => setSearch(e.target.value)}
              icon={
                search.trim() !== "" && (
                  <RefreshCcw className="w-4 h-4 cursor-pointer" onClick={handleRefresh} />
                )
              }
            />
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              {t("Show")}
            </label>
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
        </form>
      </div>
      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead isFixed>{t("Name")}</TableHead>
              <TableHead>{t("Hub")}</TableHead>
              <TableHead>{t("Station")}</TableHead>
              <TableHead>{t("Location")}</TableHead>
              <TableHead>{t("Address")}</TableHead>
              <TableHead>{t("Accounts")}</TableHead>
              {/* <TableHead className="text-right">{t("Actions")}</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : branches && branches.length > 0 ? (
              branches.map((branch, index) => (
                <TableRow key={index}>
                  <TableCell isFixed>
                    {branch?.name}
                    <div className="flex justify-center gap-x-2 mt-2">
                      {updateAbility && (
                        <Link to={"/branches/edit-branch/" + branch.id}>
                          <Button variant="edit" size="xs">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                      {deleteAbility && (
                        <Button onClick={() => openDeleteAlert(branch)} variant="delete" size="xs">
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{branch?.station?.hub?.name}</TableCell>
                  <TableCell>{branch?.station?.name}</TableCell>
                  <TableCell>{branch?.location}</TableCell>
                  <TableCell>{branch?.address}</TableCell>
                  <TableCell>
                    {accessAbility && (
                      <Link to={"accounts/" + branch?.id}>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => openViewDialog(driver)}
                          className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                        >
                          <Sheet className="h-4 w-4" /> {t("Accounts")}
                        </Button>
                      </Link>
                    )}
                  </TableCell>
                  {/* <TableCell className="text-right"> */}
                  {/* <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="h-10 w-10 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {updateAbility && (
                          <Link to={"/branches/edit-branch/" + branch.id}>
                            <DropdownMenuItem>
                              <EditIcon className="p-1" /> {t("Edit")}
                            </DropdownMenuItem>
                          </Link>
                        )}
                        {deleteAbility && (
                          <DropdownMenuItem
                            onClick={() => openDeleteAlert(branch)}
                          >
                            <Trash2Icon className="p-1" /> {t("Delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu> */}
                  {/* </TableCell> */}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <NoRecordFound />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination
          links={links}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"branches/delete"}
        />
      )}
    </div>
  );
};

export default BranchIndex;
