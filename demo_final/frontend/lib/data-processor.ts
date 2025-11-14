import type { DataRecord, FilterState, ChartDataPoint, HeatmapCell, ComparisonTableRow } from './types'

/**
 * Filter data records based on current filter state
 */
export function filterData(
  data: DataRecord[],
  filters: FilterState & { advancedSegments?: any[] }
): DataRecord[] {
  const filtered = data.filter((record) => {
    // Geography filter
    const geoMatch = filters.geographies.length === 0 ||
      filters.geographies.includes(record.geography)
    
    // For multi-type segment selection, check if we have advancedSegments
    if (filters.advancedSegments && filters.advancedSegments.length > 0) {
      // Check if this record matches any of the selected segment+type combinations
      const segmentMatch = filters.advancedSegments.some(seg => {
        // Direct match - exact segment name and type
        if (seg.type === record.segment_type && seg.segment === record.segment) {
          return true
        }
        
        return false
      })
      
      // If no direct match, check if this is a child whose parent was NOT selected
      // (We want to exclude children if their parent is selected)
      if (!segmentMatch && record.segment_level === 'leaf') {
        // Check if any selected segment is a parent of this record
        const parentIsSelected = filters.advancedSegments.some(seg => {
        if (seg.type === record.segment_type) {
          const hierarchy = record.segment_hierarchy
            // Check if the selected segment is a parent in this record's hierarchy
          return (
            hierarchy.level_2 === seg.segment ||
              hierarchy.level_3 === seg.segment
          )
        }
          return false
        })
        
        // If parent is selected, EXCLUDE this child (return false)
        if (parentIsSelected) {
        return false
        }
      }
      
      return geoMatch && segmentMatch
    }
    
    // Fallback to old logic for single-type selection
    // Segment type filter
    const segTypeMatch = record.segment_type === filters.segmentType
    
    // Segment filter - only direct matches (no hierarchy expansion)
    const segMatch = filters.segments.length === 0 ||
      filters.segments.includes(record.segment)
    
    return geoMatch && segTypeMatch && segMatch
  })
  
  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('🔍 Filter Debug:', {
      totalRecords: data.length,
      filteredRecords: filtered.length,
      filters: filters,
      sampleRecord: data[0],
      sampleFiltered: filtered[0]
    })
  }
  
  return filtered
}

/**
 * Prepare data for grouped bar chart (Recharts format) with stacking support
 */
export function prepareGroupedBarData(
  records: DataRecord[],
  filters: FilterState & { advancedSegments?: any[] }
): ChartDataPoint[] {
  const { yearRange, viewMode, geographies, segments } = filters
  const [startYear, endYear] = yearRange
  
  // Generate year range
  const years: number[] = []
  for (let year = startYear; year <= endYear; year++) {
    years.push(year)
  }
  
  // Determine if we need stacked bars
  const needsStacking = (viewMode === 'segment-mode' && geographies.length > 1) ||
                        (viewMode === 'geography-mode' && segments.length > 1)
  
  // Transform into Recharts format
  return years.map(year => {
    const dataPoint: ChartDataPoint = { year }
    const yearStr = year.toString()
    
    if (needsStacking) {
      // Stacked bar chart logic
      if (viewMode === 'segment-mode') {
        // Stack geographies within each segment bar
        // Primary grouping: segments (each becomes a bar)
        // Secondary grouping: geographies (stacked within each bar)
        
        const segmentMap = new Map<string, Map<string, number>>()
    
    records.forEach(record => {
          const segment = record.segment
          const geography = record.geography
          
          if (!segmentMap.has(segment)) {
            segmentMap.set(segment, new Map())
          }
          
          const geoMap = segmentMap.get(segment)!
          const currentValue = geoMap.get(geography) || 0
          const recordValue = record.time_series[yearStr] || record.time_series[year] || 0
          geoMap.set(geography, currentValue + recordValue)
        })
        
        // Create stacked data keys: segment_geography
        segmentMap.forEach((geoMap, segment) => {
          geoMap.forEach((value, geography) => {
            const key = `${segment}::${geography}`
            dataPoint[key] = value
          })
        })
        
      } else if (viewMode === 'geography-mode') {
        // Stack segments within each geography bar
        // Primary grouping: geographies (each becomes a bar)
        // Secondary grouping: segments (stacked within each bar)
        
        const geoMap = new Map<string, Map<string, number>>()
        
        records.forEach(record => {
          const geography = record.geography
          const segment = record.segment
          
          if (!geoMap.has(geography)) {
            geoMap.set(geography, new Map())
          }
          
          const segmentMap = geoMap.get(geography)!
          const currentValue = segmentMap.get(segment) || 0
          const recordValue = record.time_series[yearStr] || record.time_series[year] || 0
          segmentMap.set(segment, currentValue + recordValue)
          })
          
        // Create stacked data keys: geography_segment
        geoMap.forEach((segmentMap, geography) => {
          segmentMap.forEach((value, segment) => {
            const key = `${geography}::${segment}`
            dataPoint[key] = value
          })
        })
          }
        } else {
      // Original non-stacked logic
      const aggregatedData: Record<string, number> = {}
      
      records.forEach(record => {
        let key: string
        
        if (viewMode === 'segment-mode') {
          key = record.segment
        } else if (viewMode === 'geography-mode') {
        key = record.geography
        } else if (viewMode === 'matrix') {
        key = `${record.geography}::${record.segment}`
      } else {
        key = record.geography
      }
      
      if (!aggregatedData[key]) {
        aggregatedData[key] = 0
      }
        aggregatedData[key] += record.time_series[yearStr] || record.time_series[year] || 0
    })
    
    Object.entries(aggregatedData).forEach(([key, value]) => {
      dataPoint[key] = value
    })
    }
    
    return dataPoint
  })
}

/**
 * Prepare data for line chart (multi-series)
 */
export function prepareLineChartData(
  records: DataRecord[],
  filters: FilterState
): ChartDataPoint[] {
  const { yearRange, viewMode } = filters
  const [startYear, endYear] = yearRange
  
  // Generate year range
  const years: number[] = []
  for (let year = startYear; year <= endYear; year++) {
    years.push(year)
  }
  
  // Transform into Recharts format for line charts
  // Line charts always aggregate data by the primary dimension
  return years.map(year => {
    const dataPoint: ChartDataPoint = { year }
    const yearStr = year.toString()
    
    // Group data by the dimension we want to show as lines
    const aggregated = new Map<string, number>()
    
    records.forEach(record => {
      let key: string
      
      if (viewMode === 'segment-mode') {
        // Lines represent segments (aggregate across geographies)
        key = record.segment
      } else if (viewMode === 'geography-mode') {
        // Lines represent geographies (aggregate across segments)
        key = record.geography
      } else if (viewMode === 'matrix') {
        // Lines represent geography-segment combinations
        key = `${record.geography}::${record.segment}`
      } else {
        // Default to geography
        key = record.geography
      }
      
      const currentValue = aggregated.get(key) || 0
      const recordValue = record.time_series[yearStr] || record.time_series[year] || 0
      aggregated.set(key, currentValue + recordValue)
    })
    
    // Add aggregated values to dataPoint
    aggregated.forEach((value, key) => {
      dataPoint[key] = value
    })
    
    return dataPoint
  })
}

/**
 * Prepare data for heatmap
 */
export function prepareHeatmapData(
  records: DataRecord[],
  year: number
): HeatmapCell[] {
  const cells: HeatmapCell[] = []
  
  records.forEach(record => {
    // JSON keys are strings
    const yearStr = year.toString()
    const value = record.time_series[yearStr] || record.time_series[year] || 0
    
    cells.push({
      geography: record.geography,
      segment: record.segment,
      value,
      displayValue: value.toFixed(2)
    })
  })
  
  return cells
}

/**
 * Prepare data for comparison table
 */
export function prepareTableData(
  records: DataRecord[],
  filters: FilterState
): ComparisonTableRow[] {
  const { yearRange } = filters
  const [startYear, endYear] = yearRange
  
  return records.map(record => {
    // JSON keys are strings
    const startYearStr = filters.yearRange[0].toString()
    const endYearStr = filters.yearRange[1].toString()
    const baseValue = record.time_series[startYearStr] || record.time_series[filters.yearRange[0]] || 0
    const forecastValue = record.time_series[endYearStr] || record.time_series[filters.yearRange[1]] || 0
    const growth = baseValue > 0 
      ? ((forecastValue - baseValue) / baseValue) * 100
      : 0
    
    // Extract time series for sparkline
    const timeSeries: number[] = []
    for (let year = startYear; year <= endYear; year++) {
      const yearStr = year.toString()
      timeSeries.push(record.time_series[yearStr] || record.time_series[year] || 0)
    }
    
    return {
      geography: record.geography,
      segment: record.segment,
      baseYear: baseValue,
      forecastYear: forecastValue,
      cagr: record.cagr,
      growth,
      timeSeries
    }
  })
}

/**
 * Get unique geographies from filtered data
 */
export function getUniqueGeographies(records: DataRecord[]): string[] {
  const geos = new Set<string>()
  records.forEach(record => geos.add(record.geography))
  return Array.from(geos)
}

/**
 * Get unique segments from filtered data
 * Returns only parent segments if they exist, otherwise returns leaf segments
 */
export function getUniqueSegments(records: DataRecord[]): string[] {
  const segments = new Set<string>()
  const parentSegments = new Set<string>()
  const childSegments = new Map<string, string[]>() // parent -> children mapping
  
  // First pass: identify all parent and leaf segments
  records.forEach(record => {
    if (record.segment_level === 'parent') {
      parentSegments.add(record.segment)
    } else {
      // Check if this leaf has a parent in the hierarchy
      const parentInHierarchy = record.segment_hierarchy.level_2
      if (parentInHierarchy && parentInHierarchy !== record.segment) {
        if (!childSegments.has(parentInHierarchy)) {
          childSegments.set(parentInHierarchy, [])
        }
        childSegments.get(parentInHierarchy)!.push(record.segment)
      }
    }
  })
  
  // Second pass: add segments to the result
  records.forEach(record => {
    // If this is a parent segment, always include it
    if (record.segment_level === 'parent') {
      segments.add(record.segment)
    } else {
      // For leaf segments, only add if their parent is NOT in the parent segments set
      const parentInHierarchy = record.segment_hierarchy.level_2
      if (!parentSegments.has(parentInHierarchy)) {
        segments.add(record.segment)
      }
    }
  })
  
  return Array.from(segments)
}

/**
 * Prepare data for waterfall chart
 * Shows contribution breakdown from start to end value
 */
export function prepareWaterfallData(
  records: DataRecord[],
  filters: FilterState
): Array<{ name: string; value: number; type: 'start' | 'positive' | 'negative' | 'end' }> {
  const [startYear, endYear] = filters.yearRange
  
  // Group records by the dimension we're analyzing
  const groupKey = filters.viewMode === 'segment-mode' ? 'segment' : 'geography'
  
  // Calculate starting total
  let startTotal = 0
  const startYearStr = startYear.toString()
  const endYearStr = endYear.toString()
  records.forEach(record => {
    startTotal += record.time_series[startYearStr] || record.time_series[startYear] || 0
  })
  
  // Group and calculate contributions
  const grouped = new Map<string, number>()
  records.forEach(record => {
    const key = record[groupKey]
    const startValue = record.time_series[startYearStr] || record.time_series[startYear] || 0
    const endValue = record.time_series[endYearStr] || record.time_series[endYear] || 0
    const change = endValue - startValue
    
    grouped.set(key, (grouped.get(key) || 0) + change)
  })
  
  // Build waterfall data
  const waterfallData: Array<{ name: string; value: number; type: 'start' | 'positive' | 'negative' | 'end' }> = []
  
  // Starting value
  waterfallData.push({
    name: `Start (${startYear})`,
    value: startTotal,
    type: 'start'
  })
  
  // Sort contributions by absolute value (largest first)
  const sortedContributions = Array.from(grouped.entries())
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
  
  // Add positive contributions
  sortedContributions.forEach(([name, change]) => {
    if (change > 0) {
      waterfallData.push({
        name,
        value: change,
        type: 'positive'
      })
    }
  })
  
  // Add negative contributions
  sortedContributions.forEach(([name, change]) => {
    if (change < 0) {
      waterfallData.push({
        name,
        value: Math.abs(change),
        type: 'negative'
      })
    }
  })
  
  // Calculate ending total
  let endTotal = 0
  records.forEach(record => {
    endTotal += record.time_series[endYearStr] || record.time_series[endYear] || 0
  })
  
  // Ending value
  waterfallData.push({
    name: `End (${endYear})`,
    value: endTotal,
    type: 'end'
  })
  
  return waterfallData
}

/**
 * Calculate aggregated totals
 */
export function calculateTotals(
  records: DataRecord[],
  year: number
): { total: number; count: number; average: number } {
  let total = 0
  let count = 0
  const yearStr = year.toString()
  
  records.forEach(record => {
    const value = record.time_series[yearStr] || record.time_series[year] || 0
    total += value
    count++
  })
  
  return {
    total,
    count,
    average: count > 0 ? total / count : 0
  }
}

/**
 * Find top performers
 */
export function findTopPerformers(
  records: DataRecord[],
  year: number,
  limit: number = 5
): Array<{ name: string; value: number }> {
  const yearStr = year.toString()
  const performers = records.map(record => ({
    name: `${record.geography} - ${record.segment}`,
    value: record.time_series[yearStr] || record.time_series[year] || 0
  }))
  
  return performers
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

/**
 * Find fastest growing
 */
export function findFastestGrowing(
  records: DataRecord[],
  limit: number = 5
): Array<{ name: string; cagr: number }> {
  const growing = records.map(record => ({
    name: `${record.geography} - ${record.segment}`,
    cagr: record.cagr
  }))
  
  return growing
    .sort((a, b) => b.cagr - a.cagr)
    .slice(0, limit)
}

