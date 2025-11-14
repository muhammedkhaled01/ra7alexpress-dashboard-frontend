import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from "react-router-dom";

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

import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import ZoneMap from "@/components/misc/Zones/ZoneMap";
import Pagination from "@/components/Pagination";
import NoRecordFound from "@/components/NoRecordFound";
import Loader from "@/components/Loader";

function ZoneShipments() {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [shipments, setShipments] = useState(null)
  const [shipmentCount, setShipmentCount] = useState(null)
  const params = useParams()
  const { t } = useTranslation()

  useEffect(() => {
    axiosMerchant.post("zones/shipments/" + params.id).then((response) => {
      setShipments(response.data.data.data)
      setShipmentCount(response.data.success.count)
      setLoading(false)
    });
  }, [])

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div>
      <Card className="">
        <CardHeader>
          <CardTitle>Zone Shipments {shipmentCount ? `- ${shipmentCount}` : ``}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">#</TableHead>
                  <TableHead>{t("Tracking no")}</TableHead>
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
                ) : shipments && shipments.length > 0 ? (
                  shipments.map((shipment, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{shipment.shipment?.tracking_no}</TableCell>
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
                                onClick={() => openEditDialog(shipment)}
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
            <Pagination
              links={links}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>
        </CardContent>
      </Card>
    </div >
  );
}

export default ZoneShipments;