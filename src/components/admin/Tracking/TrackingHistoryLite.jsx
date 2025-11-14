import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RotateCcw, RotateCw, Check } from "lucide-react";

const TrackingHistoryLite = ({
  trackingResult,
  isVertical,
  setIsVertical,
  title = "Tracking History",
}) => {
  const items = Array.isArray(trackingResult?.checkpoints)
    ? [...trackingResult.checkpoints]
    : [];

  // sort descending by time
  items.sort((a, b) => {
    const ta = a?.time ? new Date(a.time).getTime() : 0;
    const tb = b?.time ? new Date(b.time).getTime() : 0;
    return tb - ta;
  });

  return (
    <Card
      className={`${
        trackingResult?.is_external ? "mb-10" : ""
      } rounded-xl shadow-lg bg-white relative`}
    >
      <CardHeader className="border-b border-gray-300 flex items-center justify-between flex-row">
        <h3 className="font-extrabold text-primary-blue border-b-2 border-primary-orange inline-block pb-1 text-2xl tracking-wide w-fit">
          {title}
        </h3>
        <button
          onClick={() => setIsVertical(!isVertical)}
          className="p-2 rounded-full hover:bg-primary-orange/10 transition-colors"
          title={isVertical ? "Switch to horizontal" : "Switch to vertical"}
          type="button"
        >
          {isVertical ? (
            <RotateCw className="w-5 h-5 text-primary-orange" />
          ) : (
            <RotateCcw className="w-5 h-5 text-primary-orange" />
          )}
        </button>
      </CardHeader>

      <CardContent className="p-6">
        {isVertical ? (
          <VerticalTimeline items={items} />
        ) : (
          <HorizontalTimeline items={items} />
        )}
      </CardContent>
    </Card>
  );
};

export default TrackingHistoryLite;

/** ========= Vertical View ========== */
const VerticalTimeline = ({ items }) => {
  if (!items.length) {
    return <div className="text-sm text-gray-500">No tracking history</div>;
  }

  return (
    <ul className="relative ml-4 pl-6 border-l-2 border-orange-300">
      {items.map((it, i) => {
        const done = true;
        return (
          <li key={`${it.code}-${i}`} className="relative pb-8 last:pb-0">
            <span
              className={`absolute -left-[13px] top-0 w-7 h-7 rounded-full flex items-center justify-center ring-4 ${
                done
                  ? "bg-orange-500 text-white ring-orange-100"
                  : "bg-gray-200 text-gray-400 ring-gray-100"
              }`}
            >
              {done ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-white/70" />
              )}
            </span>

            <div className={`${done ? "" : "opacity-60"}`}>
              <div className="text-[15px] font-extrabold text-slate-900 mb-1">
                {it.title || it.code}
              </div>
              {it.description && (
                <div className="text-[13px] text-slate-700">
                  {it.description}
                </div>
              )}
              {it.time && (
                <div className="mt-3 text-[12px] text-slate-500">
                  {new Date(it.time).toLocaleString()}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

/** ========= Horizontal View ========== */
const HorizontalTimeline = ({ items }) => {
  if (!items.length) {
    return <div className="text-sm text-gray-500">No tracking history</div>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[720px] grid grid-flow-col auto-cols-[minmax(180px,1fr)] gap-6">
        {items.map((it, i) => (
          <div
            key={`${it.code}-${i}`}
            className="relative rounded-xl border p-4 bg-gradient-to-br from-orange-50 to-white"
          >
            <div className="absolute -top-3 left-4 w-7 h-7 rounded-full flex items-center justify-center ring-4 bg-orange-500 text-white ring-orange-100">
              <Check className="w-4 h-4" />
            </div>
            <div className="text-sm font-extrabold text-slate-900 mb-1 mt-2">
              {it.title || it.code}
            </div>
            {it.description && (
              <div className="text-xs text-slate-700">{it.description}</div>
            )}
            {it.time && (
              <div className="mt-3 text-[12px] text-slate-500">
                {new Date(it.time).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
