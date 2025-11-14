import React, { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
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

function RoleCreate() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [perms, setPerms] = useState(null);
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({
    name: ''
  });

  const validateForm = () => {
    const newErrors = {
      name: name ? '' : t('Role name is required')
    };

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      const response = await axiosMerchant.post(`roles/store`, form);
      toast.success(response.data.message);
      dispatch(getRoles());
      // Navigate to roles list and pass tab ID to close
      const currentTabId = generateTabId("/roles/create-role");
      navigate("/roles", { state: { closeTabId: currentTabId } });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    const updatedPerms = perms.map((category) => ({
      ...category,
      children: category.children.map((child) => ({
        ...child,
        checked: newSelectAll,
      })),
    }));
    setPerms(updatedPerms);
  };

  const handleCheckboxChange = (categoryId, childId) => {
    const updatedPerms = perms.map((category) => {
      if (category.id === categoryId) {
        return {
          ...category,
          children: category.children.map((child) =>
            child.id === childId ? { ...child, checked: !child.checked } : child
          ),
        };
      }
      return category;
    });

    setPerms(updatedPerms);
    setSelectAll(
      updatedPerms.every((category) =>
        category.children.every((child) => child.checked)
      )
    );
  };

  const fetchPermissions = async () => {
    try {
      setIsLoading(true);
      const permsResponse = await axiosMerchant.get(`permissions/all`);
      const permissions = permsResponse.data.data;
      setPerms(permissions);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    const updatedPerms = perms.map((category) => {
      if (category.id === categoryId) {
        const allChecked = category.children.every((child) => child.checked);
        return {
          ...category,
          children: category.children.map((child) => ({
            ...child,
            checked: !allChecked, // Toggle all children
          })),
        };
      }
      return category;
    });

    setPerms(updatedPerms);

    // Check if all categories are selected
    setSelectAll(
      updatedPerms.every((category) =>
        category.children.every((child) => child.checked)
      )
    );
  };
  const { t } = useTranslation()

  const canAccess = can("Role create")

  if (!canAccess) {
    return navigate("/unauthorized");
  }
  return (
    <div className="p-6 min-h-screen">
      <Card className="shadow-lg border border-gray-300 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {t("Create New Role")}
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            {!perms ? (
              <Loader />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  <div className="input-container">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t("Role Name")} <RequiredField />
                    </label>
                    <Input
                      id="name"
                      name="name"
                      placeholder={t("Enter Role Name...")}
                      type="text"
                      error={errors.name}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                </div>

                <div className="space-y-6">
                  {perms.map((category) => (
                    <div
                      key={category.id}
                      className="border rounded-lg p-4  dark:bg-gray-800 shadow-md"
                    >
                      <div className="flex items-center gap-x-2 mb-3">
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
                          className="font-bold hover:cursor-pointer"
                        >
                          {category.name}
                        </label>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-3">
                        {category.children.map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center gap-x-2"
                          >
                            <Checkbox
                              id={child.id}
                              name="permissions[]"
                              value={child.id}
                              checked={selectAll || child.checked}
                              onCheckedChange={() =>
                                handleCheckboxChange(category.id, child.id)
                              }
                              className="border-gray-400 dark:border-gray-300 "
                            />
                            <label
                              htmlFor={child.id}
                              className="text-sm text-gray-700 dark:text-gray-300"
                            >
                              {child.name.replace(category.name + " ", "")}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Create Role"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default RoleCreate;
