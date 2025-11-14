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
import { getCountries, getGovernorates } from "@/stores/features/ajaxFeature";
import Select from "@/components/misc/Select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2Icon } from "lucide-react";
import { can, handleError } from "@/utils/helpers";
import toast from "react-hot-toast";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { fileDownloader } from "@/utils/helpers";
import { Download } from "lucide-react";
function GovernorateChannel() {
  const [governorateValue, setGovernorateValue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [channels, setChannels] = useState(null);

  const [deleteAlert, setDeleteAlert] = useState(false);
  const [selectedRecord, setselectedRecord] = useState(null);
  const [importDialog, setImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const params = useParams();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const governorates = useSelector((store) => store.ajax.governorates);

  useEffect(() => {
    if (!governorates) dispatch(getGovernorates());
    fetchChannels();
  }, []);
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ok = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!ok.includes(file.type)) {
      toast.error("Please select a valid CSV or Excel file");
      return;
    }
    setSelectedFile(file);
  };
  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }
    setImportLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("shipper_id", params.shipper_id);
      const res = await axiosMerchant.post("governorate_channels/import", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "json",
      });
      toast.success(res.data?.message || "Imported");
      setImportDialog(false);
      setSelectedFile(null);
      fetchChannels();
    } catch (e) {
      handleError(e);
    } finally {
      setImportLoading(false);
    }
  };

  const fetchChannels = () => {
    setLoading(true);
    axiosMerchant
      .get("governorate_channels/" + params.shipper_id)
      .then((response) => {
        console.log(response.data.data);
        setChannels(response.data.data);
        setLoading(false);
      });
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  const downloadTemplate = async () => {
    try {
      const res = await axiosMerchant.get("governorate_channels/template", {
        responseType: "blob",
      });

      const okMimes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      const mime = res.data?.type;
      if (mime && !okMimes.includes(mime)) {
        const text = await res.data.text();
        try {
          toast.error(
            JSON.parse(text)?.message || "Failed to download template"
          );
        } catch {
          toast.error(text || "Failed to download template");
        }
        return;
      }

      const dispo =
        res.headers["content-disposition"] ||
        res.headers["Content-Disposition"];
      let filename = "governorate_channels_template.xlsx";
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
    } catch (e) {
      handleError(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      form.append("shipper_id", params.shipper_id);
      form.append("internal_governorate_id", governorateValue.value);
      form.append("internal_governorate_name", governorateValue.label);
      const response = await axiosMerchant.post(
        "governorate_channels/store",
        form
      );
      toast.success(response.data.message);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
      fetchChannels();
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

  const handleSubmitSuccess = () => {
    fetchChannels();
  };

  const navigate = useNavigate();

  const canAccess = can("Governorate Channel access");

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <Card className="">
        <CardHeader>
          <CardTitle>{t("Governorate Channels")}</CardTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="download"
              onClick={() =>
                fileDownloader({
                  url: `governorate_channels/export?shipper_id=${params.shipper_id}`,
                  fileName: `governorate_channels_${params.shipper_id}.xlsx`,
                })
              }
              title={t("Export")}
            >
              <Download className="size-4" />
              <span className="ml-2 hidden sm:inline">{t("Export")}</span>
            </Button>
            <Button onClick={() => setImportDialog(true)}>{t("Import")}</Button>
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
                    label: governorate.en_name,
                  }))}
                  placeholder={t("Governorate")}
                  value={governorateValue}
                  onChange={(value) => setGovernorateValue(value)}
                />
              </div>
              <div>
                <Input
                  id="external_governorate_id"
                  name="external_governorate_id"
                  type="number"
                  required
                  placeholder={t("External Governorate ID")}
                />
              </div>
              <div>
                <Input
                  id="external_governorate_name"
                  name="external_governorate_name"
                  type="text"
                  required
                  placeholder={t("External Governorate Name")}
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
                  <TableHead>{t("Internal Governorate ID")}</TableHead>
                  <TableHead>{t("Internal Governorate")}</TableHead>
                  <TableHead>{t("External Governorate ID")}</TableHead>
                  <TableHead>{t("External Governorate Name")}</TableHead>
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
                      <TableCell>{channel.internal_governorate_id}</TableCell>
                      <TableCell>{channel.internal_governorate_name}</TableCell>
                      <TableCell>{channel.external_governorate_id}</TableCell>
                      <TableCell>{channel.external_governorate_name}</TableCell>
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

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"governorate_channels/delete"}
        />
      )}
      {importDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">
              {t("Import Governorate Channels")}
            </h3>
            <div className="space-y-4">
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
              />
              <p className="text-sm text-gray-500">
                {t("Download the template first and fill it with your data")}
              </p>
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
                >
                  {importLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("Import")
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GovernorateChannel;
