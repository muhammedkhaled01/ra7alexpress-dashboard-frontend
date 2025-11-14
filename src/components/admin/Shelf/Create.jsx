import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosMerchant from "@/axios";
import { toast } from "react-hot-toast";
import { Loader2, Plus } from "lucide-react";
import { handleError, hasRole } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { getHubs, getShelfCategories } from "@/stores/features/ajaxFeature";
import Select from "@/components/misc/Select";
import RequiredField from "@/components/misc/RequiredField";
import ShelfCategoryCreate from "@/components/admin/ShelfCategory/Create";

Create.propTypes = {
  onSubmitSuccess: PropTypes.func,
  categorySuccess: PropTypes.func
};

function Create({ onSubmitSuccess, categorySuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [area, setArea] = useState("");
  const [shelves, setShelves] = useState(2);
  const [layers, setLayers] = useState(2);
  const [partitions, setPartitions] = useState(2);
  const [categoryId, setCategory] = useState(null);
  const [hub, setHub] = useState(null);
  const [station, setStation] = useState(null);
  const [branch, setBranch] = useState(null);
  const [stations, setStations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [errors, setErrors] = useState({
    area: '',
    category: '',
    shelves: '',
    layers: '',
    partitions: '',
  });

  const { t } = useTranslation();
  const hubs = useSelector((store) => store.ajax.hubs);
  const user = useSelector((store) => store.auth.user);
  const shelfcategories = useSelector((store) => store.ajax.shelfcategories);
  const dispatch = useDispatch();

  const isStationAdmin = hasRole("StationAdmin");
  const isAdmin = hasRole("Super Admin");

  const handleHubChange = async (selectedOption) => {
    setHub(selectedOption);
    setStations([]);
    setStation(null);
    setBranches([]);
    setBranch(null);

    try {
      const response = await axiosMerchant.get(`/hubs/getStationsByHub`, {
        params: { hubId: selectedOption.value },
      });
      setStations(response.data.data);
    } catch (error) {
      console.error("Error fetching stations:", error);
    }
  };

  const handleStationChange = async (selectedOption) => {
    setStation(selectedOption);
    setBranches([]);
    setBranch(null);

    try {
      const response = await axiosMerchant.get(`/branches/getBranchesByStation`, {
        params: { stationId: selectedOption.value },
      });
      setBranches(response.data.data);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const handleCategoryChange = (category) => {
    setCategory(category.value);
  };

  const validateForm = () => {
    const newErrors = {
      category: categoryId ? '' : t('Category is required'),
      area: area ? '' : t('Area is required'),
      shelves: shelves > 0 ? '' : t('Number of shelves must be greater than 0'),
      layers: layers > 0 ? '' : t('Number of layers must be greater than 0'),
      partitions: partitions > 0 ? '' : t('Number of partitions must be greater than 0'),
    };

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const form = new FormData();
      form.append("area", area);
      form.append("category", categoryId);
      form.append("shelves", shelves);
      form.append("layers", layers);
      form.append("partitions", partitions);

      if (isAdmin) {
        form.append("hub_id", hub?.value || "");
        form.append("station_id", station?.value || "");
        form.append("branch_id", branch?.value || "");
      }

      const response = await axiosMerchant.post("shelves/store", form);
      toast.success(response.data.message);

      if (onSubmitSuccess) onSubmitSuccess();

      // Reset the form
      setArea("");
      setShelves(2);
      setLayers(2);
      setPartitions(2);
      setHub(null);
      setStation(null);
      setBranch(null);
      setShowDialog(false);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hubs) {
      dispatch(getHubs());
    }

    if (!shelfcategories) {
      dispatch(getShelfCategories());
    }

    if (isStationAdmin && user?.station_user?.station_id) {
      handleStationChange(user?.station_user?.station_id);
    }
  }, [dispatch, hubs, isStationAdmin, shelfcategories, user?.station_user?.station_id]);

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button type="button" className="flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>{t("Create Shelf")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] sm:mx-auto lg:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("Create Shelf")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4 mt-2">
            <div className="flex flex-row gap-2 space-x-2">
              <div className="flex-2 flex-grow-[2] mt-4 input-container">
                <label htmlFor="Category">{t("Category")} <RequiredField /></label>
                <Select
                  options={shelfcategories?.map((category) => ({
                    value: category.id,
                    label: category.name,
                  }))}
                  name="category"
                  onChange={handleCategoryChange}
                  placeholder={t("Select category")}
                  error={errors.category}
                />
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                )}
              </div>
              <div className="flex-1 flex-grow self-end mt-4">
                <ShelfCategoryCreate onSubmitSuccess={categorySuccess} />
              </div>
            </div>
            <div className="input-container">
              <label htmlFor="area">{t("Area")} <RequiredField /></label>
              <Input
                id="area"
                type="text"
                placeholder={t("Enter Area...")}
                value={area}
                onChange={(e) => setArea(e.target.value)}
                error={errors.area}
              />
              {errors.area && (
                <p className="mt-1 text-sm text-red-500">{errors.area}</p>
              )}
            </div>
          </div>

          <div className="flex-1 mt-3 input-container">
            <label htmlFor="shelves">{t("No Of Shelves")} <RequiredField /></label>
            <Input
              id="shelves"
              type="number"
              placeholder={t("Enter No Of Shelves...")}
              value={shelves}
              onChange={(e) => setShelves(e.target.value)}
              min="1"
              error={errors.shelves}
            />
            {errors.shelves && (
              <p className="mt-1 text-sm text-red-500">{errors.shelves}</p>
            )}
          </div>

          <div className="flex-1 mt-3 input-container">
            <label htmlFor="layers">{t("No Of Layers")} <RequiredField /></label>
            <Input
              id="layers"
              type="number"
              placeholder={t("Enter No Of Layers...")}
              value={layers}
              onChange={(e) => setLayers(e.target.value)}
              min="1"
              error={errors.layers}
            />
            {errors.layers && (
              <p className="mt-1 text-sm text-red-500">{errors.layers}</p>
            )}
          </div>

          <div className="flex-1 mt-3 input-container">
            <label htmlFor="partitions">{t("No Of Partitions")} <RequiredField /></label>
            <Input
              id="partitions"
              type="number"
              placeholder={t("Enter No Of Partitions...")}
              value={partitions}
              onChange={(e) => setPartitions(e.target.value)}
              min="1"
              error={errors.partitions}
            />
            {errors.partitions && (
              <p className="mt-1 text-sm text-red-500">{errors.partitions}</p>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : t("Submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Create;
