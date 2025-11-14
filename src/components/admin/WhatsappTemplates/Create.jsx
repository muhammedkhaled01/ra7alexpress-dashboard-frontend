import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import axiosMerchant from "@/axios";
import { toast } from 'react-hot-toast';
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "@/components/misc/Select"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { getRoles } from "@/stores/features/ajaxFeature";
import { useDispatch, useSelector } from "react-redux";

function UserCreate() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null)

  const params = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const { t } = useTranslation()

  const roles = useSelector(store => store.ajax.roles);
  const authUser = useSelector(store => store.auth.user);

  useEffect(() => {
    if (!roles) dispatch(getRoles());

    axiosMerchant.post("users/edit/" + params.id).then((response) => {
      setUser(response.data.data)
    });
  }, [
  ])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      if (authUser.branch_user != null) {
        form.append('type', 'branch')
      } else if (authUser.station_user != null) {
        form.append('type', 'station')
      } else if (authUser.hub_user != null) {
        form.append('type', 'hub')
      }
      const response = await axiosMerchant.post(`users/store`, form);
      toast.success(response.data.message);
      navigate('/users', { state: { from: '/users/create-user' } });
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Card className="">
        <CardHeader>
          <CardTitle>{t("Create User")}</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label htmlFor="name">{t("Name")}</label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                />
              </div>
              <div>
                <label htmlFor="email">{t("Email")}</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                />
              </div>
              <div>
                <label htmlFor="password">{t("Password")}</label>
                <Input
                  id="password"
                  name="password"
                  type="text"
                />
              </div>
              <div>
                <label htmlFor="role">{t("Role")}</label>
                <Select
                  name="role"
                  options={roles?.map(role => ({ value: role.id, label: role.name }))}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>
              {/* <div>
                <label htmlFor="image">Profile Image</label>
                <Input name="image" type="file" />
              </div> */}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="mt-4 ml-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("Save Changes")
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div >
  );
}

export default UserCreate;