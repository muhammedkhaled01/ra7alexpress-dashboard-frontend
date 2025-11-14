import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

const Search = ({
    searchValue,
    onSearchChange,
    onSearchSubmit,
    onRefresh,
    showRefresh,
    placeholder,
}) => {
    const { t } = useTranslation();

    return (
        <form onSubmit={onSearchSubmit}>
            <div className="flex gap-x-2">
                <Input
                    name="search"
                    type="text"
                    className="w-[200px]"
                    value={searchValue}
                    id="search"
                    placeholder={placeholder || t("Search")}
                    onChange={onSearchChange}
                />
                {/* <Button variant="filter" type="submit">
                    <Filter />
                </Button> */}
                <Button type="button" variant="refresh" onClick={onRefresh}>
                    <RefreshCcw className="w-4 h-4" />
                </Button>
            </div>
        </form>
    );
};

export default Search;