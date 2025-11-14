import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Select from '@/components/misc/Select';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

export default function StockFilters({ searchTerm, onSearchChange, selectedCategory, onCategoryChange, t }) {
    const categoryOptions = [
        { value: '', label: t('All Categories') },
        { value: 'Packaging', label: t('Packaging') },
        { value: 'Labels', label: t('Labels') },
        { value: 'Tape', label: t('Tape') },
        { value: 'Other', label: t('Other') }
    ];

    const [searchInput, setSearchInput] = useState(searchTerm);

    // Debounce function with cleanup
    const [debounceTimeout, setDebounceTimeout] = useState(null);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchInput(value);
        
        // Clear existing timeout
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        // Set new timeout
        const newTimeout = setTimeout(() => {
            onSearchChange(value);
        }, 500);

        setDebounceTimeout(newTimeout);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }
        };
    }, [debounceTimeout]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    value={searchInput}
                    onChange={handleSearchChange}
                    placeholder={t('Search items...')}
                    className="pl-8"
                />
            </div>
            <Select
                options={categoryOptions}
                value={categoryOptions.find(opt => opt.value === selectedCategory)}
                onChange={(opt) => onCategoryChange(opt.value)}
            />
        </div>
    );
}

StockFilters.propTypes = {
    searchTerm: PropTypes.string.isRequired,
    onSearchChange: PropTypes.func.isRequired,
    selectedCategory: PropTypes.string,
    onCategoryChange: PropTypes.func,
    t: PropTypes.func.isRequired
};
