'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import * as d3 from 'd3'
import { useDashboardStore } from '@/lib/store'
import { getChartColor } from '@/lib/chart-theme'
import type { DataRecord } from '@/lib/types'

interface BubbleChartProps {
  title?: string
  height?: number
}

interface BubbleDataPoint {
  name: string
  x: number // Will be overwritten by D3 force simulation with pixel position
  y: number // Will be overwritten by D3 force simulation with pixel position
  z: number // Incremental Opportunity Index for bubble size
  radius: number // Calculated radius for visualization
  geography: string
  segment: string
  segmentType: string
  currentValue: number
  cagr: number
  marketShare: number
  absoluteGrowth: number
  color: string
  // Store original index values separately since D3 will overwrite x,y with pixel positions
  xIndex: number       // CAGR Index (0-100)
  yIndex: number       // Market Share Index (0-100)
  zIndex: number       // Incremental Opportunity Index (0-100)
}

export function D3BubbleChartIndependent({ title, height = 500 }: BubbleChartProps) {
  const { data, filters } = useDashboardStore()
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height })
  const [tooltipData, setTooltipData] = useState<BubbleDataPoint | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  
  // Independent filter states
  const [selectedGeography, setSelectedGeography] = useState<string>('Global')
  const [selectedSegmentType, setSelectedSegmentType] = useState<string>('By Drug Class')

  // Get geography options with hierarchy
  const geographyOptions = useMemo(() => {
    if (!data || !data.dimensions || !data.dimensions.geographies) return []
    
    const options: { value: string, label: string, level: number, isRegion?: boolean }[] = []
    const geo = data.dimensions.geographies
    
    // Add Global
    options.push({ value: 'Global', label: 'Global', level: 0 })
    
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
    
    // Build a set of all segments that are children of other segments
    const childSegments = new Set<string>()
    Object.values(segmentHierarchy).forEach(children => {
      if (Array.isArray(children)) {
        children.forEach(child => childSegments.add(child))
      }
    })
    
    // The immediate children are all segments that are NOT children of other segments
    allSegmentsOfType.forEach(segment => {
      if (!childSegments.has(segment)) {
        immediateChildren.push(segment)
      }
    })

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
      // Get all segments to include for this immediate child (including itself and all descendants)
      const segmentsToInclude = [segment, ...getAllDescendants(segment)]
      
      // Add values for all these segments (but count each segment only once across all immediate children)
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
    })

    // First pass: Calculate raw values for all segments to find maximums
    const segmentData: Array<{
      segment: string
      baseValue: number      // 2024 value
      forecastValue: number  // 2032 value
      cagr: number
      marketShare2024: number
      absoluteGrowth: number
      index: number
    }> = []
    
    // Calculate total market value for 2024 (for market share calculation)
    let totalMarketValue2024 = 0
    geographyFiltered.forEach(record => {
      const value = record.time_series[baseYearStr] || record.time_series[baseYear] || 0
      totalMarketValue2024 += value
    })
    
    immediateChildren.forEach((segment, index) => {
      // Get records for this segment and all its descendants
      const segmentsToInclude = [segment, ...getAllDescendants(segment)]
      const segmentRecords = geographyFiltered.filter(r => 
        segmentsToInclude.includes(r.segment) && r.segment_type === selectedSegmentType
      )
      
      if (segmentRecords.length === 0) return
      
      let forecastValue = 0  // Value in 2032
      let baseValue = 0      // Value in 2024
      
      segmentRecords.forEach(record => {
        const base = record.time_series[baseYearStr] || record.time_series[baseYear] || 0
        const forecast = record.time_series[forecastYearStr] || record.time_series[forecastYear] || 0
        forecastValue += forecast
        baseValue += base
      })
      
      // Calculate market share based on 2024 values (as requested)
      const marketShare2024 = totalMarketValue2024 > 0 ? (baseValue / totalMarketValue2024) * 100 : 0
      
      // Calculate CAGR from 2024 to 2032 (8 years)
      let calculatedCAGR = 0
      if (baseValue > 0 && forecastValue > 0) {
        const years = forecastYear - baseYear  // 8 years
        if (years > 0) {
          // Calculate CAGR with safeguards against extreme values
          const growthRatio = forecastValue / baseValue
          
          // Cap extreme growth ratios to prevent unrealistic CAGR values
          // A 10x growth over 8 years = ~33% CAGR, 100x = ~78% CAGR
          const cappedRatio = Math.min(growthRatio, 100) // Cap at 100x growth max
          
          calculatedCAGR = (Math.pow(cappedRatio, 1 / years) - 1) * 100
          
          // Additional cap on CAGR itself (max 100% annual growth is very high)
          calculatedCAGR = Math.min(calculatedCAGR, 100)
          
          // Debug extreme values
          if (calculatedCAGR > 50 || growthRatio > 10) {
            console.log(`High CAGR for ${segment}:`, {
              baseValue,
              forecastValue,
              growthRatio,
              years,
              calculatedCAGR,
              cappedRatio
            })
          }
        }
      }
      
      // Calculate absolute growth from 2024 to 2032
      const absoluteGrowth = forecastValue - baseValue
      
      // Store data for index calculation
      if (forecastValue > 0 && baseValue > 0 && !isNaN(marketShare2024) && !isNaN(calculatedCAGR)) {
        segmentData.push({
          segment,
          baseValue,
          forecastValue,
          cagr: Math.max(0, calculatedCAGR), // No negative CAGR
          marketShare2024,
          absoluteGrowth,
          index
        })
      }
    })
    
    // Find maximum values for index calculations
    const maxCAGR = Math.max(...segmentData.map(d => d.cagr))
    const maxMarketShare2024 = Math.max(...segmentData.map(d => d.marketShare2024))
    const maxAbsoluteGrowth = Math.max(...segmentData.map(d => d.absoluteGrowth))
    
    // Debug: Log all segment data to understand the values
    console.log('Segment Data for Index Calculation:', segmentData.map(d => ({
      segment: d.segment,
      baseValue: d.baseValue.toFixed(2),
      forecastValue: d.forecastValue.toFixed(2),
      marketShare2024: d.marketShare2024.toFixed(2) + '%',
      absoluteGrowth: d.absoluteGrowth.toFixed(2),
      cagr: d.cagr.toFixed(2) + '%',
      growthMultiple: (d.forecastValue / d.baseValue).toFixed(2) + 'x'
    })))
    
    console.log('Max Values:', {
      maxCAGR: maxCAGR.toFixed(2) + '%',
      maxMarketShare2024: maxMarketShare2024.toFixed(2) + '%',
      maxAbsoluteGrowth: maxAbsoluteGrowth.toFixed(2)
    })
    
    // Check correlation between market share and absolute growth
    const correlationCheck = segmentData.map(d => ({
      segment: d.segment,
      shareRatio: (d.marketShare2024 / maxMarketShare2024).toFixed(3),
      growthRatio: (d.absoluteGrowth / maxAbsoluteGrowth).toFixed(3),
      difference: Math.abs((d.marketShare2024 / maxMarketShare2024) - (d.absoluteGrowth / maxAbsoluteGrowth)).toFixed(4)
    }))
    
    console.log('Correlation Check (Share vs Growth ratios):', correlationCheck)
    
    // Second pass: Calculate indices and create bubble data
    const bubbles: BubbleDataPoint[] = []
    
    segmentData.forEach(data => {
      // Calculate indices (0-100 scale)
      // Cap all indices at 100 to ensure they never exceed the maximum
      const cagrIndex = maxCAGR > 0 ? Math.min(100, (data.cagr / maxCAGR) * 100) : 0
      const marketShareIndex = maxMarketShare2024 > 0 ? Math.min(100, (data.marketShare2024 / maxMarketShare2024) * 100) : 0
      const incrementalOpportunityIndex = maxAbsoluteGrowth > 0 ? Math.min(100, (data.absoluteGrowth / maxAbsoluteGrowth) * 100) : 0
      
      // Debug each segment's indices
      console.log(`Indices for ${data.segment}:`, {
        marketShare: data.marketShare2024.toFixed(2),
        marketShareIndex: marketShareIndex.toFixed(1),
        absoluteGrowth: data.absoluteGrowth.toFixed(2),
        incrementalOpportunityIndex: incrementalOpportunityIndex.toFixed(1),
        cagr: data.cagr.toFixed(2),
        cagrIndex: cagrIndex.toFixed(1)
      })
      
      bubbles.push({
        name: data.segment,
        x: cagrIndex,                        // Will be overwritten by D3
        y: marketShareIndex,                 // Will be overwritten by D3
        z: incrementalOpportunityIndex,      // Incremental Opportunity Index for bubble size
        radius: 0, // Will be calculated later
        geography: selectedGeography,
        segment: data.segment,
        segmentType: selectedSegmentType,
        currentValue: data.forecastValue,
        cagr: data.cagr,                    // Store actual CAGR for tooltip
        marketShare: data.marketShare2024,   // Store actual market share for tooltip
        absoluteGrowth: data.absoluteGrowth, // Store actual growth for tooltip
        color: getChartColor(data.index % 10),
        // Store index values separately
        xIndex: cagrIndex,                   // CAGR Index (0-100)
        yIndex: marketShareIndex,            // Market Share Index (0-100)
        zIndex: incrementalOpportunityIndex  // Incremental Opportunity Index (0-100)
      })
    })
    
    // Sort by incremental opportunity index for better visualization
    bubbles.sort((a, b) => b.z - a.z)

    const xLabel = 'CAGR Index'
    const yLabel = 'Market Share Index (2024)'

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

    // Calculate domains - Now working with 0-100 indices
    const xExtent = d3.extent(chartData.bubbles, d => d.x) as [number, number]
    const yExtent = d3.extent(chartData.bubbles, d => d.y) as [number, number]
    const zExtent = d3.extent(chartData.bubbles, d => d.z) as [number, number]

    // Calculate bubble sizes - Scale based on Incremental Opportunity Index (0-100)
    const maxBubbleRadius = Math.min(width, height) / 8
    const minBubbleRadius = 20

    const radiusScale = d3.scaleSqrt()
      .domain([0, 100]) // Index is 0-100
      .range([minBubbleRadius, maxBubbleRadius])

    // Update bubble radii
    chartData.bubbles.forEach(bubble => {
      bubble.radius = radiusScale(bubble.z)
    })

    const maxRadius = Math.max(...chartData.bubbles.map(b => b.radius))
    const padding = maxRadius * 0.8

    // X scale - CAGR Index (0-100)
    const xScale = d3.scaleLinear()
      .domain([0, 110]) // Fixed 0-110 for index (with 10% padding)
      .range([padding, width - padding])

    // Y scale - Market Share Index (0-100)
    const yScale = d3.scaleLinear()
      .domain([0, 110]) // Fixed 0-110 for index (with 10% padding)
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

    // Add X axis - CAGR Index
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => `${(d as number).toFixed(0)}`)

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

    // Add Y axis - Market Share Index
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => `${(d as number).toFixed(0)}`)

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

    // Create force simulation - use xIndex and yIndex for positioning
    const simulation = d3.forceSimulation(chartData.bubbles as any)
      .force('x', d3.forceX<BubbleDataPoint>(d => xScale(d.xIndex)).strength(1))
      .force('y', d3.forceY<BubbleDataPoint>(d => yScale(d.yIndex)).strength(1))
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
      .attr('cx', d => (d as any).x || xScale(d.xIndex))
      .attr('cy', d => (d as any).y || yScale(d.yIndex))
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
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              
              {/* Index Values Section */}
              <div className="pt-2 mt-2 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">INDEX VALUES</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">CAGR Index:</span>
                  <span className="text-sm font-bold text-purple-600">
                    {tooltipData.xIndex.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Market Share Index (2024):</span>
                  <span className="text-sm font-bold text-purple-600">
                    {tooltipData.yIndex.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Incremental Opportunity Index:</span>
                  <span className="text-sm font-bold text-purple-600">
                    {tooltipData.zIndex.toFixed(1)}
                  </span>
                </div>
              </div>
              
              {/* Actual Values Section */}
              <div className="pt-2 mt-2 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">ACTUAL VALUES</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Market Size (2032):</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      {tooltipData.currentValue.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">{unit}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Market Share (2024):</span>
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
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Chart Dimensions (Index Scale 0-100)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-xs">X</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">CAGR Index</p>
                <p className="text-xs text-gray-500">Growth rate relative to max</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold text-xs">Y</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Market Share Index (2024)</p>
                <p className="text-xs text-gray-500">Current position relative to leader</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold text-xs">S</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Incremental Opportunity Index</p>
                <p className="text-xs text-gray-500">Absolute growth potential (bubble size)</p>
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
