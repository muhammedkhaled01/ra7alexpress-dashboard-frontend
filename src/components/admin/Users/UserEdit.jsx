import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select from "@/components/misc/Select";
import PhoneInput from "@/components/misc/PhoneInput";
import RequiredField from "@/components/misc/RequiredField";
import { Switch } from "@/components/ui/switch";
import Loader from "@/components/Loader";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { getRoles, getPermissions } from "@/stores/features/ajaxFeature";
import { handleError, hasRole } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageProvider";
import { sidebarPermissions } from "../Layouts/links/adminLinks";

function UserEdit() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { language } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [record, setRecord] = useState(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRoleName, setSelectedRoleName] = useState("");
  const [roleValue, setRoleValue] = useState(null);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState([]);
  const [workspaceOptions, setWorkspaceOptions] = useState([]);
  // New permissions state (using EditNew.jsx structure)
  const [sidebarPerms, setSidebarPerms] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  const roles = useSelector((s) => s.ajax.roles);
  const authUser = useSelector((s) => s.auth.user);
  const storePermissions = useSelector((s) => s.ajax.permissions);

  const isSuperAdmin = hasRole("Super Admin");
  const rolesWithoutWorkspaces = ["Customer Service", "Driver"];
  // Refs for latest state in handlers
  const sidebarPermsRef = useRef(sidebarPerms);
  const permissionLookupRef = useRef(new Map());

  // Update refs when state changes
  useEffect(() => {
    sidebarPermsRef.current = sidebarPerms;
  }, [sidebarPerms]);

  // Memoized helper functions from EditNew.jsx
  const createPermissionMap = useCallback((allPermissions) => {
    const map = new Map();
    allPermissions.forEach((perm) => {
      map.set(perm.name, perm);
      if (perm.children) {
        perm.children.forEach((child) => map.set(child.name, child));
      }
    });
    return map;
  }, []);

  const buildPermissionLookup = useCallback((allPermissions) => {
    const idToName = new Map();
    const walk = (items) => {
      (items || []).forEach((p) => {
        if (p && p.id != null) {
          idToName.set(String(p.id), p.name);
        }
        if (p.children && p.children.length) {
          walk(p.children);
        }
      });
    };
    walk(allPermissions);
    return idToName;
  }, []);

  const transformSidebarPermissions = useCallback(
    (sidebarPermissions, allPermissions) => {
      if (!allPermissions || allPermissions.length === 0)
        return sidebarPermissions;

      const permissionMap = createPermissionMap(allPermissions);

      return sidebarPermissions.map((category) => ({
        ...category,
        id: `category_${category.name.toLowerCase().replace(/ /g, "_")}`,
        children: category.children.map((child) => {
          const permissionFromAPI = permissionMap.get(child.name);
          return {
            ...child,
            id: permissionFromAPI ? permissionFromAPI.name : child.id,
            children:
              child.children?.map((subChild) => ({
                ...subChild,
                id:
                  permissionMap.get(subChild.id)?.id.toString() || subChild.id,
              })) || [],
          };
        }),
      }));
    },
    [createPermissionMap]
  );

  // Refactored updatePermissionsState: Use same logic as SaveRole.jsx (lines 164–182)
  const updatePermissionsState = useCallback(
    (permissions, rolePermissions = undefined) => {
      // If no rolePermissions provided, just mark all unchecked (like create mode)
      if (!rolePermissions) return permissions.map((item) => ({ ...item, checked: false, children: item.children?.map((c) => ({ ...c, checked: false, children: c.children?.map((c2) => ({ ...c2, checked: false })) || [] })) || [] }));
      // Use stringified IDs for reliable matching
      const rolePermissionIds = new Set(rolePermissions.map((p) => p.id?.toString()));
      const updateItemState = (item) => {
        const hasChildren = item.children && item.children.length > 0;
        let checked = rolePermissionIds.has(item.id?.toString());
        if (hasChildren) {
          const children = item.children.map(updateItemState);
          const allChildrenChecked = children.every((child) => child.checked);
          const someChildrenChecked = children.some((child) => child.checked);
          if (allChildrenChecked) { checked = true; } else if (!someChildrenChecked) { checked = false; }
          return { ...item, checked, children };
        }
        return { ...item, checked };
      };
      return permissions.map(updateItemState);
    }, []);

  const calculateCheckedCount = useCallback((item) => {
    if (!item.children || item.children.length === 0) {
      return {
        checked: item.checked ? 1 : 0,
        total: 1,
      };
    }

    let checked = 0;
    let total = 0;

    const countChildren = (children) => {
      children.forEach((child) => {
        const childCount = calculateCheckedCount(child);
        checked += childCount.checked;
        total += childCount.total;
      });
    };

    countChildren(item.children);
    return { checked, total };
  }, []);

  const updateSelectAllState = useCallback(
    (sidebarPerms) => {
      const allSelected = sidebarPerms.every((category) => {
        const count = calculateCheckedCount(category);
        return count.total > 0 && count.checked === count.total;
      });
      setSelectAll(allSelected);
    },
    [calculateCheckedCount]
  );

  // Checkbox state management functions
  const updateAllChildren = useCallback((children, checked) => {
    return children.map((child) => ({
      ...child,
      checked,
      children: child.children
        ? updateAllChildren(child.children, checked)
        : [],
    }));
  }, []);

  const updateCheckboxState = useCallback(
    (items, targetId, newChecked) => {
      const updateItemAndPropagate = (item) => {
        let updatedItem = item;

        if (item.id === targetId) {
          updatedItem = {
            ...item,
            checked: newChecked,
            children: item.children
              ? updateAllChildren(item.children, newChecked)
              : item.children,
          };
        } else if (item.children && item.children.length > 0) {
          const updatedChildren = item.children.map(updateItemAndPropagate);
          const count = calculateCheckedCount({
            children: updatedChildren,
            checked: false,
            id: "temp",
          });

          let newParentChecked = false;
          if (count.total > 0) {
            if (count.checked === count.total) {
              newParentChecked = true;
            } else if (count.checked > 0) {
              newParentChecked = false;
            }
          } else {
            newParentChecked = item.checked;
          }

          updatedItem = {
            ...item,
            checked: newParentChecked,
            children: updatedChildren,
          };
        }

        return updatedItem;
      };

      return items.map(updateItemAndPropagate);
    },
    [updateAllChildren, calculateCheckedCount]
  );

  const collectSelectedPermissions = useCallback((items) => {
    const selected = [];
    const walk = (nodes) => {
      nodes.forEach((item) => {
        if (!item.children || item.children.length === 0) {
          if (item.checked) {
            const idStr = String(item.id);
            if (
              !idStr.startsWith("category_") &&
              !idStr.startsWith("other_") &&
              !isNaN(Number(idStr))
            ) {
              selected.push(idStr);
            }
          }
        } else {
          walk(item.children);
        }
      });
    };
    walk(items);
    return selected;
  }, []);

  const updateRolePermissionsState = useCallback(
    (currentSidebar) => {
      const sidebarSelected = collectSelectedPermissions(currentSidebar);
      const selectedPermissions = Array.from(new Set([...sidebarSelected]));

      const pairs = selectedPermissions.map((pid) => ({
        id: String(pid),
        name: permissionLookupRef.current.get(String(pid)) || "(unknown)",
      }));
      console.log("Selected permissions updated:", pairs);
    },
    [collectSelectedPermissions]
  );

  const handleSelectAll = useCallback(() => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    const updateAllItems = (items) =>
      items.map((item) => ({
        ...item,
        checked: newSelectAll,
        children: item.children ? updateAllItems(item.children) : [],
      }));

    const newSidebarPerms = updateAllItems(sidebarPerms);
    setSidebarPerms(newSidebarPerms);
    updateRolePermissionsState(newSidebarPerms);
  }, [selectAll, sidebarPerms, updateRolePermissionsState]);

  const handleCheckboxChange = useCallback(
    (id, newCheckedValue) => {
      setSidebarPerms((prev) => {
        const updated = updateCheckboxState(prev, id, newCheckedValue);
        updateRolePermissionsState(updated);
        updateSelectAllState(updated);
        return updated;
      });
    },
    [updateCheckboxState, updateSelectAllState, updateRolePermissionsState]
  );

  const toggleCategory = useCallback((categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  }, []);

  const hasChildren = useCallback((item) => {
    return item.children && item.children.length > 0;
  }, []);

  // Workspace options
  // const workspaceOptions = useMemo(
  //   () =>
  //     (authUser?.workspaces || []).map((ws) => ({
  //       value: ws.id,
  //       label: `${ws.name} (${ws.type.split("\\").pop()})`,
  //     })),
  //   [authUser]
  // );

  const requiresWorkspace =
    isSuperAdmin &&
    !!selectedRoleName &&
    !rolesWithoutWorkspaces.includes(selectedRoleName);

  // Role options
  const roleOptions = (roles || [])
    .filter(
      (role) =>
        ![
          "Merchant",
          "Merchant Admin",
          "Driver",
          "Truck Driver",
          "Driver Admin",
          "Guest Driver",
        ].includes(role.name)
    )
    .map((role) => ({ value: role.id, label: role.name }));

  const onRoleChange = (option) => {
    const r = (roles || []).find((x) => x.id == option.value);
    setSelectedRoleName(r?.name || "");
    setRoleValue(option);

    if (r && rolesWithoutWorkspaces.includes(r.name)) {
      setSelectedWorkspaces([]);
    }
  };

  // Permission rendering (same as EditNew.jsx)
  const renderPermissionItem = useCallback(
    (item, level = 0) => {
      const isExpanded = expandedCategories[item.id];

      const count = calculateCheckedCount(item);
      const badgeText = `${count.checked}/${count.total}`;
      const isAllChecked = count.checked === count.total;
      const isNotAllChecked = count.checked > 0 && count.checked < count.total;
      const badgeVariant = isAllChecked
        ? "default"
        : isNotAllChecked
        ? "warning"
        : "secondary";
      const IconComponent = item.icon;

      if (level === 2) {
        return (
          <span key={item.id} className="inline-flex gap-x-3 items-center">
            <Switch
              id={`perm-${item.id}`}
              checked={item.checked || false}
              onCheckedChange={(checked, e) => {
                if (e && typeof e.stopPropagation === "function") {
                  e.stopPropagation();
                }
                handleCheckboxChange(item.id, checked);
              }}
              className="mr-1"
            />
            <label
              htmlFor={`perm-${item.id}`}
              className="text-xs font-normal text-gray-600 dark:text-gray-400 hover:cursor-pointer transition-colors duration-150 hover:text-gray-800 dark:hover:text-gray-200 whitespace-nowrap"
              title={t(item.name)}
            >
              {t(item.name)}
            </label>
          </span>
        );
      }

      return (
        <div key={item.id} className={`${level > 0 ? "ml-4" : ""}`}>
          <div
            onClick={() => toggleCategory(item.id)}
            className="flex group items-center justify-between py-1"
          >
            <div className="flex items-center gap-x-2 flex-1">
              {IconComponent && (
                <IconComponent className="h-4 w-4 text-[#031d4e] dark:text-[#7492DF] group-hover:text-[#031d4e] transition-colors duration-200" />
              )}
              <label
                htmlFor={`perm-${item.id}`}
                className={`${
                  level === 0 ? "text-md" : level === 1 ? "text-md" : "text-md"
                } text-gray-700 dark:text-gray-300 hover:cursor-pointer truncate`}
                title={t(item.name)}
              >
                {t(item.name)}
              </label>
              {level < 2 && (
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                    badgeVariant === "default"
                      ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                      : badgeVariant === "warning"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
                      : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                  }`}
                >
                  {badgeText}
                </span>
              )}
            </div>
            <div className="flex items-center gap-x-2">
              {level < 2 && (
                <Switch
                  id={`perm-${item.id}`}
                  checked={item.checked || false}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(item.id, checked)
                  }
                />
              )}
              {hasChildren(item) && (
                <button
                  type="button"
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  ) : language === "ar" ? (
                    <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              )}
            </div>
          </div>

          {isExpanded && hasChildren(item) && (
            <div
              className={`${
                level === 1
                  ? "mt-2 border-l-2 border-gray-200 dark:border-gray-600 pl-4 space-y-2"
                  : "mt-2 border-l-2 border-gray-200 dark:border-gray-600 pl-4"
              }`}
            >
              {level === 1 ? (
                <div className="flex flex-wrap items-center gap-x-4">
                  {item.children.map((child, index) => (
                    <span key={child.id} className="flex items-center">
                      {renderPermissionItem(child, level + 1)}
                      {level === 1 && index < item.children.length - 1 && (
                        <span className="text-gray-400 dark:text-gray-600 mx-2">
                          |
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                item.children.map((child) =>
                  renderPermissionItem(child, level + 1)
                )
              )}
            </div>
          )}
        </div>
      );
    },
    [
      expandedCategories,
      calculateCheckedCount,
      toggleCategory,
      handleCheckboxChange,
      hasChildren,
      t,
      language,
    ]
  );

  const renderPermissionsSection = useCallback(() => {
    return (
      <div className="space-y-4">
        {sidebarPerms.map((category) => (
          <div
            key={category.id}
            className="border rounded-lg p-4 dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-200"
          >
            {renderPermissionItem(category, 0)}
          </div>
        ))}
      </div>
    );
  }, [sidebarPerms, renderPermissionItem]);

  // Data fetching
  useEffect(() => {
    if (!roles) dispatch(getRoles());
    if (!storePermissions) dispatch(getPermissions());
  }, [dispatch, roles, storePermissions]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [userRes, permissionsResponse, workspacesRes, branchesRes] = await Promise.all(
          [
            axiosMerchant.post(`users/edit/${id}`),
            axiosMerchant.get("permissions/all"),
            axiosMerchant.get("workspaces", {
              params: { for_select: 1, per_page: 500, all: 1 },
            }), // كفاية للسيليكت
            axiosMerchant.get("branches/all").catch(() => ({ data: { data: [] } })),
          ]
        );

        const workspacesData = workspacesRes.data?.data || [];
        const branchesData = branchesRes?.data?.data || [];
        
        // Transform branches to workspace format
        const branchesAsWorkspaces = branchesData.map((branch) => ({
          id: branch.id,
          name: branch.name,
          type: "App\\Models\\Branch",
        }));
        
        // Merge all workspaces
        const allWorkspacesData = [...workspacesData, ...branchesAsWorkspaces];
        
        setWorkspaceOptions(
          allWorkspacesData.map((ws) => ({
            value: `${ws.type}|${ws.id}`,
            label: `${ws.name} (${ws.type.split("\\").pop()})`,
            raw: ws,
          }))
        );

        if (!isMounted) return;

        const user =
          userRes?.data?.data || userRes?.data?.user || userRes?.data || null;
        const allFetchedPermissions = permissionsResponse.data?.data || [];

        if (!user) throw new Error("User payload is empty");

        setRecord(user);
        setName(user.name || "");
        setEmail(user.email || "");

        const initialPhone =
          String(user?.country_code ?? "") + String(user?.phone ?? "");
        setPhone(initialPhone);

        const currentRole = user.roles?.[0];
        setSelectedRoleName(currentRole?.name || "");
        setRoleValue(
          currentRole
            ? { label: currentRole.name, value: currentRole.id }
            : null
        );

        // Map workspaces
        if (user) {
          const selected = [];

          (user.hub_users || []).forEach((h) => {
            const m = allWorkspacesData.find(
              (ws) =>
                ws.type === "App\\Models\\Hub" &&
                String(ws.id) === String(h.hub_id)
            );
            if (m) selected.push({ id: m.id, name: m.name, type: m.type });
          });

          (user.station_users || []).forEach((su) => {
            const m = allWorkspacesData.find(
              (ws) =>
                ws.type === "App\\Models\\Station" &&
                String(ws.id) === String(su.station_id)
            );
            if (m) selected.push({ id: m.id, name: m.name, type: m.type });
          });

          (user.branch_users || []).forEach((bu) => {
            const m = allWorkspacesData.find(
              (ws) =>
                ws.type === "App\\Models\\Branch" &&
                String(ws.id) === String(bu.branch_id)
            );
            if (m) selected.push({ id: m.id, name: m.name, type: m.type });
          });

          setSelectedWorkspaces(selected);
        }

        // Transform and set sidebar permissions (with new updatePermissionsState logic)
        const transformedSidebar = transformSidebarPermissions(
          sidebarPermissions,
          allFetchedPermissions
        );
        // Only use direct user permissions to set checked sidebar permissions
        const directPerms = user.permissions || [];
        const rolePerms = user.role?.permissions || [];
        // Merge on id uniqueness
        const mergedPermissions = [
          ...rolePerms,
          ...directPerms.filter(up => !rolePerms.some(rp => rp.id === up.id)),
        ];
        // Build lookup for logging id->name
        permissionLookupRef.current = buildPermissionLookup(allFetchedPermissions);
        const updatedSidebarPerms = updatePermissionsState(
          transformedSidebar,
          mergedPermissions
        );
        setSidebarPerms(updatedSidebarPerms);
        updateSelectAllState(updatedSidebarPerms);

        // DEBUG: print current user's direct permissions as {id, name}
        const currentDirectPairs = (directPerms || []).map((p) => ({
          id: String(p.id),
          name: permissionLookupRef.current.get(String(p.id)) || p.name || "(unknown)",
        }));
        console.log("Current user direct permissions (from users/edit):", currentDirectPairs);
      } catch (err) {
        handleError(err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [
    id,
    authUser,
    storePermissions,
    transformSidebarPermissions,
    updatePermissionsState,
    updateSelectAllState,
    buildPermissionLookup,
  ]);

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!record) return;

    setIsSaving(true);
    try {
      const form = new FormData();
      form.append("id", String(record.id));
      form.append("name", name);
      form.append("email", email);
      form.append("phone", phone);

      const needsWs =
        isSuperAdmin &&
        selectedRoleName &&
        !rolesWithoutWorkspaces.includes(selectedRoleName);
      
      // Always send workspaces when role requires workspaces
      // If empty, backend will clear all workspaces to prevent old data/duplicates
      if (needsWs) {
        if (selectedWorkspaces?.length > 0) {
          selectedWorkspaces.forEach((ws, idx) => {
            form.append(`workspaces[${idx}][id]`, String(ws.id));
            form.append(`workspaces[${idx}][type]`, ws.type);
          });
        } else {
          // Send empty marker to signal backend to clear all workspaces
          // Using empty string in first index so backend detects the key exists but array is empty
          form.append("workspaces[0][clear]", "true");
        }
      }

      if (roleValue) {
        form.append("role", String(roleValue.value));
      }

      if (isSuperAdmin) {
        const selectedDirectPermIds = collectSelectedPermissions(
          sidebarPermsRef.current
        );
        const pairs = selectedDirectPermIds.map((pid) => ({
          id: String(pid),
          name: permissionLookupRef.current.get(String(pid)) || "(unknown)",
        }));
        console.log("Selected permissions for submit:", pairs);
        selectedDirectPermIds.forEach((pid, idx) => {
          form.append(`user_permissions[${idx}]`, String(pid));
        });
      }

      const res = await axiosMerchant.post("users/update", form);
      toast.success(res?.data?.message || t("User updated successfully"));
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <Card className="shadow-lg border border-gray-300 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {t("Update User")}
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {isLoading ? (
              <Loader />
            ) : !record ? (
              <div className="py-10 text-center text-sm">
                {t("User not found")}
              </div>
            ) : (
              <>
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="input-container">
                    <label htmlFor="name" className="text-sm font-medium">
                      {t("Name")} <RequiredField />
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-container">
                    <label htmlFor="email" className="text-sm font-medium">
                      {t("Email")}
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-container md:col-span-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      {t("Phone")} <RequiredField />
                    </label>
                    <PhoneInput
                      country={"eg"}
                      value={phone}
                      onChange={setPhone}
                      enableSearch
                      inputClass="!bg-background !text-foreground"
                      buttonClass="!bg-muted"
                    />
                  </div>

                  <div className="input-container md:col-span-2">
                    <label htmlFor="role" className="text-sm font-medium">
                      {t("Role")} <RequiredField />
                    </label>
                    <Select
                      name="role"
                      options={roleOptions}
                      value={roleValue || undefined}
                      onChange={onRoleChange}
                    />
                  </div>
                </div>

                {/* Workspaces */}
                {requiresWorkspace && (
                  <div className="input-container">
                    <label className="text-sm font-medium">
                      {t("Workspaces")} <RequiredField />
                    </label>
                    <Select
                      isMulti
                      value={selectedWorkspaces.map((ws) => ({
                        value: `${ws.type}|${ws.id}`,
                        label: `${ws.name} (${ws.type.split("\\").pop()})`,
                      }))}
                      onChange={(opts) => {
                        const selected = (opts || []).map((opt) => {
                          const [type, id] = String(opt.value).split("|");
                          const ws = workspaceOptions.find(
                            (o) => o.value === opt.value
                          )?.raw;
                          return { id, type, name: ws?.name || opt.label };
                        });
                        setSelectedWorkspaces(selected);
                      }}
                      options={workspaceOptions}
                    />
                  </div>
                )}

                {/* Direct User Permissions */}
                {isSuperAdmin && (
                  <>
                    <hr className="my-5 border-gray-300 dark:border-gray-600" />

                    <div className="flex flex-col gap-4 mb-6">
                      <div className="flex items-center gap-x-4 justify-between">
                        <div className="flex items-center gap-x-2">
                          <Switch
                            id="select-all"
                            checked={selectAll}
                            onCheckedChange={handleSelectAll}
                          />
                          <label
                            htmlFor="select-all"
                            className="text-lg font-bold text-gray-700 dark:text-gray-300 hover:cursor-pointer"
                          >
                            {t("Select All Permissions")}
                          </label>
                        </div>
                        {/* Removed extra inline save button to keep a single submit action */}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                      <div>
                        {sidebarPerms.length > 0 ? (
                          renderPermissionsSection()
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {t("No permissions available")}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("Saving...") : t("Update User Permissions")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default UserEdit;
