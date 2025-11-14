import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Checkbox } from "@/components/ui/checkbox";
import Loader from "@/components/Loader";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { can, handleError, isAuthorized, generateTabId } from "@/utils/helpers";
import { getRoles } from "@/stores/features/ajaxFeature";
import { useTranslation } from "react-i18next";
import RequiredField from "@/components/misc/RequiredField";
import { closeTab } from "@/stores/features/tabsFeature";

function RoleEdit() {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState({ name: "", permissions: [] });
  const [perms, setPerms] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
  });
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const dispatch = useDispatch();

  const validateForm = () => {
    const newErrors = {
      name: role.name ? "" : t("Role name is required"),
    };

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const roleResponse = await axiosMerchant.get(`roles/show/${params.id}`);
      const fetchedRole = roleResponse.data.data;

      const permsResponse = await axiosMerchant.get(`permissions/all`);
      const permissions = permsResponse.data.data;

      // Map permissions with selection state
      const updatedPerms = permissions.map((category) => ({
        ...category,
        children: category.children.map((child) => ({
          ...child,
          checked:
            fetchedRole.permissions?.some((p) => p.id === child.id) || false,
        })),
      }));

      setRole({ name: fetchedRole.name, permissions: fetchedRole.permissions });
      setPerms(updatedPerms);
      setSelectAll(
        updatedPerms.every((category) =>
          category.children.every((child) => child.checked)
        )
      );
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      const selectedPermissions = perms
        .flatMap((category) => category.children)
        .filter((child) => child.checked)
        .map((child) => child.id);

      const payload = {
        id: params.id,
        name: role.name,
        permissions: selectedPermissions,
      };

      const response = await axiosMerchant.post(`roles/update`, payload);
      toast.success(response.data.message);
      dispatch(getRoles());
      // Navigate to roles list and pass tab ID to close
      const currentTabId = generateTabId(`/roles/edit-role/${params.id}`);
      navigate("/roles", { state: { closeTabId: currentTabId } });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setPerms(
      perms.map((category) => ({
        ...category,
        children: category.children.map((child) => ({
          ...child,
          checked: newSelectAll,
        })),
      }))
    );
  };

  const handleCategorySelect = (categoryId) => {
    setPerms(
      perms.map((category) => {
        if (category.id === categoryId) {
          const newChecked = !category.children.every((child) => child.checked);
          return {
            ...category,
            children: category.children.map((child) => ({
              ...child,
              checked: newChecked,
            })),
          };
        }
        return category;
      })
    );
  };

  const handleCheckboxChange = (categoryId, childId) => {
    setPerms(
      perms.map((category) => {
        if (category.id === categoryId) {
          const updatedChildren = category.children.map((child) =>
            child.id === childId ? { ...child, checked: !child.checked } : child
          );
          return {
            ...category,
            children: updatedChildren,
          };
        }
        return category;
      })
    );
  };
  const canAccess = can("Role update");

  if (!canAccess) {
    return navigate("/unauthorized");
  }
  return (
    <div className="p-6 min-h-screen">
      <Card className="shadow-lg border border-gray-300 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {t("Edit Role")}
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            {isLoading ? (
              <Loader />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t("Role Name")} <RequiredField />
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={role.name}
                      onChange={(e) =>
                        setRole({ ...role, name: e.target.value })
                      }
                      error={errors.name}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>
                </div>

                <hr className="my-5 border-gray-300 dark:border-gray-600" />

                <div className="flex items-center gap-x-2 mb-4">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    className="border-gray-500 dark:border-gray-400 h-5 w-5"
                  />
                  <label
                    htmlFor="select-all"
                    className="text-lg font-bold text-gray-700 dark:text-gray-300 hover:cursor-pointer"
                  >
                    {t("Select All Permissions")}
                  </label>
                  <Button type="submit" disabled={isLoading} className="ml-auto">
                    {isLoading ? t("Updating...") : t("Update Role")}
                  </Button>
                </div>

                {perms.map((category) => (
                  <div
                    key={category.id}
                    className="border rounded-lg p-4  dark:bg-gray-800 shadow-md mb-4"
                  >
                    <div className="flex items-center gap-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={category.children.every(
                          (child) => child.checked
                        )}
                        onCheckedChange={() =>
                          handleCategorySelect(category.id)
                        }
                        className="border-gray-500 dark:border-gray-400 h-5 w-5"
                      />
                      <label
                        htmlFor={`category-${category.id}`}
                        className="text-md font-semibold text-gray-800 dark:text-gray-300 hover:cursor-pointer"
                      >
                        {category.name}
                      </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                      {category.children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center gap-x-2"
                        >
                          <Checkbox
                            id={`perm-${child.id}`}
                            checked={child.checked}
                            onCheckedChange={() =>
                              handleCheckboxChange(category.id, child.id)
                            }
                            className="border-gray-500 dark:border-gray-400  "
                          />
                          <label
                            htmlFor={`perm-${child.id}`}
                            className="text-sm text-gray-700 dark:text-gray-300 hover:cursor-pointer"
                          >
                            {child.name.replace(category.name + " ", "")}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("Updating...") : t("Update Role")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default RoleEdit;
