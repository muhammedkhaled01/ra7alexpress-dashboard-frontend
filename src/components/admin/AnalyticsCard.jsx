import { useState } from "react";
import {
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import LineChartComponent from "../charts/LineChartComponent";
import PieChartComponent from "../charts/PieChartComponent";
import BarChartComponent from "../charts/BarChartComponent";
import GaugeComponent from "../charts/GaugeComponent";
import VerticalComponent from "../charts/VerticalComponent";
import { useTranslation } from "react-i18next";

function AnalyticsCard({ data, title, chartType, icon }) {
  const [viewMode, setViewMode] = useState("cards");
  const [currentChartTypeIndex, setCurrentChartTypeIndex] = useState(0);

  const { t } = useTranslation();

  const renderChart = () => {
    const formattedData = data.map(item => ({
      ...item,
      value: Number(item?.value) || 0,
    }));
    switch (chartType[currentChartTypeIndex].toLowerCase()) {
      case "line":
        return <LineChartComponent data={formattedData} />;
      case "pie":
        return <PieChartComponent data={formattedData} />;
      case "bar":
        return <BarChartComponent data={formattedData} />;
      case "gauge":
        return <GaugeComponent data={formattedData} />;
      case "vertical":
        return <VerticalComponent data={formattedData} />;
      default:
        return <BarChartComponent data={formattedData} />;
    }
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-2 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-x-3">
          <div>{icon}</div>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex flex-col md:flex-row justify-center md:justify-normal gap-2 md:space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "cards" ? "chart" : "cards")}
            className="transition-all"
          >
            {viewMode === "cards" ? t('Show Chart') : t('Show Cards')}
          </Button>
          {viewMode === "chart" && chartType.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentChartTypeIndex((currentChartTypeIndex + 1) % chartType.length)
              }
              className="transition-all"
            >
              {t('Switch to')} {chartType[(currentChartTypeIndex + 1) % chartType.length]}
            </Button>
          )}
        </div>
      </div>

      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item, index) => (
            <div
              key={index}
              className={`rounded-lg border bg-muted ${item?.notAllowed ? "opacity-50 cursor-not-allowed" : ""} p-6 shadow hover:shadow-md transition-all flex flex-col justify-between gap-2`}
            >
              <div className="flex flex-col items-start gap-3">
                <div className="bg-white dark:bg-gray-900 p-2 rounded-full">
                  {item?.icon}
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">{item?.title}</h3>
              </div>
              <div className="text-3xl font-bold text-primary">
                {isNaN(item?.value) ? 0 : Number(item?.value)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full h-96">{renderChart()}</div>
      )}
    </div>
  );
}

export default AnalyticsCard;
