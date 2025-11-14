import React, { useEffect, useState } from "react";

import axiosMerchant from "@/axios";
import { useNavigate, useParams } from "react-router-dom";

import {
  Card,
  CardContent,
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
import NoRecordFound from "@/components/NoRecordFound";
import Loader from "@/components/Loader";
import { can, truckDriverName, truckName } from "@/utils/helpers";

function IncomingTrucks() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState(null)
  const params = useParams()
  const { t } = useTranslation()

  useEffect(() => {
    axiosMerchant.get("transfer_tasks/incoming_trucks").then((response) => {
      setTasks(response.data.data)
      console.log(response.data.data)
      setLoading(false)
    });
  }, [])

  const navigate = useNavigate()

  const canAccess = can("Transfer Task access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <Card className="">
        <CardHeader>
          <CardTitle>{t(`Incoming Trucks`)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="shadow-md py-4 mt-2 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">#</TableHead>
                  <TableHead>{t("Truck")}</TableHead>
                  <TableHead>{t("Truck Driver")}</TableHead>
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
                ) : tasks && tasks.length > 0 ? (
                  tasks.map((task, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{truckName(task.truck)}</TableCell>
                      <TableCell>{truckDriverName(task.truck_driver)}</TableCell>
                      <TableCell>{task.shipments_count}</TableCell>
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
          </div>
        </CardContent>
      </Card>
    </div >
  );
}

export default IncomingTrucks;