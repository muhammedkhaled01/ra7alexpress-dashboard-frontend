import React, { useMemo } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const DateTimeRangePicker = ({ filters, onChange, t }) => {
    const defaultFromDate = filters.from ? new Date(filters.from) : undefined;
    const defaultToDate = filters.to ? new Date(filters.to) : undefined;

    const displayRange = useMemo(() => {
        const DATE_FORMAT = "dd/MM/yy";
        const fromDateStr = filters.from ? format(new Date(filters.from), DATE_FORMAT) : t('Start Date');
        const toDateStr = filters.to ? format(new Date(filters.to), DATE_FORMAT) : t('End Date');
        const fromTimeStr = filters.from_time;
        const toTimeStr = filters.to_time;

        if (filters.from && filters.to) {
            return `${fromDateStr} ${fromTimeStr} - ${toDateStr} ${toTimeStr}`;
        }
        return t("Filter by Date & Time");
    }, [filters, t]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "max-w-[300px] w-full justify-start text-left font-normal",
                        "truncate", 
                        !filters.from && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">{displayRange}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex flex-col p-4 space-y-4">
                    <div className="flex gap-2">
                        <div className="flex flex-col gap-1">
                            <Label className="font-semibold">{t("From Date")}</Label>
                            <Calendar
                                mode="single"
                                selected={defaultFromDate}
                                onSelect={(date) => onChange('from', date ? format(date, "yyyy-MM-dd") : null)}
                                initialFocus
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="font-semibold">{t("To Date")}</Label>
                            <Calendar
                                mode="single"
                                selected={defaultToDate}
                                onSelect={(date) => onChange('to', date ? format(date, "yyyy-MM-dd") : null)}
                                initialFocus
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 p-2 border rounded-md">
                        <div className="flex flex-col gap-1 w-full">
                            <Label htmlFor="from-time-input">{t("Start Time")}</Label>
                            <Input
                                id="from-time-input"
                                type="time"
                                value={filters.from_time}
                                onChange={(e) => onChange("from_time", e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1 w-full">
                            <Label htmlFor="to-time-input">{t("End Time")}</Label>
                            <Input
                                id="to-time-input"
                                type="time"
                                value={filters.to_time}
                                onChange={(e) => onChange("to_time", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};