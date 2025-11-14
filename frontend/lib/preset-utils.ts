/**
 * Utility functions for Filter Presets
 * Handles dynamic calculation of top regions and segments
 */

import type { ComparisonData, DataRecord, FilterState } from './types'

/**
 * Calculate top regions based on market value for a specific year
 * @param data - The comparison data
 * @param year - The year to evaluate (default 2024)
 * @param topN - Number of top regions to return (default 3)
 * @returns Array of top region names
 */
export function getTopRegionsByMarketValue(
  data: ComparisonData | null,
  year: number = 2024,
  topN: number = 3
): string[] {
  if (!data) return []

  // Get all value data records
  const records = data.data.value.geography_segment_matrix
  const regionsList = data.dimensions.geographies.regions || []

  // Calculate total market value by region for the specified year
  const regionTotals = new Map<string, number>()

  records.forEach((record: DataRecord) => {
    const geography = record.geography
    const yearKey = year.toString()
    const value = record.time_series[yearKey] || record.time_series[year] || 0

    // Skip global level
    const globalGeo = data.dimensions.geographies.global?.[0] || 'Global'
    if (geography === globalGeo) return

    // Check if geography is a region (by checking if it's in regions list)
    // Note: geography_level may be incorrectly set, so we check the actual hierarchy
    if (regionsList.includes(geography)) {
      const currentTotal = regionTotals.get(geography) || 0
      regionTotals.set(geography, currentTotal + value)
    }
  })

  // Sort regions by total value and get top N
  const sortedRegions = Array.from(regionTotals.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by value descending
    .slice(0, topN)
    .map(([region]) => region)

  return sortedRegions
}

/**
 * Get all first-level segments for a given segment type
 * @param data - The comparison data
 * @param segmentType - The segment type to get segments for
 * @returns Array of first-level segment names
 */
export function getFirstLevelSegments(
  data: ComparisonData | null,
  segmentType: string
): string[] {
  if (!data) return []

  const segmentDimension = data.dimensions.segments[segmentType]
  if (!segmentDimension) return []

  const hierarchy = segmentDimension.hierarchy || {}
  const allSegments = segmentDimension.items || []

  // Find root segments (those that are parents but not children of any other segment)
  const allChildren = new Set(Object.values(hierarchy).flat())
  const firstLevelSegments: string[] = []

  // Add all segments that have children but are not children themselves
  // BUT exclude the segment type name itself (e.g., "By Nature" is not a segment)
  Object.keys(hierarchy).forEach(parent => {
    // Skip if parent is the segment type name itself
    if (parent === segmentType) return
    
    // Only add if it's in the items array (is a valid segment)
    if (allSegments.includes(parent) && !allChildren.has(parent) && hierarchy[parent].length > 0) {
      firstLevelSegments.push(parent)
    }
  })

  // Also add standalone segments that are neither parents nor children
  allSegments.forEach(segment => {
    // Skip the segment type name if it somehow got into items
    if (segment === segmentType) return
    
    if (!allChildren.has(segment) && !hierarchy[segment]) {
      firstLevelSegments.push(segment)
    }
  })

  return firstLevelSegments.sort()
}

/**
 * Get the first available segment type from the data
 * @param data - The comparison data
 * @returns The first segment type name or null
 */
export function getFirstSegmentType(data: ComparisonData | null): string | null {
  if (!data || !data.dimensions.segments) return null
  
  const segmentTypes = Object.keys(data.dimensions.segments)
  return segmentTypes.length > 0 ? segmentTypes[0] : null
}

/**
 * Calculate top regions based on CAGR (Compound Annual Growth Rate)
 * @param data - The comparison data
 * @param topN - Number of top regions to return (default 2)
 * @returns Array of top region names sorted by CAGR
 */
export function getTopRegionsByCAGR(
  data: ComparisonData | null,
  topN: number = 2
): string[] {
  if (!data) return []

  // Get all value data records
  const records = data.data.value.geography_segment_matrix
  const regionsList = data.dimensions.geographies.regions || []

  // Calculate average CAGR for each region
  const regionCAGRs = new Map<string, number[]>()

  records.forEach((record: DataRecord) => {
    const geography = record.geography

    // Skip global level
    const globalGeo = data.dimensions.geographies.global?.[0] || 'Global'
    if (geography === globalGeo) return

    // Check if geography is a region (by checking if it's in regions list)
    // Note: geography_level may be incorrectly set, so we check the actual hierarchy
    if (regionsList.includes(geography) && record.cagr !== undefined && record.cagr !== null) {
      const cagrs = regionCAGRs.get(geography) || []
      cagrs.push(record.cagr)
      regionCAGRs.set(geography, cagrs)
    }
  })

  // Calculate average CAGR for each region
  const avgCAGRs = Array.from(regionCAGRs.entries()).map(([region, cagrs]) => ({
    region,
    avgCAGR: cagrs.reduce((a, b) => a + b, 0) / cagrs.length
  }))

  // Sort regions by average CAGR and get top N
  const sortedRegions = avgCAGRs
    .sort((a, b) => b.avgCAGR - a.avgCAGR) // Sort by CAGR descending
    .slice(0, topN)
    .map(item => item.region)

  return sortedRegions
}

/**
 * Calculate top countries based on CAGR (Compound Annual Growth Rate)
 * @param data - The comparison data
 * @param topN - Number of top countries to return (default 5)
 * @returns Array of top country names sorted by CAGR
 */
export function getTopCountriesByCAGR(
  data: ComparisonData | null,
  topN: number = 5
): string[] {
  if (!data) return []

  // Get all value data records
  const records = data.data.value.geography_segment_matrix
  const regionsList = data.dimensions.geographies.regions || []
  const allCountries: string[] = []
  
  // Collect all countries from the countries object
  Object.values(data.dimensions.geographies.countries || {}).forEach(countryList => {
    allCountries.push(...countryList)
  })

  // Calculate average CAGR for each country
  const countryCAGRs = new Map<string, number[]>()

  records.forEach((record: DataRecord) => {
    const geography = record.geography

    // Skip global level
    const globalGeo = data.dimensions.geographies.global?.[0] || 'Global'
    if (geography === globalGeo) return

    // Check if geography is a country (not a region, but in countries list)
    // Note: geography_level may be incorrectly set, so we check the actual hierarchy
    if (allCountries.includes(geography) && !regionsList.includes(geography) && record.cagr !== undefined && record.cagr !== null) {
      const cagrs = countryCAGRs.get(geography) || []
      cagrs.push(record.cagr)
      countryCAGRs.set(geography, cagrs)
    }
  })

  // Calculate average CAGR for each country
  const avgCAGRs = Array.from(countryCAGRs.entries()).map(([country, cagrs]) => ({
    country,
    avgCAGR: cagrs.reduce((a, b) => a + b, 0) / cagrs.length
  }))

  // Sort countries by average CAGR and get top N
  const sortedCountries = avgCAGRs
    .sort((a, b) => b.avgCAGR - a.avgCAGR) // Sort by CAGR descending
    .slice(0, topN)
    .map(item => item.country)

  return sortedCountries
}

/**
 * Create dynamic filter configuration for Top Market preset
 * @param data - The comparison data
 * @returns Partial FilterState with dynamic values
 */
export function createTopMarketFilters(data: ComparisonData | null): Partial<FilterState> {
  if (!data) {
    return {
      viewMode: 'geography-mode',
      yearRange: [2020, 2032],
      dataType: 'value'
    }
  }

  const topRegions = getTopRegionsByMarketValue(data, 2024, 3)
  const firstSegmentType = getFirstSegmentType(data)
  const firstLevelSegments = firstSegmentType 
    ? getFirstLevelSegments(data, firstSegmentType)
    : []

  // Fallback: if no regions found, use first 3 regions from the data
  const finalRegions = topRegions.length > 0 
    ? topRegions 
    : (data.dimensions.geographies.regions || []).slice(0, 3)

  // Fallback: if no segments found, use first 2 segments from the segment type items
  let finalSegments = firstLevelSegments.length > 0
    ? firstLevelSegments.slice(0, 2)
    : []
  
  // If still no segments, get directly from items array (excluding segment type name)
  if (finalSegments.length === 0 && firstSegmentType) {
    const segmentDimension = data.dimensions.segments[firstSegmentType]
    if (segmentDimension && segmentDimension.items) {
      finalSegments = segmentDimension.items
        .filter(item => item !== firstSegmentType)
        .slice(0, 2)
    }
  }

  return {
    viewMode: 'geography-mode', // Geography on X-axis, segments as series
    geographies: finalRegions,
    segments: finalSegments,
    segmentType: firstSegmentType || 'By Nature',
    yearRange: [2020, 2032],
    dataType: 'value'
  }
}

/**
 * Create dynamic filter configuration for Growth Leaders preset
 * Identifies top 2 regions with highest CAGR and uses first segment type with all first-level segments
 */
export function createGrowthLeadersFilters(data: ComparisonData | null): Partial<FilterState> {
  if (!data) return {
    viewMode: 'geography-mode',
    yearRange: [2020, 2032],
    dataType: 'value'
  }

  // Get top 2 regions with highest CAGR
  const topRegions = getTopRegionsByCAGR(data, 2)
  const firstSegmentType = getFirstSegmentType(data)
  const firstLevelSegments = firstSegmentType 
    ? getFirstLevelSegments(data, firstSegmentType)
    : []

  // Fallback: if no regions found, use first 2 regions from the data
  const finalRegions = topRegions.length > 0 
    ? topRegions 
    : (data.dimensions.geographies.regions || []).slice(0, 2)

  // Fallback: if no segments found, use first 2 segments from the segment type items
  let finalSegments = firstLevelSegments.length > 0
    ? firstLevelSegments.slice(0, 2)
    : []
  
  // If still no segments, get directly from items array (excluding segment type name)
  if (finalSegments.length === 0 && firstSegmentType) {
    const segmentDimension = data.dimensions.segments[firstSegmentType]
    if (segmentDimension && segmentDimension.items) {
      finalSegments = segmentDimension.items
        .filter(item => item !== firstSegmentType)
        .slice(0, 2)
    }
  }

  return {
    viewMode: 'geography-mode', // Geography on X-axis, segments as series
    geographies: finalRegions,
    segments: finalSegments,
    segmentType: firstSegmentType || 'By Nature',
    yearRange: [2020, 2032],
    dataType: 'value'
  }
}

/**
 * Create dynamic filter configuration for Emerging Markets preset
 * Identifies top 5 countries with highest CAGR and uses first segment type with all first-level segments
 */
export function createEmergingMarketsFilters(data: ComparisonData | null): Partial<FilterState> {
  if (!data) return {
    viewMode: 'geography-mode',
    yearRange: [2020, 2032],
    dataType: 'value'
  }

  // Get top 5 countries with highest CAGR
  const topCountries = getTopCountriesByCAGR(data, 5)
  const firstSegmentType = getFirstSegmentType(data)
  const firstLevelSegments = firstSegmentType 
    ? getFirstLevelSegments(data, firstSegmentType)
    : []

  // Fallback: if no countries found, collect countries from all regions
  let finalCountries = topCountries
  if (finalCountries.length === 0) {
    const allCountries: string[] = []
    Object.values(data.dimensions.geographies.countries || {}).forEach(countryList => {
      allCountries.push(...countryList)
    })
    finalCountries = allCountries.slice(0, 5)
  }

  // Fallback: if no segments found, use first 2 segments from the segment type items
  let finalSegments = firstLevelSegments.length > 0
    ? firstLevelSegments.slice(0, 2)
    : []
  
  // If still no segments, get directly from items array (excluding segment type name)
  if (finalSegments.length === 0 && firstSegmentType) {
    const segmentDimension = data.dimensions.segments[firstSegmentType]
    if (segmentDimension && segmentDimension.items) {
      finalSegments = segmentDimension.items
        .filter(item => item !== firstSegmentType)
        .slice(0, 2)
    }
  }

  return {
    viewMode: 'geography-mode', // Geography on X-axis, segments as series
    geographies: finalCountries,
    segments: finalSegments,
    segmentType: firstSegmentType || 'By Nature',
    yearRange: [2020, 2032],
    dataType: 'value'
  }
}

