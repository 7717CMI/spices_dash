import { create } from 'zustand'
import type { FilterState, ComparisonData } from './types'
import type { ChartGroupId } from './chart-groups'
import { DEFAULT_CHART_GROUP } from './chart-groups'

interface DashboardStore {
  data: ComparisonData | null
  filteredData: any[] // Will hold filtered records
  filters: FilterState
  isLoading: boolean
  error: string | null
  selectedChartGroup: ChartGroupId
  
  // Actions
  setData: (data: ComparisonData) => void
  updateFilters: (filters: Partial<FilterState>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetFilters: () => void
  setSelectedChartGroup: (groupId: ChartGroupId) => void
}

const defaultFilters: FilterState = {
  geographies: [],
  segments: [],
  segmentType: 'By Drug Class',
  yearRange: [2024, 2028],
  dataType: 'value',
  viewMode: 'segment-mode',
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  data: null,
  filteredData: [],
  filters: defaultFilters,
  isLoading: false,
  error: null,
  selectedChartGroup: DEFAULT_CHART_GROUP,
  
  setData: (data) => set({ data, error: null }),
  
  updateFilters: (newFilters) => 
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  resetFilters: () => set({ filters: defaultFilters }),
  
  setSelectedChartGroup: (groupId) => set({ selectedChartGroup: groupId }),
}))

