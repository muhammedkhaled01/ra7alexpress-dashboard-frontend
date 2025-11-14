import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Switch } from "@/components/ui/switch";
import Loader from "@/components/Loader";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { can, handleError, generateTabId } from "@/utils/helpers";
import { getRoles } from "@/stores/features/ajaxFeature";
import { useTranslation } from "react-i18next";
import RequiredField from "@/components/misc/RequiredField";
import { ChevronDown, ChevronLeft, ChevronRight, List } from "lucide-react";
import { sidebarPermissions } from "../Layouts/links/adminLinks";
import { useLanguage } from "@/contexts/LanguageProvider";
import { Badge } from "@/components/ui/badge";
import PropTypes from "prop-types";

// Accepts optional EditMode prop (false by default)
function SaveRole({ EditMode = false }) {
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  const [role, setRole] = useState({ name: "", permissions: [] });
  const [allPermissions, setAllPermissions] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [sidebarPerms, setSidebarPerms] = useState([]);
  const [otherPerms, setOtherPerms] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [errors, setErrors] = useState({ name: "" });
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedOtherCategories, setExpandedOtherCategories] = useState({});
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const dispatch = useDispatch();
  // Track initially selected permission ids (edit mode baseline)
  const initialSelectedRef = useRef(new Set());

  // For edit mode, use refs to avoid stale closure
  const sidebarPermsRef = useRef(sidebarPerms);
  const otherPermsRef = useRef(otherPerms);
  useEffect(() => { sidebarPermsRef.current = sidebarPerms; }, [sidebarPerms]);
  useEffect(() => { otherPermsRef.current = otherPerms; }, [otherPerms]);

  // Helpers, copied and pasted logic shared by create/edit
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

  const transformSidebarPermissions = useCallback(
    (sidebarPermissions, allPermissions) => {
      if (!allPermissions || allPermissions.length === 0) return sidebarPermissions;
      const permissionMap = createPermissionMap(allPermissions);
      return sidebarPermissions.map((category) => ({
        ...category,
        id: `category_${category.name.toLowerCase().replace(/ /g, "_")}`,
        children: category.children.map((child) => {
          const permissionFromAPI = permissionMap.get(child.name);
          return {
            ...child,
            id: permissionFromAPI ? permissionFromAPI.id?.toString() || permissionFromAPI.name : child.id?.toString(),
            children:
              child.children?.map((subChild) => ({
                ...subChild,
                id: permissionMap.get(subChild.id)?.id?.toString() || subChild.id,
              })) || [],
          };
        }),
      }));
    },
    [createPermissionMap]
  );

  const getSidebarPermissionNames = useCallback((sidebarPerms) => {
    const names = new Set();
    sidebarPerms.forEach((category) => {
      category.children.forEach((child) => {
        names.add(child.name);
        child.children?.forEach((subChild) => {
          names.add(subChild.name);
        });
      });
    });
    return names;
  }, []);

  const getAllPermissionsList = useCallback((allPermissions) => {
    return allPermissions.flatMap((perm) => [perm, ...(perm.children || [])]);
  }, []);

  const getOtherPermissions = useCallback((allPermissions, sidebarPerms) => {
    if (!allPermissions || allPermissions.length === 0) return [];
    const sidebarPermissionNames = getSidebarPermissionNames(sidebarPerms);
    const allPermsList = getAllPermissionsList(allPermissions);
    return allPermsList
      .filter((perm) => !sidebarPermissionNames.has(perm.name))
      .map((perm) => ({
        name: perm.name,
        id: perm.id?.toString(),
        checked: false,
        children: [],
      }));
  }, [getSidebarPermissionNames, getAllPermissionsList]);

  const organizeOtherPermissions = useCallback((otherPermissions) => {
    const grouped = {};
    otherPermissions.forEach((perm) => {
      const parts = perm.name.split(" ");
      const baseName = parts.length > 1 ? parts.slice(0, -1).join(" ") : perm.name;
      if (!grouped[baseName]) {
        grouped[baseName] = {
          name: baseName,
          id: `other_${baseName.toLowerCase().replace(/ /g, "_")}`,
          checked: false,
          children: [],
        };
      }
      grouped[baseName].children.push({ ...perm, checked: false });
    });
    return Object.values(grouped).map((category) => ({ ...category, checked: false }));
  }, []);

  // Validation
  const validateForm = useCallback(() => {
    const newErrors = { name: role.name ? "" : t("Role name is required") };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  }, [role.name, t]);

  // Checked counting
  const calculateCheckedCount = useCallback((item) => {
    if (!item.children || item.children.length === 0) {
      return { checked: item.checked ? 1 : 0, total: 1 };
    }
    let checked = 0; let total = 0;
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

  // Role permission ids
  const getRolePermissionIds = (rolePermissions) => {
    return new Set(rolePermissions.map((p) => p.id?.toString()));
  };

  // Update permission state for edit
  const updatePermissionsState = useCallback((permissions, rolePermissions = undefined) => {
    // If not edit mode, ignore rolePermissions, just return structure
    if (!rolePermissions) return permissions.map((item) => ({ ...item, checked: false, children: item.children?.map((c) => ({ ...c, checked: false, children: c.children?.map((c2) => ({ ...c2, checked: false })) || [] })) || [] }));
    const rolePermissionIds = getRolePermissionIds(rolePermissions);

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

  // Select all state for both
  const updateSelectAllState = useCallback((sidebarPerms, otherPerms) => {
    const allSelected = [...sidebarPerms, ...otherPerms].every((category) => {
      const count = calculateCheckedCount(category);
      return count.total > 0 && count.checked === count.total;
    });
    setSelectAll(allSelected);
  }, [calculateCheckedCount]);

  // Tree update helpers
  const updateAllChildren = useCallback((children, checked) => {
    return children.map((child) => ({
      ...child,
      checked,
      children: child.children ? updateAllChildren(child.children, checked) : [],
    }));
  }, []);

  const updateCheckboxState = useCallback((items, targetId, newChecked, parentItemId = null) => {
    // Normalize IDs for comparison (handle string/number mismatches)
    const normalizeId = (id) => id?.toString();
    const targetIdStr = normalizeId(targetId);
    const parentItemIdStr = normalizeId(parentItemId);
    
    const updateItemAndPropagate = (item, currentParentId = null) => {
      let updatedItem = item;
      const itemIdStr = normalizeId(item.id);
      const currentParentIdStr = normalizeId(currentParentId);
      
      // If we're looking for a permission (level 2), only update if it matches the targetId AND the parent matches
      // If we're looking for an item or category (level 0-1), just match by id
      const isTargetMatch = itemIdStr === targetIdStr;
      const shouldUpdate = parentItemIdStr 
        ? (isTargetMatch && currentParentIdStr === parentItemIdStr)
        : isTargetMatch;
      
      if (shouldUpdate) {
        updatedItem = {
          ...item,
          checked: newChecked,
          children: item.children ? updateAllChildren(item.children, newChecked) : item.children,
        };
      } else if (item.children && item.children.length > 0) {
        // Determine the current parent ID for children
        // If this item is a category or item (has children that are permissions), its ID becomes the parent
        const itemIdStr = normalizeId(item.id);
        const nextParentId = (itemIdStr?.startsWith("item_") || itemIdStr?.startsWith("category_")) 
          ? item.id 
          : currentParentId;
        const updatedChildren = item.children.map(child => updateItemAndPropagate(child, nextParentId));
        // Recalculate checked by children
        const count = calculateCheckedCount({ children: updatedChildren, checked: false, id: "temp" });
        let newParentChecked = false;
        if (count.total > 0) {
          if (count.checked === count.total) newParentChecked = true;
          else if (count.checked > 0) newParentChecked = false;
        } else {
          newParentChecked = item.checked;
        }
        updatedItem = { ...item, checked: newParentChecked, children: updatedChildren };
      }
      return updatedItem;
    };
    return items.map(item => updateItemAndPropagate(item));
  }, [updateAllChildren, calculateCheckedCount]);

  const getItemCheckedState = useCallback((items, targetId) => {
    for (const item of items) {
      if (item.id === targetId) return item.checked;
      if (item.children) {
        const found = getItemCheckedState(item.children, targetId);
        if (found !== undefined) return found;
      }
    }
    return undefined;
  }, []);

  // Collect permissions
  const collectSelectedPermissions = useCallback((items) => {
    const selected = [];
    const collector = (items) => {
      items.forEach((item) => {
        if (item.checked) {
          if (!item.children || item.children.length === 0) {
            if (!item.id?.toString().startsWith("category_") && !item.id?.toString().startsWith("other_")) {
              if (!isNaN(Number(item.id))) {
                selected.push(item.id?.toString());
              }
            }
          }
        }
        if (item.children) collector(item.children);
      });
    };
    collector(items);
    return selected;
  }, []);

  // For edit/create splitting - collect all selected for create, otherwise need refs (to avoid race)
  const getAllSelectedPermissions = useCallback(() => {
    return [
      ...collectSelectedPermissions(sidebarPerms),
      ...collectSelectedPermissions(otherPerms),
    ];
  }, [collectSelectedPermissions, sidebarPerms, otherPerms]);

  // Compute diff of added/removed permissions vs initial baseline (edit mode)
  const permissionDiff = useMemo(() => {
    if (!EditMode) return { added: [], removed: [] };
    const current = new Set(getAllSelectedPermissions());
    const initial = initialSelectedRef.current || new Set();
    const added = [];
    const removed = [];
    current.forEach((id) => { if (!initial.has(id)) added.push(id); });
    initial.forEach((id) => { if (!current.has(id)) removed.push(id); });
    return { added, removed };
  }, [EditMode, getAllSelectedPermissions]);

  // Select all toggle
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
    const newOtherPerms = updateAllItems(otherPerms);
    setSidebarPerms(newSidebarPerms);
    setOtherPerms(newOtherPerms);
  }, [selectAll, sidebarPerms, otherPerms]);

  // Checkbox change
  const handleCheckboxChange = useCallback((id, newCheckedValue, parentItemId = null) => {
    const nextSidebar = updateCheckboxState(sidebarPerms, id, newCheckedValue, parentItemId);
    const nextOther = updateCheckboxState(otherPerms, id, newCheckedValue, parentItemId);
    setSidebarPerms(nextSidebar);
    setOtherPerms(nextOther);
    updateSelectAllState(nextSidebar, nextOther);
  }, [updateCheckboxState, updateSelectAllState, sidebarPerms, otherPerms]);

  // Toggle expanded categories
  const toggleCategory = useCallback((categoryId, isOther = false) => {
    if (isOther) {
      setExpandedOtherCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
    } else {
      setExpandedCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
    }
  }, []);

  // Has children
  const hasChildren = useCallback((item) => {
    return item.children && item.children.length > 0;
  }, []);

  // Name change
  const handleNameChange = useCallback((e) => {
    setRole((prev) => ({ ...prev, name: e.target.value }));
  }, []);

  // Submissions
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const selectedPermissions = getAllSelectedPermissions();
      let payload;
      let response;
      if (EditMode) {
        payload = { id: params.id, name: role.name, permissions: selectedPermissions };
        response = await axiosMerchant.post(`roles/update`, payload);
      } else {
        payload = { name: role.name, permissions: selectedPermissions };
        response = await axiosMerchant.post(`roles/store`, payload);
      }
      toast.success(response.data.message);
      dispatch(getRoles());
      const currentTabId = generateTabId(EditMode ? `/roles/edit-role/${params.id}` : "/roles/create-role");
      navigate("/roles", { state: { closeTabId: currentTabId } });
    } catch (error) {
      handleError(error);
      console.error(EditMode ? "Error updating role:" : "Error creating role:", error);
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, getAllSelectedPermissions, role.name, EditMode, params.id, dispatch, navigate]);

  // Permissions filter
  const filteredSidebarPerms = useMemo(() => {
    if (!filterText) return sidebarPerms;
    const lowerCaseFilter = filterText.toLowerCase();
    const filterItem = (item) => {
      const nameMatches = t(item.name).toLowerCase().includes(lowerCaseFilter);
      if (!item.children || item.children.length === 0) {
        return nameMatches ? item : null;
      }
      const filteredChildren = item.children
        .map((child) => filterItem(child))
        .filter(Boolean);
      return nameMatches || filteredChildren.length > 0 ? { ...item, children: filteredChildren } : null;
    };
    return sidebarPerms.map(filterItem).filter(Boolean);
  }, [sidebarPerms, filterText, t]);

  // Permissions renderers
  const renderPermissionItem = useCallback(
    (item, level = 0, isOther = false, parentItemId = null) => {
      const isExpanded = isOther
        ? expandedOtherCategories[item.id]
        : expandedCategories[item.id];
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
      // Determine the current parent ID: if this item is at level 1 (an item like "Zones Map" or "Routing rules"), 
      // its ID should be used as parent for its children (level 2 permissions)
      const currentParentId = (level === 1 && (item.id?.toString().startsWith("item_") || item.id?.toString().startsWith("category_"))) 
        ? item.id 
        : parentItemId;
      
      if (level === 2) {
        return (
          <span key={item.id} className="inline-flex gap-x-3 items-center">
            <Switch
              id={`perm-${item.id}`}
              checked={item.checked || false}
              onClick={(e) => e.stopPropagation()}
              onPointerDownCapture={(e) => e.stopPropagation()}
              onCheckedChange={(checked) => {
                handleCheckboxChange(item.id, checked, currentParentId);
              }}
              className="mr-1"
            />
            <label htmlFor={`perm-${item.id}`} className="text-xs font-normal text-gray-600 dark:text-gray-400 hover:cursor-pointer transition-colors duration-150 hover:text-gray-800 dark:hover:text-gray-200 whitespace-nowrap" title={t(item.name)}>{t(item.name)}</label>
          </span>
        );
      }
      return (
        <div key={item.id} className={`${level > 0 ? "ml-4" : ""}`}>
          <div onClick={() => toggleCategory(item.id, isOther)} className="flex group items-center justify-between py-1">
            <div className="flex items-center gap-x-2 flex-1">
              {IconComponent && <IconComponent className="h-4 w-4 text-[#031d4e] dark:text-[#7492DF] group-hover:text-[#031d4e] transition-colors duration-200" />}
              <label htmlFor={`perm-${item.id}`} className={`${level === 0 ? "text-md" : "text-md"} text-gray-700 dark:text-gray-300 hover:cursor-pointer truncate`} title={t(item.name)}>{t(item.name)}</label>
              {level < 2 && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${badgeVariant === 'default'
                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                  : badgeVariant === 'warning'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
                    : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                  }`}>
                  {badgeText}
                </span>
              )}
            </div>
            <div className="flex items-center gap-x-2">
              {level < 2 && (
                <Switch
                  id={`perm-${item.id}`}
                  checked={item.checked || false}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDownCapture={(e) => e.stopPropagation()}
                  onCheckedChange={(checked) => handleCheckboxChange(item.id, checked)}
                />
              )}
              {hasChildren(item) && (
                <button type="button" className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">
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
            <div className={`${level === 1 ? "mt-2 border-l-2 border-gray-200 dark:border-gray-600 pl-4 space-y-2" : "mt-2 border-l-2 border-gray-200 dark:border-gray-600 pl-4"}`}>
              {level === 1 ? (
                <div className="flex flex-wrap items-center gap-x-4">
                  {item.children.map((child, index) => (
                    <span key={child.id} className="flex items-center">
                      {renderPermissionItem(child, level + 1, isOther, currentParentId)}
                      {level === 1 && index < item.children.length - 1 && (
                        <span className="text-gray-400 dark:text-gray-600 mx-2">|</span>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                item.children.map((child) => renderPermissionItem(child, level + 1, isOther, currentParentId))
              )}
            </div>
          )}
        </div>
      );
    }, [expandedCategories, expandedOtherCategories, calculateCheckedCount, toggleCategory, handleCheckboxChange, hasChildren, t, language]);

  const renderPermissionsSection = useCallback((permissions, isOther = false) => {
    return (
      <div className="space-y-4">
        {permissions.map((category) => (
          <div key={category.id} className="border rounded-lg p-4 dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-200">
            {renderPermissionItem(category, 0, isOther)}
          </div>
        ))}
      </div>
    );
  }, [renderPermissionItem]);

  // Fetch initial data (edit or create mode)
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (EditMode) {
          // Edit fetch
          const [roleResponse, permissionsResponse] = await Promise.all([
            axiosMerchant.get(`roles/show/${params.id}`),
            axiosMerchant.get("permissions/all"),
          ]);
          if (!isMounted) return;
          const fetchedRole = roleResponse.data.data;
          const allFetchedPermissions = permissionsResponse.data?.data || [];
          setAllPermissions(allFetchedPermissions);
          const transformedSidebar = transformSidebarPermissions(sidebarPermissions, allFetchedPermissions);
          const updatedSidebarPerms = updatePermissionsState(transformedSidebar, fetchedRole.permissions);
          setSidebarPerms(updatedSidebarPerms);
          const otherPermissionsList = getOtherPermissions(allFetchedPermissions, transformedSidebar);
          const organizedOtherPerms = organizeOtherPermissions(otherPermissionsList);
          const updatedOtherPerms = updatePermissionsState(organizedOtherPerms, fetchedRole.permissions);
          setOtherPerms(updatedOtherPerms);
          setRole({ name: fetchedRole.name, permissions: fetchedRole.permissions || [] });
          // Capture initial baseline of selected permissions (ids as strings)
          const baseline = new Set((fetchedRole.permissions || []).map((p) => p.id?.toString()));
          initialSelectedRef.current = baseline;
          updateSelectAllState(updatedSidebarPerms, updatedOtherPerms);
        } else {
          // Create fetch
          const permissionsResponse = await axiosMerchant.get("permissions/all");
          if (!isMounted) return;
          const allFetchedPermissions = permissionsResponse.data?.data || [];
          setAllPermissions(allFetchedPermissions);
          const transformedSidebar = transformSidebarPermissions(sidebarPermissions, allFetchedPermissions);
          const updatedSidebarPerms = updatePermissionsState(transformedSidebar);
          setSidebarPerms(updatedSidebarPerms);
          const otherPermissionsList = getOtherPermissions(allFetchedPermissions, transformedSidebar);
          const organizedOtherPerms = organizeOtherPermissions(otherPermissionsList);
          const updatedOtherPerms = updatePermissionsState(organizedOtherPerms);
          setOtherPerms(updatedOtherPerms);
          updateSelectAllState(updatedSidebarPerms, updatedOtherPerms);
        }
      } catch (error) {
        if (isMounted) {
          handleError(error);
          console.error("Error fetching data:", error);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [EditMode, params.id, transformSidebarPermissions, updatePermissionsState, getOtherPermissions, organizeOtherPermissions, updateSelectAllState]);

  // Permissions ability check
  const canAccess = can(EditMode ? "Role update" : "Role create");
  if (!canAccess) {
    navigate("/unauthorized");
    return null;
  }

  // Render
  return (
    <div className="p-6 min-h-screen">
      <Card className="shadow-lg border border-gray-300 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {EditMode ? t("Edit Role") : t("Create New Role")}
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
                    <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("Role Name")} <RequiredField />
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder={t("Enter Role Name...")}
                      value={role.name}
                      onChange={handleNameChange}
                      error={errors.name}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>
                </div>

                <hr className="my-5 border-gray-300 dark:border-gray-600" />

                {/* Permissions selection summary (show only added/removed vs baseline) */}
                {EditMode && (
                <div className="flex flex-col gap-4 mb-6">
                  <div className="w-full">
                    <div className="mb-2 font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between">
                      <span>{t("Changed Permissions")}</span>
                      <Badge variant="outline" className="text-xs">
                        {(permissionDiff.added.length + permissionDiff.removed.length)} {t("items")}
                      </Badge>
                    </div>
                    <div className="border rounded-lg shadow-md bg-white dark:bg-gray-900 max-h-60 overflow-y-auto">
                      {(permissionDiff.added.length + permissionDiff.removed.length) > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                          {(() => {
                            const permissionsMap = new Map();
                            allPermissions.flatMap(perm => [perm, ...(perm.children || [])]).forEach(perm => {
                              permissionsMap.set(perm.id?.toString(), perm);
                            });
                            const renderItem = (id, type) => {
                              const permission = permissionsMap.get(id);
                              const label = permission ? t(permission.name) : t('Permission');
                              const pageInfo = permission?.page ? (
                                <span className="ml-2 text-xs text-muted-foreground">{t('From')}: {permission.page}</span>
                              ) : null;
                              const typeBadge = (
                                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${type === 'added'
                                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}`}>
                                  {type === 'added' ? t('Added') : t('Removed')}
                                </span>
                              );
                              return (
                                <li key={`${type}-${id}`} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                  <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {label} {pageInfo} {typeBadge}
                                  </span>
                                  {type === 'added' ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      type="button"
                                      onClick={() => handleCheckboxChange(id, false)}
                                    >
                                      {t("Remove")}
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                      type="button"
                                      onClick={() => handleCheckboxChange(id, true)}
                                    >
                                      {t("Restore")}
                                    </Button>
                                  )}
                                </li>
                              );
                            };
                            return [
                              ...permissionDiff.added.map((id) => renderItem(id, 'added')),
                              ...permissionDiff.removed.map((id) => renderItem(id, 'removed')),
                            ];
                          })()}
                        </ul>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                          <List className="h-8 w-8 mb-2" />
                          <span className="text-sm font-medium">{t("No Permissions Modified")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                )}
                {/* Permissions selection collapse menu */}
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center gap-x-4 justify-between">
                    <div className="flex items-center gap-x-2">
                      <Switch
                        id="select-all"
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                      <label htmlFor="select-all" className="text-lg font-bold text-gray-700 dark:text-gray-300 hover:cursor-pointer">
                        {t("Select All Permissions")}
                      </label>
                    </div>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? t(EditMode ? "Updating..." : "Creating...") : t(EditMode ? "Update Role" : "Create Role")}
                    </Button>
                  </div>
                  <div>
                    <Input
                      id="filter-permissions"
                      placeholder={t("Filter permissions...")}
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-8">
                  <div>
                    {filteredSidebarPerms.length > 0 ? (
                      renderPermissionsSection(filteredSidebarPerms, false)
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {filterText
                          ? t("No permissions match your filter.")
                          : t("No sidebar permissions available")}
                      </p>
                    )}
                  </div>
                  {/* Always show OtherPermissions (below main sidebar tree) */}
                  {/* <div>
                    {otherPerms.length > 0 ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                          {t("Other Permissions")}
                        </h3>
                        {renderPermissionsSection(otherPerms, true)}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {t("No other permissions available")}
                      </p>
                    )}
                  </div> */}
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t(EditMode ? "Updating..." : "Creating...") : t(EditMode ? "Update Role" : "Create Role")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default SaveRole;
SaveRole.propTypes = {
  EditMode: PropTypes.bool,
};
