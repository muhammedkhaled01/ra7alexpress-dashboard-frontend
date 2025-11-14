import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosMerchant from "@/axios";

import PageTitle from "../Layouts/PageTitle";
import Loader from "@/components/Loader";
import NoRecordFound from "@/components/NoRecordFound";
import Pagination from "@/components/Pagination";
import { Button } from "../../ui/button";
import Select from "@/components/misc/Select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, RefreshCcw } from "lucide-react";
import { can, handleError, hasRole } from "@/utils/helpers";

const DriverWaybillView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { driver_id } = useParams();
  const [searchParams] = useSearchParams();
  const accessAbility = can("Driver Waybill access");

  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [batches, setBatches] = useState([]);

  const fetchBatches = useCallback(
    async (pageNumber) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set("page", pageNumber);
        qs.set("per_page", itemsPerPage);
        if (driver_id) qs.set("driver_id", driver_id);

        const res = await axiosMerchant.get(
          `/driver_waybills/batches?${qs.toString()}`
        );
        const payload = res.data?.data;
        setLinks(payload?.links || []);
        setBatches(payload?.data || []);
      } catch (e) {
        handleError(e);
      } finally {
        setLoading(false);
      }
    },
    [driver_id, itemsPerPage]
  );

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
      return;
    }
    fetchBatches(currentPage);
  }, [accessAbility, fetchBatches, currentPage, navigate]);

  const handleRefresh = () => fetchBatches(currentPage);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 space-y-4 md:space-y-0">
        <PageTitle title={t("Driver Waybill Batches")} />
        <div className="flex items-center gap-2">
          <Button type="button" variant="refresh" onClick={handleRefresh}>
            <RefreshCcw className="w-4 h-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              {t("Show")}
            </label>
            <Select
              value={{ value: itemsPerPage, label: String(itemsPerPage) }}
              onChange={(opt) => setItemsPerPage(Number(opt.value))}
              options={[5, 8, 15, 25, 50, 100].map((n) => ({
                value: n,
                label: String(n),
              }))}
              className="w-20 text-sm"
              isSearchable={false}
            />
          </div>
        </div>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("#")}</TableHead>
              <TableHead>{t("Used/Total")}</TableHead>
              <TableHead>{t("Created At")}</TableHead>
              <TableHead>{t("Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : batches.length > 0 ? (
              batches.map((b, idx) => {
                const total = b.waybills_count ?? 0;
                const used = b.used_count ?? 0;
                return (
                  <TableRow key={b.id}>
                    <TableCell>{(links?.from ?? 1) + idx}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="delivered">
                        {used}/{total}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {b.created_at
                        ? new Date(b.created_at).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell className="flex justify-center items-center">
                      <div
                        onClick={() =>
                          navigate(
                            `/driver/${driver_id}/${b.id}/view-batch-waybill`
                          )
                        }
                        className="bg-gray-300 rounded-lg size-[30px] flex justify-center items-center cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-primary hover:text-primary/90" />
                      </div>
                    </TableCell>
                  </TableRow>
                );
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
        <Pagination links={links} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default DriverWaybillView;
