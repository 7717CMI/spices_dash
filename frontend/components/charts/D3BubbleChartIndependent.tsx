'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import * as d3 from 'd3'
import { useDashboardStore } from '@/lib/store'
import { getChartColor } from '@/lib/chart-theme'
import type { DataRecord } from '@/lib/types'
import { DemoDataWatermark } from '@/components/ui/DemoDataWatermark'

interface BubbleChartProps {
  title?: string
  height?: number
}

interface BubbleDataPoint {
  name: string
  x: number // CAGR (growth rate)
  y: number // Market Share %
  z: number // Market Size (bubble size)
  radius: number // Calculated radius for visualization
  geography: string
  segment: string
  segmentType: string
  currentValue: number
  cagr: number
  marketShare: number
  absoluteGrowth: number
  color: string
}

export function D3BubbleChartIndependent({ title, height = 500 }: BubbleChartProps) {
  const { data, filters } = useDashboardStore()
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height })
  const [tooltipData, setTooltipData] = useState<BubbleDataPoint | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  
  // Independent filter states
  const [selectedGeography, setSelectedGeography] = useState<string>('India')
  const [selectedSegmentType, setSelectedSegmentType] = useState<string>('By Nature')

  // Get geography options with hierarchy
  const geographyOptions = useMemo(() => {
    if (!data || !data.dimensions || !data.dimensions.geographies) return []
    
    const options: { value: string, label: string, level: number, isRegion?: boolean }[] = []
    const geo = data.dimensions.geographies
    
    // Add Global geography (could be 'Global', 'India', etc.)
    const globalGeo = geo.global?.[0] || 'Global'
    options.push({ value: globalGeo, label: globalGeo, level: 0 })
    
    // Add regions and their countries
    if (geo.regions && geo.countries) {
      geo.regions.forEach((region: string) => {
        // Use proper indentation characters for better visibility
        options.push({ value: region, label: `├─ ${region}`, level: 1, isRegion: true })
        const regionCountries = geo.countries[region]
        if (Array.isArray(regionCountries)) {
          regionCountries.forEach((country: string, idx: number) => {
            const isLast = idx === regionCountries.length - 1
            const prefix = isLast ? '    └─ ' : '    ├─ '
            options.push({ value: country, label: `${prefix}${country}`, level: 2 })
          })
        }
      })
    }
    
    return options
  }, [data])

  // Get segment type options
  const segmentTypeOptions = useMemo(() => {
    if (!data || !data.dimensions || !data.dimensions.segments) return []
    return Object.keys(data.dimensions.segments)
  }, [data])

  // Calculate chart data based on selected filters
  const chartData = useMemo(() => {
    if (!data || !selectedGeography || !selectedSegmentType) {
      return { bubbles: [], xLabel: '', yLabel: '' }
    }

    const dataset = filters.dataType === 'value'
      ? data.data.value.geography_segment_matrix
      : data.data.volume.geography_segment_matrix

    // Filter data for selected geography
    const geographyFiltered = dataset.filter(record => 
      record.geography === selectedGeography
    )

    if (geographyFiltered.length === 0) {
      return { bubbles: [], xLabel: '', yLabel: '' }
    }

    // Get immediate children of selected segment type
    const segmentHierarchy = data.dimensions.segments[selectedSegmentType]?.hierarchy || {}
    const immediateChildren: string[] = []
    
    // First, get all unique segments of this type from the data
    const allSegmentsOfType = new Set<string>()
    geographyFiltered
      .filter(r => r.segment_type === selectedSegmentType)
      .forEach(r => allSegmentsOfType.add(r.segment))
    
    // Get direct children of the segment type name (e.g., children of "By Nature" or "By Product Type")
    const directChildren = segmentHierarchy[selectedSegmentType] || []
    
    // If the segment type has direct children, use those
    if (Array.isArray(directChildren) && directChildren.length > 0) {
      // Check if these children exist as actual segment names in the data
      // OR if they are parent segments that have children in the data
      directChildren.forEach(child => {
        // Case 1: The child exists as a segment name in the data (e.g., "Organic", "Conventional")
        if (allSegmentsOfType.has(child)) {
          immediateChildren.push(child)
        } else {
          // Case 2: The child is a parent segment (e.g., "Whole Spices", "Ground Spices")
          // Check if any data records have this segment in their hierarchy
          const hasRecordsWithThisParent = geographyFiltered.some(record => {
            if (record.segment_type !== selectedSegmentType) return false
            const hierarchy = record.segment_hierarchy || {}
            // Check if this parent appears in any level of the hierarchy
            return hierarchy.level_2 === child || 
                   hierarchy.level_3 === child || 
                   hierarchy.level_4 === child
          })
          
          if (hasRecordsWithThisParent) {
            immediateChildren.push(child)
          }
        }
      })
    } else {
      // Fallback: Get segments that are NOT children of other segments
      // Build a set of all segments that are children of other segments
      const childSegments = new Set<string>()
      Object.values(segmentHierarchy).forEach(children => {
        if (Array.isArray(children)) {
          children.forEach(child => childSegments.add(child))
        }
      })
      
      // The immediate children are all segments that are NOT children of other segments
      allSegmentsOfType.forEach(segment => {
        // Skip the segment type name itself
        if (segment !== selectedSegmentType && !childSegments.has(segment)) {
          immediateChildren.push(segment)
        }
      })
    }

    // Calculate metrics for each segment
    // Always use 2032 as the forecast year for final values
    const forecastYear = 2032
    const forecastYearStr = forecastYear.toString()
    // Use 2024 as base year for CAGR calculation
    const baseYear = 2024
    const baseYearStr = baseYear.toString()
    
    // Helper function to get all descendants of a segment
    const getAllDescendants = (parentSegment: string): string[] => {
      const descendants: string[] = []
      const children = segmentHierarchy[parentSegment]
      
      if (Array.isArray(children)) {
        children.forEach(child => {
          descendants.push(child)
          // Recursively get descendants of this child
          descendants.push(...getAllDescendants(child))
        })
      }
      
      return descendants
    }

    // Calculate total market value by summing values for immediate children and their descendants
    // We need to count each segment record only once
    let totalMarketValue = 0
    const countedSegments = new Set<string>()
    
    immediateChildren.forEach(segment => {
      // Check if this segment exists as a direct segment name in the data
      const isDirectSegment = allSegmentsOfType.has(segment)
      
      if (isDirectSegment) {
        // Case 1: Direct segment (e.g., "Organic", "Conventional")
        // Get all descendants and include them
        const segmentsToInclude = [segment, ...getAllDescendants(segment)]
        segmentsToInclude.forEach(seg => {
          if (!countedSegments.has(seg)) {
            countedSegments.add(seg)
            const records = geographyFiltered.filter(r => 
              r.segment === seg && r.segment_type === selectedSegmentType
            )
            records.forEach(record => {
              const value = record.time_series[forecastYearStr] || record.time_series[forecastYear] || 0
              totalMarketValue += value
            })
          }
        })
      } else {
        // Case 2: Parent segment (e.g., "Whole Spices", "Ground Spices")
        // Find all records where this segment appears in the hierarchy
        const records = geographyFiltered.filter(r => {
          if (r.segment_type !== selectedSegmentType) return false
          const hierarchy = r.segment_hierarchy || {}
          return hierarchy.level_2 === segment || 
                 hierarchy.level_3 === segment || 
                 hierarchy.level_4 === segment
        })
        
        // Count each unique segment only once
        records.forEach(record => {
          if (!countedSegments.has(record.segment)) {
            countedSegments.add(record.segment)
            const value = record.time_series[forecastYearStr] || record.time_series[forecastYear] || 0
            totalMarketValue += value
          }
        })
      }
    })

    const bubbles: BubbleDataPoint[] = []
    
    immediateChildren.forEach((segment, index) => {
      // Check if this segment exists as a direct segment name in the data
      const isDirectSegment = allSegmentsOfType.has(segment)
      
      let segmentRecords: typeof geographyFiltered = []
      
      if (isDirectSegment) {
        // Case 1: Direct segment (e.g., "Organic", "Conventional")
        // Get records for this segment and all its descendants
        const segmentsToInclude = [segment, ...getAllDescendants(segment)]
        segmentRecords = geographyFiltered.filter(r => 
          segmentsToInclude.includes(r.segment) && r.segment_type === selectedSegmentType
        )
      } else {
        // Case 2: Parent segment (e.g., "Whole Spices", "Ground Spices")
        // Find all records where this segment appears in the hierarchy
        segmentRecords = geographyFiltered.filter(r => {
          if (r.segment_type !== selectedSegmentType) return false
          const hierarchy = r.segment_hierarchy || {}
          return hierarchy.level_2 === segment || 
                 hierarchy.level_3 === segment || 
                 hierarchy.level_4 === segment
        })
      }
      
      if (segmentRecords.length === 0) return
      
      let forecastValue = 0  // Value in 2032
      let baseValue = 0      // Value in 2024 for CAGR calculation
      
      segmentRecords.forEach(record => {
        const base = record.time_series[baseYearStr] || record.time_series[baseYear] || 0
        const forecast = record.time_series[forecastYearStr] || record.time_series[forecastYear] || 0
        forecastValue += forecast
        baseValue += base
      })
      
      // Calculate market share based on 2032 values
      const marketShare = totalMarketValue > 0 ? (forecastValue / totalMarketValue) * 100 : 0
      
      // Calculate CAGR from 2024 to 2032 (8 years)
      let calculatedCAGR = 0
      if (baseValue > 0 && forecastValue > 0) {
        const years = forecastYear - baseYear  // 8 years
        if (years > 0) {
          calculatedCAGR = (Math.pow(forecastValue / baseValue, 1 / years) - 1) * 100
        }
      }
      
      // Calculate absolute growth from 2024 to 2032
      const absoluteGrowth = forecastValue - baseValue
      
      // Only include points with valid data
      if (forecastValue > 0 && !isNaN(marketShare) && !isNaN(calculatedCAGR)) {
        bubbles.push({
          name: segment,
          x: Math.max(0, calculatedCAGR), // CAGR on X-axis (no negative)
          y: marketShare, // Market Share on Y-axis
          z: forecastValue, // Market Size in 2032 for bubble size
          radius: 0, // Will be calculated later
          geography: selectedGeography,
          segment: segment,
          segmentType: selectedSegmentType,
          currentValue: forecastValue,  // Value in 2032
          cagr: calculatedCAGR,
          marketShare: marketShare,
          absoluteGrowth: absoluteGrowth,
          color: getChartColor(index % 10)
        })
      }
    })
    
    // Sort by market size for better visualization
    bubbles.sort((a, b) => b.z - a.z)

    const xLabel = 'CAGR (%)'
    const yLabel = 'Market Share (%)'

    return { bubbles, xLabel, yLabel }
  }, [data, filters, selectedGeography, selectedSegmentType])

  // Update dimensions on container resize
  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect()
        setDimensions({ width: Math.max(width, 400), height })
      }
    }

    updateDimensions()
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [height])

  // D3 chart rendering
  useEffect(() => {
    if (!svgRef.current || chartData.bubbles.length === 0) return

    const margin = { top: 20, right: 20, bottom: 60, left: 60 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Calculate domains
    const xExtent = d3.extent(chartData.bubbles, d => d.x) as [number, number]
    const yExtent = d3.extent(chartData.bubbles, d => d.y) as [number, number]
    const zExtent = d3.extent(chartData.bubbles, d => d.z) as [number, number]

    // Calculate bubble sizes
    const maxBubbleRadius = Math.min(width, height) / 10
    const minBubbleRadius = 15

    const radiusScale = d3.scaleSqrt()
      .domain([0, zExtent[1]])
      .range([minBubbleRadius, maxBubbleRadius])

    // Update bubble radii
    chartData.bubbles.forEach(bubble => {
      bubble.radius = radiusScale(bubble.z)
    })

    const maxRadius = Math.max(...chartData.bubbles.map(b => b.radius))
    const padding = maxRadius * 0.8

    // X scale - CAGR (starts from 0)
    const xScale = d3.scaleLinear()
      .domain([0, Math.max(xExtent[1] * 1.1, 20)]) // Minimum 20% on x-axis
      .range([padding, width - padding])

    // Y scale - Market Share (starts from 0)
    const yScale = d3.scaleLinear()
      .domain([0, Math.max(yExtent[1] * 1.1, 100)]) // Up to 100% or higher
      .range([height - padding, padding])

    // Add grid lines
    const xGrid = d3.axisBottom(xScale)
      .tickSize(-height + padding * 2)
      .tickFormat(() => '')

    const yGrid = d3.axisLeft(yScale)
      .tickSize(-width + padding * 2)
      .tickFormat(() => '')

    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height - padding})`)
      .call(xGrid)
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3)

    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${padding},0)`)
      .call(yGrid)
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3)

    // Add X axis - CAGR
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => `${(d as number).toFixed(0)}%`)

    g.append('g')
      .attr('transform', `translate(0,${height - padding})`)
      .call(xAxis)
      .style('font-size', '10px')
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', '#475569')
      .style('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '500')
      .text(chartData.xLabel)

    // Add Y axis - Market Share
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => `${(d as number).toFixed(0)}%`)

    g.append('g')
      .attr('transform', `translate(${padding},0)`)
      .call(yAxis)
      .style('font-size', '10px')
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -height / 2)
      .attr('fill', '#475569')
      .style('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '500')
      .text(chartData.yLabel)

    // Create force simulation
    const simulation = d3.forceSimulation(chartData.bubbles as any)
      .force('x', d3.forceX<BubbleDataPoint>(d => xScale(d.x)).strength(1))
      .force('y', d3.forceY<BubbleDataPoint>(d => yScale(d.y)).strength(1))
      .force('collide', d3.forceCollide<BubbleDataPoint>(d => d.radius + 3))
      .stop()

    // Run simulation
    for (let i = 0; i < 120; ++i) {
      simulation.tick()
      
      chartData.bubbles.forEach((d: any) => {
        d.x = Math.max(xScale.range()[0] + d.radius, 
              Math.min(xScale.range()[1] - d.radius, d.x))
        d.y = Math.max(yScale.range()[1] + d.radius,
              Math.min(yScale.range()[0] - d.radius, d.y))
      })
    }

    // Add bubbles
    const bubbles = g.append('g')
      .selectAll('circle')
      .data(chartData.bubbles)
      .enter()
      .append('circle')
      .attr('cx', d => (d as any).x || xScale(d.x))
      .attr('cy', d => (d as any).y || yScale(d.y))
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('fill-opacity', 0.7)
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('fill-opacity', 0.9)
          .attr('stroke-width', 3)

        setTooltipData(d)
        const [mouseX, mouseY] = d3.pointer(event, svg.node())
        setTooltipPosition({ x: mouseX, y: mouseY })
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .attr('fill-opacity', 0.7)
          .attr('stroke-width', 2)

        setTooltipData(null)
      })

    // Add labels for larger bubbles
    const labels = g.append('g')
      .selectAll('text')
      .data(chartData.bubbles.filter(d => d.radius > 25))
      .enter()
      .append('text')
      .attr('x', d => (d as any).x || xScale(d.x))
      .attr('y', d => (d as any).y || yScale(d.y))
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .style('pointer-events', 'none')
      .text(d => d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name)

    // Add legend note
    svg.append('text')
      .attr('x', dimensions.width / 2)
      .attr('y', dimensions.height - 5)
      .style('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#64748b')
      .style('font-style', 'italic')
      .text(`Bubble size represents 2032 market size in ${selectedGeography} | All values projected to 2032`)

  }, [chartData, dimensions, selectedGeography])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500">Loading data...</p>
        </div>
      </div>
    )
  }

  const unit = filters.dataType === 'value'
    ? `${data.metadata.currency} ${data.metadata.value_unit}`
    : data.metadata.volume_unit

  return (
    <div className="w-full min-w-0 overflow-hidden" ref={containerRef}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      )}
      
      {/* Independent Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Geography
          </label>
          <select
            value={selectedGeography}
            onChange={(e) => setSelectedGeography(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-gray-900"
            style={{ color: '#111827' }}
          >
            {geographyOptions.map(option => (
              <option 
                key={option.value} 
                value={option.value}
                style={{ 
                  fontWeight: option.level === 0 || option.isRegion ? 'bold' : 'normal',
                  color: option.level === 0 ? '#1f2937' : option.level === 1 ? '#374151' : '#6b7280'
                }}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Segment Type
          </label>
          <select
            value={selectedSegmentType}
            onChange={(e) => setSelectedSegmentType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            style={{ color: '#111827' }}
          >
            {segmentTypeOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative">
        <DemoDataWatermark />
        <svg ref={svgRef} className="w-full" />
        
        {/* Custom Tooltip */}
        {tooltipData && (
          <div
            className="absolute bg-white p-4 border border-gray-200 rounded-lg shadow-lg min-w-[280px] z-50 pointer-events-none"
            style={{
              left: `${tooltipPosition.x + 10}px`,
              top: `${tooltipPosition.y - 10}px`,
              transform: tooltipPosition.x > dimensions.width / 2 ? 'translateX(-100%)' : 'none'
            }}
          >
            <p className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              {tooltipData.name}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Geography:</span>
                <span className="text-sm font-medium text-gray-900">
                  {tooltipData.geography}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Segment Type:</span>
                <span className="text-sm font-medium text-gray-900">
                  {tooltipData.segmentType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Market Size (2032):</span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    {tooltipData.z.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">{unit}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Market Share (2032):</span>
                <span className="text-sm font-semibold text-blue-600">
                  {tooltipData.marketShare.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">CAGR (2024-2032):</span>
                <span className={`text-sm font-semibold ${
                  tooltipData.cagr > 0 ? 'text-green-600' : tooltipData.cagr < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {tooltipData.cagr > 0 ? '+' : ''}{tooltipData.cagr.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Growth (2024-2032):</span>
                <span className={`text-sm font-semibold ${
                  tooltipData.absoluteGrowth > 0 ? 'text-green-600' : tooltipData.absoluteGrowth < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {tooltipData.absoluteGrowth > 0 ? '+' : ''}
                  {tooltipData.absoluteGrowth.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })} {unit}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Chart Dimensions</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-xs">X</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">CAGR (%)</p>
                <p className="text-xs text-gray-500">Growth Rate</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold text-xs">Y</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Market Share (%)</p>
                <p className="text-xs text-gray-500">Percentage of total market</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold text-xs">S</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Market Size</p>
                <p className="text-xs text-gray-500">Bubble size</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Showing {chartData.bubbles.length} {selectedSegmentType} segments in {selectedGeography}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Hover over bubbles for detailed metrics
          </p>
        </div>
      </div>
    </div>
  )
}
