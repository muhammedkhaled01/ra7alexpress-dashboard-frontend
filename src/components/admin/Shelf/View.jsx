import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosMerchant from "@/axios";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { hasRole, printLabel } from "@/utils/helpers";
import { LucideLoader, PrinterIcon } from "lucide-react";

const ShelfView = () => {
  const { id } = useParams(); // Get the dynamic `id` from the URL
  const [shelf, setShelf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  const { t } = useTranslation();
  const isAdmin = hasRole("Super Admin");
  useEffect(() => {
    const fetchShelf = async () => {
      console.log(id);
      try {
        const response = await axiosMerchant.get(`shelves/getSingle`, {
          params: {
            id: id,
          },
        });

        setShelf(response.data.data);
        console.log(response.data.data);
      } catch (error) {
        console.error("Error fetching shelf data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShelf();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!shelf) {
    return <div>Shelf not found</div>;
  }

  const handlePrint = async (item) => {
    try {
      setIsPrinting((prev) => ({ ...prev, [item.id]: true }));

      const response = await axiosMerchant.get(`/shelves/printShelfItem`, {
        params: { id: item.id },
      });

      // Print the backend HTML response
      printLabel(response.data);

      setIsPrinting((prev) => ({ ...prev, [item.id]: false }));
    } catch (error) {
      console.error("Error fetching shelf data for printing:", error);
      setIsPrinting((prev) => ({ ...prev, [item.id]: false }));
    }
  };



  return (
    <div className="w-full p-6 bg-white shadow-lg rounded-lg mt-1">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">
        {t("Shelf Details")}
      </h1>

      {/* Shelf Details */}
      <div className="space-y-6">
        {/* Name */}
        <div className="flex justify-between items-center">
          <div className="text-lg font-medium text-gray-700">{t("Name")}:</div>
          <div className="text-lg text-gray-500">{shelf.name}</div>
        </div>

        {/* Rows */}
        <div className="flex justify-between items-center">
          <div className="text-lg font-medium text-gray-700">Rows:</div>
          <div className="text-lg text-gray-500">{shelf.rows}</div>
        </div>

        {/* Columns */}
        <div className="flex justify-between items-center">
          <div className="text-lg font-medium text-gray-700">Columns:</div>
          <div className="text-lg text-gray-500">{shelf.columns}</div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-lg font-medium text-gray-700">Barcode:</div>
          <div className="text-lg text-gray-500">{shelf.barcode}</div>
        </div>
        {isAdmin && (
          <div>
            {/* Hub */}
            <div className="flex justify-between items-center">
              <div className="text-lg font-medium text-gray-700">
                {t("Hub")}:
              </div>
              <div className="text-lg text-gray-500">
                {shelf?.hub?.name || "N/A"}
              </div>
            </div>

            {/* Station */}
            <div className="flex justify-between items-center">
              <div className="text-lg font-medium text-gray-700">
                {t("Station")}:
              </div>
              <div className="text-lg text-gray-500">
                {shelf?.station?.name || "N/A"}
              </div>
            </div>

            {/* Branch */}
            <div className="flex justify-between items-center">
              <div className="text-lg font-medium text-gray-700">
                {t("Branch")}:
              </div>
              <div className="text-lg text-gray-500">
                {shelf?.branch?.name || "N/A"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {t("Shelves")}: ({shelf.items.length})
        </h2>
        {shelf?.items?.length > 0 ? (
          <div className="space-y-4">
            {shelf.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="flex items-center justify-between p-4 bg-gray-100 rounded-md shadow-sm"
              >
                <div className="flex items-center gap-x-4 text-2xl">
                  <div className="text-lg font-medium text-gray-700 ">
                    {t("Position")}:


                  </div>
                  <div className="text-lg text-gray-500">
                    {item.position || "Not available"}
                  </div>
                </div>
                <div> {t("Barcode")}: {item.barcode}</div>
                <Button
                  onClick={() => handlePrint(item)}
                  disabled={isPrinting[item.id]}
                >
                  <PrinterIcon className="h-6 w-6" />{" "}
                  {isPrinting[item.id] && (
                    <LucideLoader className="h-4 w-4 animate-spin mr-2 inline-block" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-sm text-gray-500">No items available</span>
        )}
      </div>
    </div>
  );
};

export default ShelfView;
