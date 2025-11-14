import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { useNavigate, useParams } from "react-router-dom";
import { RefreshCcw } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
import { can } from "@/utils/helpers";

function TransferAreas() {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [areas, setAreas] = useState(null)
  const [shipmentCount, setShipmentCount] = useState(null)
  const [refreshBtn, setRefreshBtn] = useState(false)
  const params = useParams()
  const { t } = useTranslation()

  const fetchAreas = () => {
    axiosMerchant.get("transfer_tasks/areas").then((response) => {
      setAreas(response.data.data)
      // setShipmentCount(response.data.success.count)
      console.log(response.data.data)
      setLoading(false)
    });
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const navigate = useNavigate()

  const canAccess = can("Transfer Task access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <Card className="">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t("Transfer Areas")} {shipmentCount ? `- ${shipmentCount}` : ``}</CardTitle>
            <Button type="button" variant="refresh" onClick={async () => {
              setRefreshBtn(true);
              setLoading(true);
              await fetchAreas();
              setLoading(false);
            }}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t("#")}</TableHead>
                  <TableHead isFixed>{t("Area")}</TableHead>
                  <TableHead>{t("Shipments")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>

                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : areas && areas.length > 0 ? (
                  areas.map((area, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell isFixed>{area.owner}</TableCell>
                      <TableCell>{area.shipments_count}</TableCell>
                      {/* <TableCell className="text-right">
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
                            {updateAbility &&
                              <DropdownMenuItem
                                onClick={() => openEditDialog(area)}
                              >
                                <EditIcon className="p-1" /> {t("Edit")}
                              </DropdownMenuItem>
                            }
                            {deleteAbility &&
                              <DropdownMenuItem
                                onClick={() => openDeleteAlert(shipment)}
                              >
                                <Trash2Icon className="p-1" /> {t("Delete")}
                              </DropdownMenuItem>
                            }

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell> */}
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
            {/* <Pagination
              links={links}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            /> */}
          </div>
        </CardContent>
      </Card>
    </div >
  );
}

export default TransferAreas;