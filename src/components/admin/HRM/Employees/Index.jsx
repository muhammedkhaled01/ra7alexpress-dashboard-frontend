import axiosMerchant from "@/axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../Layouts/PageTitle";
import { Button } from "@/components/ui/button";
import { can } from "@/utils/helpers";
import Create from "./Create";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditIcon, Filter, MoreHorizontal, Trash2Icon, RefreshCcw, Pencil } from "lucide-react";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { handleError } from "@/utils/helpers";
import Edit from "./Edit";
import NoRecordFound from "@/components/NoRecordFound";
import { useDispatch, useSelector } from "react-redux";
import { getUsers } from "@/stores/features/ajaxFeature";

const EmployeeIndex = () => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  
  const users = useSelector(store => store.ajax.users)  
  
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch()

  const [deleteAlert, setDeleteAlert] = useState(false);
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const accessAbility = can("Employee access");
  const createAbility = can("Employee create");
  const updateAbility = can("Employee update");
  const deleteAbility = can("Employee delete");

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
    if(!users) dispatch(getUsers())
    fetchEmployees();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      search.trim() !== "" ? setRefreshBtn(true) : setRefreshBtn(false);
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get("/employees");
      setEmployees(response.data.data);
      console.log(response.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.get(`/employees?query=${search}`);
      setEmployees(response.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    fetchEmployees();
  };

  const handleSubmitSuccess = () => {
    fetchEmployees();
  };

  const openDeleteAlert = (record) => {
    setselectedRecord(record);
    setDeleteAlert(true);
  };

  const openEditDialog = (record) => {
    setselectedRecord(record);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setselectedRecord(null);
    setEditDialogOpen(false);
  };

  const closeDeleteAlert = () => {
    setselectedRecord(null);
    setDeleteAlert(false);
  };

  return (
    <div>
      <PageTitle title={t("Employees")} />
      <div className="flex flex-col md:flex-row gap-3 justify-between mt-2">
        <div>
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div>

        <form onSubmit={handleSearch}>
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-[200px]"
              value={search}
              placeholder={t("Search Employee...")}
              onChange={(e) => setSearch(e.target.value)}
              icon={
                refreshBtn && search.trim() !== "" && (
                  <RefreshCcw className="w-4 h-4 cursor-pointer" onClick={handleRefresh} />
                )
              }
            />
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
      <div className="shadow-md py-4 mt-2 rounded-lg">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableHeader>
          </Table>
        ) : employees && employees.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ID")}</TableHead>
                <TableHead>{t("Name")}</TableHead>
                <TableHead>{t("Email")}</TableHead>
                <TableHead>{t("Department")}</TableHead>
                <TableHead>{t("Position")}</TableHead>
                <TableHead>{t("Level")}</TableHead>
                <TableHead>{t("Direct Manager")}</TableHead>
                {/* <TableHead>{t("Action")}</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.id}</TableCell>
                  <TableCell>
                    {employee?.user.name || "N/A"}
                    <div className="flex gap-x-2 mt-2">
                      {updateAbility && (
                        <Button onClick={() => openEditDialog(employee)} variant="edit" size="xs">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {deleteAbility && (
                        <Button onClick={() => openDeleteAlert(employee)} variant="delete" size="xs">
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{employee?.user.email || "N/A"}</TableCell>
                  <TableCell>{employee.department?.name || "N/A"}</TableCell>
                  <TableCell>{employee.position?.title || "N/A"}</TableCell>
                  <TableCell>
                    {employee.level?.role_name || "N/A"} <br />
                    <span className="font-bold">Level:</span>{" "}
                    {employee.level?.level || "N/A"}
                  </TableCell>
                  <TableCell>
                    {employee.direct_manager?.name || "N/A"}
                  </TableCell>
                  {/* <TableCell> */}
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
                            {/* onClick={() => openEditDialog(employee)} */}
                          {/* > */}
                            {/* <EditIcon className="p-1" /> {t("Edit")} */}
                          {/* </DropdownMenuItem> */}
                        {/* )} */}
                        {/* {deleteAbility && ( */}
                          {/* <DropdownMenuItem */}
                            {/* onClick={() => openDeleteAlert(employee)} */}
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
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                <NoRecordFound />
              </TableCell>
            </TableRow>
          </Table>
        )}
      </div>
      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"employees/delete"}
        />
      )}
      {editDialogOpen && (
        <Edit
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeEditDialog}
          feature={{
            baseEndpoint: '/employees',
            editTitle: t('Edit Employee')
          }}
        />
      )}
    </div>
  );
};

export default EmployeeIndex;
