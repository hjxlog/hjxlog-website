import { useState, useMemo, useCallback } from 'react';

interface UseFilteredDataConfig<T> {
    searchFields: (keyof T)[];
    itemsPerPage: number;
    initialFilters?: Record<string, string>;
}

interface FilterState {
    searchQuery: string;
    filters: Record<string, string>;
    currentPage: number;
}

interface UseFilteredDataResult<T> {
    // Filtered data
    filteredData: T[];
    currentPageData: T[];

    // Pagination
    totalPages: number;
    currentPage: number;
    setCurrentPage: (page: number) => void;

    // Search
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    handleSearch: (query: string) => void;

    // Filters
    filters: Record<string, string>;
    setFilter: (key: string, value: string) => void;
    clearFilters: () => void;
}

export function useFilteredData<T extends Record<string, unknown>>(
    data: T[],
    config: UseFilteredDataConfig<T>
): UseFilteredDataResult<T> {
    const { searchFields, itemsPerPage, initialFilters = {} } = config;

    const [state, setState] = useState<FilterState>({
        searchQuery: '',
        filters: initialFilters,
        currentPage: 1,
    });

    // Compute filtered data
    const filteredData = useMemo(() => {
        const searchLower = state.searchQuery.toLowerCase();

        return data.filter(item => {
            // Search filter
            const matchesSearch = !searchLower || searchFields.some(field => {
                const value = item[field];
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(searchLower);
                }
                if (Array.isArray(value)) {
                    return value.some(v =>
                        typeof v === 'string' && v.toLowerCase().includes(searchLower)
                    );
                }
                return false;
            });

            // Custom filters
            const matchesFilters = Object.entries(state.filters).every(([key, filterValue]) => {
                if (!filterValue) return true;

                const itemValue = item[key];

                // Handle boolean-like filters (e.g., "已发布" -> published: true)
                if (filterValue === '已发布' && key === 'status') {
                    return (item as Record<string, unknown>)['published'] === true;
                }
                if (filterValue === '草稿' && key === 'status') {
                    return (item as Record<string, unknown>)['published'] === false;
                }

                return itemValue === filterValue;
            });

            return matchesSearch && matchesFilters;
        });
    }, [data, state.searchQuery, state.filters, searchFields]);

    // Compute pagination
    const totalPages = useMemo(
        () => Math.ceil(filteredData.length / itemsPerPage),
        [filteredData.length, itemsPerPage]
    );

    const currentPageData = useMemo(() => {
        const startIndex = (state.currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, state.currentPage, itemsPerPage]);

    // Actions
    const setCurrentPage = useCallback((page: number) => {
        setState(prev => ({ ...prev, currentPage: page }));
    }, []);

    const setSearchQuery = useCallback((query: string) => {
        setState(prev => ({ ...prev, searchQuery: query }));
    }, []);

    const handleSearch = useCallback((query: string) => {
        setState(prev => ({ ...prev, searchQuery: query, currentPage: 1 }));
    }, []);

    const setFilter = useCallback((key: string, value: string) => {
        setState(prev => ({
            ...prev,
            filters: { ...prev.filters, [key]: value },
            currentPage: 1, // Reset to first page when filter changes
        }));
    }, []);

    const clearFilters = useCallback(() => {
        setState(prev => ({
            ...prev,
            searchQuery: '',
            filters: {},
            currentPage: 1,
        }));
    }, []);

    return {
        // Filtered data
        filteredData,
        currentPageData,

        // Pagination
        totalPages,
        currentPage: state.currentPage,
        setCurrentPage,

        // Search
        searchQuery: state.searchQuery,
        setSearchQuery,
        handleSearch,

        // Filters
        filters: state.filters,
        setFilter,
        clearFilters,
    };
}

// Helper hook for extracting unique values for filter dropdowns
export function useUniqueValues<T>(data: T[], key: keyof T): string[] {
    return useMemo(() => {
        const values = data
            .map(item => item[key])
            .filter((value): value is string => typeof value === 'string');
        return [...new Set(values)];
    }, [data, key]);
}
