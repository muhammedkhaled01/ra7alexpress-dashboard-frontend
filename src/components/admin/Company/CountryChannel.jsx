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
import Pagination from "@/components/Pagination";
import NoRecordFound from "@/components/NoRecordFound";
import Loader from "@/components/Loader";
import { useDispatch, useSelector } from "react-redux";
import { getCountries } from "@/stores/features/ajaxFeature";
import Select from "@/components/misc/Select"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2Icon } from "lucide-react";
import { can, handleError } from "@/utils/helpers";
import toast from "react-hot-toast";
import DeleteAlert from "@/components/misc/DeleteAlert";


function CountryChannel() {
  const [countryValue, setCountryValue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [channels, setChannels] = useState(null)

  const [deleteAlert, setDeleteAlert] = useState(false);
  const [selectedRecord, setselectedRecord] = useState(null);

  const params = useParams()
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const countries = useSelector(store => store.ajax.countries)

  useEffect(() => {
    if (!countries) dispatch(getCountries())
    fetchChannels()
  }, [])
  
  useEffect(() => {
    const defaultCountry = countries?.find(
      (country) => country.name === "Egypt"
    );
    if (defaultCountry) {
      setCountryValue({ value: defaultCountry.id, label: defaultCountry.name });
    }
  }, [countries]);

  const fetchChannels = () => {
    setLoading(true)
    axiosMerchant.get("country_channels/" + params.shipper_id).then((response) => {
      console.log(response.data.data)
      setChannels(response.data.data.data)
      setLoading(false)
    });
  }

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      form.append('shipper_id', params.shipper_id)
      form.append('internal_country_id', countryValue.value ?? '')
      form.append('internal_country_name', countryValue.label ?? '')
      const response = await axiosMerchant.post("country_channels/store", form);
      toast.success(response.data.message);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
      fetchChannels()
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

  const navigate = useNavigate()

  const canAccess = can("Country Channel access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  return (
    <div>
      <Card className="">
        <CardHeader>
          <CardTitle>{t("Country Channels")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-row gap-x-4">
              <div style={{ width: "200px" }}>
                <Select
                  name="country_id"
                  options={countries?.map((country) => ({
                    value: country.id,
                    label: country.name,
                  }))}
                  placeholder={t("Country")}
                  value={countryValue}
                  onChange={(value) => setCountryValue(value)}
                />
              </div>
              <div>
                <Input id="external_country_id" name="external_country_id" type="number" required placeholder={t("External Country ID")} />
              </div>
              <div>
                <Input id="external_country_name" name="external_country_name" type="text" required placeholder={t("External Country Name")} />
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
                  <TableHead>{t("Internal Country ID")}</TableHead>
                  <TableHead>{t("Internal Country")}</TableHead>
                  <TableHead>{t("External Country ID")}</TableHead>
                  <TableHead>{t("External Country Name")}</TableHead>
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
                      <TableCell>{channel.internal_country_id}</TableCell>
                      <TableCell>{channel.internal_country_name}</TableCell>
                      <TableCell>{channel.external_country_id}</TableCell>
                      <TableCell>{channel.external_country_name}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => openDeleteAlert(channel)}
                        >
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
          api={"country_channels/delete"}
        />
      )}
    </div >
  );
}

export default CountryChannel;