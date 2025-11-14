import axiosMerchant from "@/axios";
import { useEffect, useState, useCallback } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  DollarSign,
  MoreHorizontal,
  Pencil,
  Receipt,
  Scale,
  Sheet
} from "lucide-react";
import {
  EditIcon,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import { can, handleError, humanizeText } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import Select from "@/components/misc/Select";

import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import DriverEditProofDialog from "./DriverEditProofDialog";
import DeliveryConfirmationDialog from "./DeliveryConfirmationDialog";

const CompanyIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingCompany, setPendingCompany] = useState(null);
  const [pendingChecked, setPendingChecked] = useState(false);
  const [companies, setCompanys] = useState([]);
  const [search, setSearch] = useState("");
  const [driverEditProofDialog, setDriverEditProofDialog] = useState(false)
  const [deliveryConfirmationDialog, setDeliveryConfirmationDialog] = useState(false)

  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Company access");
  const createAbility = can("Company create");
  const updateAbility = can("Company update");
  const deleteAbility = can("Company delete");

  const fetchCompanys = useCallback(async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`companies?page=${pageNumber}&per_page=${itemsPerPage}`);
      setLinks(response.data.data.links || []);
      setCompanys(response.data.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setLinks, setCompanys, itemsPerPage]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`companies?query=${search}`);
      setCompanys(response.data.data);
      setLinks([]);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [search, setLoading, setCompanys]);

  const handleRefresh = useCallback(() => {
    setSearch("");
    fetchCompanys(currentPage);
  }, [setSearch, fetchCompanys, currentPage, itemsPerPage]);

  const handleSubmitSuccess = () => {
    fetchCompanys(currentPage);
  };

  const exportDriversList = async (company_id) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(
        `companies/export_drivers_list/${company_id}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", "drivers_list.csv");
      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Drivers downloaded successfully.");
    } catch (error) {
      console.error("Download failed:", error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const openConfirmationModal = (company, checked) => {
    setPendingCompany(company);
    setPendingChecked(checked);
    setIsModalOpen(true);
  };

  const confirmTogglePaymentProof = async () => {
    if (!pendingCompany) return;
    setLoading(true);

    const updatedValue = pendingChecked ? 1 : 0;
    try {
      await axiosMerchant.post(
        `companies/update_payment_proof_required/${pendingCompany.id}`,
        { payment_proof_required: updatedValue }
      );
      setLoading(false);
      setIsModalOpen(false);
      setPendingCompany(null);
      fetchCompanys();
      toast.success("Payment proof requirement updated successfully.");
    } catch (error) {
      handleError(error);
    }
  };

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

  const openDriverEditProofDialog = (record) => {
    setselectedRecord(record);
    setDriverEditProofDialog(true);
  };

  const closeDriverEditProofDialog = () => {
    setselectedRecord(null);
    setDriverEditProofDialog(false);
  };

  const openDeliveryConfirmationDialog = (record) => {
    setselectedRecord(record);
    setDeliveryConfirmationDialog(true);
  };

  const closeDeliveryConfirmationDialog = () => {
    setselectedRecord(null);
    setDeliveryConfirmationDialog(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== "") {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, handleSearch]);

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
    fetchCompanys(currentPage);
  }, [currentPage, accessAbility, navigate, fetchCompanys]);

  return (
    <div>
      <PageTitle title={t("Companies")} />
      <div className="flex flex-col md:flex-row gap-2 justify-between mt-2">
        <div>
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div>

        <form className="flex md:items-center flex-col md:flex-row gap-2" action="" onSubmit={handleSearch}>
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-[200px]"
              value={search}
              placeholder={t("Search Companies...")}
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
              {/* <TableHead className="w-[100px]">{t("#")}</TableHead> */}
              <TableHead isFixed>{t("Name")}</TableHead>
              <TableHead>{t("Payment Proof Required")}</TableHead>
              <TableHead>{t("Commissions")}</TableHead>
              <TableHead>{t("Settings")}</TableHead>
              {/* <TableHead>{t("Channels")}</TableHead> */}
              <TableHead>{t("Invoices")}</TableHead>
              {/* <TableHead className="text-right">{t("Actions")}</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : companies && companies.length > 0 ? (
              companies.map((company, index) => {
                const editProofFlags = company.drivers.map(d => d.settings.edit_proof);

                let companyStatus;
                if (editProofFlags.every(flag => flag)) {
                  companyStatus = 'allowed';
                } else if (editProofFlags.every(flag => !flag)) {
                  companyStatus = 'not allowed';
                } else {
                  companyStatus = 'mixed';
                }

                return <TableRow key={index}>
                  {/* <TableHead className="w-[100px] sticky left-0  z-10">
                    #
                  </TableHead> */}
                  <TableCell isFixed>
                    {company.name}
                    <div className="flex justify-center gap-x-2 mt-2">
                      {updateAbility && (
                        <Button
                          onClick={() => openEditDialog(company)}
                          variant="edit"
                          size="xs"
                        >
                          <Pencil />
                        </Button>
                      )}
                      {deleteAbility && (
                        <Button
                          onClick={() => openDeleteAlert(company)}
                          type="button"
                          variant="delete"
                          size="xs"
                        >
                          <Trash2Icon />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      onClick={() => openDriverEditProofDialog(company)}
                      variant={"created"}>
                      {humanizeText(companyStatus)}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-center items-center gap-x-2">
                      <Switch
                        id={`payment-proof-${company.id}`}
                        checked={company.payment_proof_required === 1}
                        onCheckedChange={(checked) =>
                          openConfirmationModal(company, checked)
                        }
                      />
                      <label htmlFor={`payment-proof-${company.id}`}>
                        {t("Payment Proof")}
                      </label>
                    </div>
                  </TableCell>
                  <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                  >
                    <ModalHeader>
                      <ModalTitle>{t("Confirm Payment Proof Change")}</ModalTitle>
                    </ModalHeader>
                    <ModalContent>
                      <p>
                        {t("Are you sure you want to")}
                        {pendingChecked ? t("enable") : t("disable")} {t("the payment proof requirement for")}
                        {pendingCompany?.name}?
                      </p>
                    </ModalContent>
                    <ModalFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsModalOpen(false)}
                      >
                        {t("Cancel")}
                      </Button>
                      <Button
                        onClick={confirmTogglePaymentProof}
                        disabled={loading}
                      >
                        {loading ? t("Saving...") : t("Confirm")}
                      </Button>
                    </ModalFooter>
                  </Modal>
                  <TableCell>
                    <Button
                      variant="outline"
                      onClick={() => openDeliveryConfirmationDialog(company)}
                      size="xs"
                      className="mb-2 mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                    >
                      <CreditCard />{t("Delivery Confirmation Method")}
                    </Button>
                    <Link to={`commissions/${company.id}`}>
                      <Button
                        variant="outline"
                        size="xs"
                        className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                      >
                        <DollarSign className="h-4 w-4" /> {t("Commision")}
                      </Button>
                    </Link>
                  </TableCell>
                  {/* <TableCell>
                    <div className="flex flex-col space-y-2">
                      <Link to={"/channels/country/" + company.id}>
                        <Button
                          variant="outline"
                          size="xs"
                          className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                        >
                          <Scale className="h-4 w-4" /> {t("Country Channels")}
                        </Button>
                      </Link>
                      <Link to={"/channels/governorate/" + company.id}>
                        <Button
                          variant="outline"
                          size="xs"
                          className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                        >
                          <Scale className="h-4 w-4" /> {t("Governorate Channels")}
                        </Button>
                      </Link>
                      <Link to={"/channels/state/" + company.id}>
                        <Button
                          variant="outline"
                          size="xs"
                          className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                        >
                          <Scale className="h-4 w-4" /> {t("State Channels")}
                        </Button>
                      </Link>
                    </div>
                  </TableCell> */}
                  <TableCell>
                    <Link to={"invoices/" + company.id}>
                      <Button
                        variant="outline"
                        size="xs"
                        className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                      >
                        <Receipt className="h-4 w-4" /> {t("Invoices")}
                      </Button>
                    </Link>
                    
                    
                    <Link to={"accounts/" + company.id}>
                      <Button
                        variant="outline"
                        size="xs"
                        className="mr-2 py-[4px] px-2 border hover:opacity-50 rounded"
                      >
                        <Receipt className="h-4 w-4" /> {t("Accounts")}
                      </Button>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
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
                        {accessAbility && (
                          <DropdownMenuItem
                            onClick={() => exportDriversList(company.id)}
                          >
                            <Sheet className="p-1" /> {t("Export Drivers List")}
                          </DropdownMenuItem>
                        )}
                        {updateAbility && (
                          <DropdownMenuItem
                            onClick={() => openEditDialog(company)}
                          >
                            <EditIcon className="p-1" /> {t("Edit")}
                          </DropdownMenuItem>
                        )}
                        {deleteAbility && (
                          <DropdownMenuItem
                            onClick={() => openDeleteAlert(company)}
                          >
                            <Trash2Icon className="p-1" /> {t("Delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu> */}
                  </TableCell>
                </TableRow>
              })
            ) : (
              <TableRow>
                <TableCell colSpan={12} className="text-center">
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
          api={"companies/delete"}
        />
      )}
      {editDialogOpen && (
        <Edit
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeEditDialog}
        />
      )}

      {driverEditProofDialog && (
        <DriverEditProofDialog
          onSubmitSuccess={handleSubmitSuccess}
          company={selectedRecord}
          onClose={closeDriverEditProofDialog}
        />
      )}

      {deliveryConfirmationDialog && (
        <DeliveryConfirmationDialog
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeliveryConfirmationDialog}
        />
      )}
    </div>
  );
};

export default CompanyIndex;
