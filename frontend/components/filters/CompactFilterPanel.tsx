'use client'

import { useState } from 'react'
import { useDashboardStore } from '@/lib/store'
import { X, Plus } from 'lucide-react'

interface SelectedSegmentItem {
  type: string
  segment: string
  id: string
}

export function CompactFilterPanel() {
  const { data, filters, updateFilters } = useDashboardStore()
  const [selectedSegmentType, setSelectedSegmentType] = useState<string>('By Nature')
  const [selectedSegments, setSelectedSegments] = useState<SelectedSegmentItem[]>([])
  const [currentSegmentSelection, setCurrentSegmentSelection] = useState<string>('')

  if (!data) return null

  const segmentDimension = data?.dimensions?.segments[selectedSegmentType]
  const availableSegments = segmentDimension?.items || []
  const hierarchy = segmentDimension?.hierarchy || {}
  const segmentTypes = Object.keys(data.dimensions.segments)
  
  // Build hierarchical options for the select
  const getHierarchicalOptions = () => {
    const options: Array<{value: string, label: string, level: number}> = []
    const processed = new Set<string>()
    
    const addWithChildren = (segment: string, level: number) => {
      if (processed.has(segment)) return
      processed.add(segment)
      
      const prefix = level > 0 ? '　'.repeat(level) + '└ ' : ''
      options.push({ 
        value: segment, 
        label: prefix + segment,
        level 
      })
      
      if (hierarchy[segment]) {
        hierarchy[segment].forEach((child: string) => {
          addWithChildren(child, level + 1)
        })
      }
    }
    
    // Find root segments
    const allChildren = new Set(Object.values(hierarchy).flat())
    const roots: string[] = []
    
    // Parents that aren't children
    Object.keys(hierarchy).forEach(parent => {
      if (!allChildren.has(parent)) {
        roots.push(parent)
      }
    })
    
    // Standalone segments
    availableSegments.forEach((segment: string) => {
      if (!allChildren.has(segment) && !hierarchy[segment]) {
        roots.push(segment)
      }
    })
    
    roots.forEach(root => addWithChildren(root, 0))
    
    return options.length > 0 ? options : availableSegments.map((s: string) => ({ value: s, label: s, level: 0 }))
  }
  
  const hierarchicalOptions = getHierarchicalOptions()

  const handleAddSegment = () => {
    if (!currentSegmentSelection) return
    
    const id = `${selectedSegmentType}::${currentSegmentSelection}`
    const exists = selectedSegments.find(s => s.id === id)
    
    if (!exists) {
      const newSegment = { type: selectedSegmentType, segment: currentSegmentSelection, id }
      const updated = [...selectedSegments, newSegment]
      setSelectedSegments(updated)
      updateFilters({ 
        segments: updated.map(s => s.segment),
        segmentType: selectedSegmentType,
        advancedSegments: updated
      } as any)
    }
    setCurrentSegmentSelection('')
  }

  const handleRemoveSegment = (id: string) => {
    const updated = selectedSegments.filter(s => s.id !== id)
    setSelectedSegments(updated)
    updateFilters({ 
      segments: updated.map(s => s.segment),
      advancedSegments: updated
    } as any)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 space-y-2.5">
      {/* Data Type */}
      <div>
        <label className="text-xs font-medium text-gray-600">Data Type</label>
        <div className="flex gap-1 mt-1">
          <button
            onClick={() => updateFilters({ dataType: 'value' })}
            className={`flex-1 px-2 py-1 text-xs rounded ${
              filters.dataType === 'value'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Value
          </button>
          <button
            onClick={() => updateFilters({ dataType: 'volume' })}
            className={`flex-1 px-2 py-1 text-xs rounded ${
              filters.dataType === 'volume'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Volume
          </button>
        </div>
      </div>

      {/* View Mode */}
      <div>
        <label className="text-xs font-medium text-gray-600">View Mode</label>
        <select
          value={filters.viewMode}
          onChange={(e) => updateFilters({ viewMode: e.target.value as any })}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded mt-1"
        >
          <option value="segment-mode">Segment Mode</option>
          <option value="geography-mode">Geography Mode</option>
          <option value="matrix">Matrix View</option>
        </select>
        <p className="text-xs text-gray-500 mt-0.5">
          {filters.viewMode === 'segment-mode' 
            ? 'Compare segments across geographies'
            : filters.viewMode === 'geography-mode'
            ? 'Compare geographies across segments'
            : 'Multiple geographies × segments'}
        </p>
      </div>

      {/* Geography Selection */}
      <div>
        <label className="text-xs font-medium text-gray-600">Geography Selection</label>
        <select
          multiple
          value={filters.geographies}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, option => option.value)
            updateFilters({ geographies: selected })
          }}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded mt-1"
          size={3}
        >
          {data.dimensions.geographies.global?.map(globalGeo => (
            <option key={globalGeo} value={globalGeo}>{globalGeo}</option>
          ))}
          {data.dimensions.geographies.regions.map(region => (
            <optgroup key={region} label={region}>
              <option value={region}>{region}</option>
              {data.dimensions.geographies.countries[region]?.map(country => (
                <option key={country} value={country}>  {country}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-0.5">
          {filters.geographies.length} selected
          {filters.geographies.length > 0 && (
            <button
              onClick={() => updateFilters({ geographies: [] })}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              Clear
            </button>
          )}
        </p>

        {/* Selected Geographies Pills */}
        {filters.geographies.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {filters.geographies.map(geo => (
              <span
                key={geo}
                className="inline-flex items-center px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
              >
                {geo}
                <X 
                  className="h-2.5 w-2.5 ml-1 cursor-pointer hover:text-blue-900"
                  onClick={() => {
                    const updated = filters.geographies.filter(g => g !== geo)
                    updateFilters({ geographies: updated })
                  }}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Segment Selection */}
      <div>
        <label className="text-xs font-medium text-gray-600">Segment Selection (Multi-Type)</label>
        <div className="space-y-1 mt-1">
          <div className="flex gap-1">
            <select
              value={selectedSegmentType}
              onChange={(e) => {
                setSelectedSegmentType(e.target.value)
                setCurrentSegmentSelection('')
              }}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
            >
              {segmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={currentSegmentSelection}
              onChange={(e) => setCurrentSegmentSelection(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
            >
              <option value="">Select...</option>
              {hierarchicalOptions.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  style={{ fontWeight: hierarchy[option.value] ? 'bold' : 'normal' }}
                >
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddSegment}
              disabled={!currentSegmentSelection}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          
          <p className="text-xs text-gray-500">
            💡 You can select segments from different types. Select type → pick segment → add → repeat with different type for cross-type comparison.
          </p>

          {/* Selected Segments */}
          {selectedSegments.length > 0 && (
            <div className="space-y-1 mt-1">
              {selectedSegments.map(seg => (
                <div
                  key={seg.id}
                  className="flex items-center justify-between p-1 bg-green-50 rounded text-xs"
                >
                  <span>
                    <span className="text-green-600">{seg.type}:</span>
                    <span className="text-gray-800 ml-1">{seg.segment}</span>
                  </span>
                  <X 
                    className="h-2.5 w-2.5 text-green-600 cursor-pointer hover:text-green-800"
                    onClick={() => handleRemoveSegment(seg.id)}
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  setSelectedSegments([])
                  updateFilters({ segments: [], advancedSegments: [] } as any)
                }}
                className="text-xs text-green-600 hover:text-green-800"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Year Range */}
      <div>
        <label className="text-xs font-medium text-gray-600">Year Range</label>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {filters.yearRange[0]}
          </span>
          <input
            type="range"
            min={data.metadata.start_year}
            max={data.metadata.forecast_year}
            value={filters.yearRange[0]}
            onChange={(e) => updateFilters({ 
              yearRange: [parseInt(e.target.value), filters.yearRange[1]] 
            })}
            className="flex-1 h-1"
          />
          <input
            type="range"
            min={data.metadata.start_year}
            max={data.metadata.forecast_year}
            value={filters.yearRange[1]}
            onChange={(e) => updateFilters({ 
              yearRange: [filters.yearRange[0], parseInt(e.target.value)] 
            })}
            className="flex-1 h-1"
          />
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {filters.yearRange[1]}
          </span>
        </div>
        <div className="flex gap-1 mt-1">
          <button
            onClick={() => updateFilters({ 
              yearRange: [data.metadata.historical_end_year - 2, data.metadata.historical_end_year] 
            })}
            className="flex-1 text-xs px-2 py-0.5 bg-gray-100 rounded hover:bg-gray-200"
          >
            Historical
          </button>
          <button
            onClick={() => updateFilters({ 
              yearRange: [data.metadata.historical_end_year + 1, data.metadata.forecast_year] 
            })}
            className="flex-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Forecast
          </button>
          <button
            onClick={() => updateFilters({ 
              yearRange: [data.metadata.start_year, data.metadata.forecast_year] 
            })}
            className="flex-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            All Years
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-1">
          {filters.yearRange[1] - filters.yearRange[0] + 1} years
        </p>
      </div>
    </div>
  )
}
