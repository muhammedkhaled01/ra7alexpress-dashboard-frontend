import React, { useEffect, useState } from "react";
import axiosMerchant from "@/axios";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import Pagination from "@/components/Pagination";
import NoRecordFound from "@/components/NoRecordFound";
import Loader from "@/components/Loader";
import { useDispatch, useSelector } from "react-redux";
import {
  getCountries,
  getGovernorates,
  getStates,
} from "@/stores/features/ajaxFeature";
import Select from "@/components/misc/Select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2Icon, UploadIcon, DownloadIcon } from "lucide-react";
import { can, handleError } from "@/utils/helpers";
import toast from "react-hot-toast";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { fileDownloader } from "@/utils/helpers";
import { Download } from "lucide-react";
function StateChannel() {
  const [stateValue, setStateValue] = useState([]);
  const [governorateValue, _setGovernorateValue] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [channels, setChannels] = useState(null);
  const [importDialog, setImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [deleteAlert, setDeleteAlert] = useState(false);
  const [selectedRecord, setselectedRecord] = useState(null);

  const params = useParams();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const governorates = useSelector((store) => store.ajax.governorates);
  const states = useSelector((store) => store.ajax.states);

  useEffect(() => {
    if (!governorates) dispatch(getGovernorates());
    if (!states) dispatch(getStates());
    fetchChannels();
  }, []);

  const fetchChannels = () => {
    setLoading(true);
    axiosMerchant.get("state_channels/" + params.shipper_id).then((response) => {
      console.log(response.data.data);
      setChannels(response.data.data);
      setLoading(false);
    });
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      form.append("shipper_id", params.shipper_id);
      form.append("internal_state_id", stateValue.value);
      form.append("internal_state_name", stateValue.label);
      const response = await axiosMerchant.post("state_channels/store", form);
      toast.success(response.data.message);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
      fetchChannels();
    }
  };

  // Import functionality
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error("Please select a valid CSV or Excel file");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("shipper_id", params.shipper_id);

      const response = await axiosMerchant.post(
        "state_channels/import",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success(response.data.message);
      setImportDialog(false);
      setSelectedFile(null);
      fetchChannels();
    } catch (error) {
      handleError(error);
    } finally {
      setImportLoading(false);
    }
  };
  const downloadTemplate = async () => {
    try {
      const res = await axiosMerchant.get("state_channels/template", {
        responseType: "blob",
      });

      const mime = res.data?.type;
      // الميمات الصحيحة لملف إكسل
      const okMimes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (mime && !okMimes.includes(mime)) {
        // غالبًا رجّع JSON Error — اعرض الرسالة
        const text = await res.data.text();
        try {
          const json = JSON.parse(text);
          toast.error(json?.message || "Failed to download template");
        } catch {
          toast.error(text || "Failed to download template");
        }
        return;
      }

      // استخرج اسم الملف لو السيرفر بعته في الهيدر
      const dispo =
        res.headers["content-disposition"] ||
        res.headers["Content-Disposition"];
      let filename = "state_channels_template.xlsx";
      if (dispo && dispo.includes("filename=")) {
        const m = dispo.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
        if (m?.[1]) filename = decodeURIComponent(m[1]);
      }

      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded successfully");
    } catch (err) {
      handleError(err);
    }
  };

  const setGovernorateValue = (value) => {
    _setGovernorateValue(value);
    setFilteredStates(
      states?.filter(
        (state) => state.governorate_id?.toString() == value.value.toString()
      )
    );
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

  const handleSubmitSuccess = () => {
    fetchChannels();
  };

  const navigate = useNavigate();
  const canAccess = can("State Channel access");

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <Card className="">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("State Channels")}</CardTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="download"
              onClick={() =>
                fileDownloader({
                  url: `state_channels/export?shipper_id=${params.shipper_id}`, // add &search=... if you expose a search box
                  fileName: `state_channels_${params.shipper_id}.xlsx`,
                })
              }
            >
              <Download className="size-4" />
              <span className="ml-2 hidden sm:inline">{t("Export")}</span>
            </Button>
            <Button
              onClick={() => setImportDialog(true)}
              className="flex items-center gap-2"
            >
              <UploadIcon className="h-4 w-4" />
              {t("Import")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-row gap-x-4">
              <div style={{ width: "200px" }}>
                <Select
                  name="governorate_id"
                  options={governorates?.map((governorate) => ({
                    value: governorate.id,
                    label: `${governorate.en_name} / ${
                      governorate.ar_name ?? ""
                    }`,
                  }))}
                  value={governorateValue}
                  onChange={(value) => setGovernorateValue(value)}
                  placeholder={t("governorate")}
                />
              </div>
              <div style={{ width: "200px" }}>
                <Select
                  name="state_id"
                  options={filteredStates?.map((state) => ({
                    value: state.id,
                    label: state.en_name,
                  }))}
                  placeholder={t("State")}
                  value={stateValue}
                  onChange={(value) => setStateValue(value)}
                />
              </div>
              <div>
                <Input
                  id="external_state_id"
                  name="external_state_id"
                  type="number"
                  required
                  placeholder={t("External State ID")}
                />
              </div>
              <div>
                <Input
                  id="external_state_name"
                  name="external_state_name"
                  type="text"
                  required
                  placeholder={t("External State Name")}
                />
              </div>
              <div>
                <Button type="submit" className="" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("Add Channel")
                  )}
                </Button>
              </div>
            </div>
          </form>
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t("#")}</TableHead>
                  <TableHead>{t("Internal State ID")}</TableHead>
                  <TableHead>{t("Internal State")}</TableHead>
                  <TableHead>{t("External State ID")}</TableHead>
                  <TableHead>{t("External State Name")}</TableHead>
                  <TableHead>{t("Delete")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : channels && channels.length > 0 ? (
                  channels.map((channel, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{channel.internal_state_id}</TableCell>
                      <TableCell>{channel.internal_state_name}</TableCell>
                      <TableCell>{channel.external_state_id}</TableCell>
                      <TableCell>{channel.external_state_name}</TableCell>
                      <TableCell>
                        <Button onClick={() => openDeleteAlert(channel)}>
                          <Trash2Icon className="h-4 w-4" />{" "}
                        </Button>
                      </TableCell>
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
        </CardContent>
      </Card>

      {/* Import Dialog */}
      {importDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">
              {t("Import State Channels")}
            </h3>
            <div className="space-y-4">
              <div>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t("Download the template first and fill it with your data")}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setImportDialog(false);
                    setSelectedFile(null);
                  }}
                >
                  {t("Cancel")}
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || importLoading}
                  className="flex items-center gap-2"
                >
                  {importLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UploadIcon className="h-4 w-4" />
                  )}
                  {t("Import")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"state_channels/delete"}
        />
      )}
    </div>
  );
}

export default StateChannel;
