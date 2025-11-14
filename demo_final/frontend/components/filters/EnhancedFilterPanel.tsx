'use client'

import { useState, useEffect } from 'react'
import { useDashboardStore } from '@/lib/store'
import { GeographyMultiSelect } from './GeographyMultiSelect'
import { YearRangeSlider } from './YearRangeSlider'
import { X, Plus, MapPin, Tag } from 'lucide-react'

interface SelectedSegmentItem {
  type: string
  segment: string
  id: string
}

export function EnhancedFilterPanel() {
  const { data, filters, updateFilters } = useDashboardStore()
  const [selectedSegmentType, setSelectedSegmentType] = useState<string>('By Drug Class')
  const [selectedSegments, setSelectedSegments] = useState<SelectedSegmentItem[]>([])
  const [currentSegmentSelection, setCurrentSegmentSelection] = useState<string>('')

  // Get segments for current type
  const segmentDimension = data?.dimensions?.segments[selectedSegmentType]
  const availableSegments = segmentDimension?.items || []
  const hierarchy = segmentDimension?.hierarchy || {}
  
  // Build hierarchical options for the select
  const getHierarchicalOptions = () => {
    const options: Array<{value: string, label: string, level: number, isParent: boolean}> = []
    const processed = new Set<string>()
    
    const addWithChildren = (segment: string, level: number) => {
      if (processed.has(segment)) return
      processed.add(segment)
      
      const isParent = hierarchy[segment] && hierarchy[segment].length > 0
      const prefix = level > 0 ? '　　'.repeat(level - 1) + '　└ ' : ''
      options.push({ 
        value: segment, 
        label: prefix + segment,
        level,
        isParent
      })
      
      if (hierarchy[segment]) {
        hierarchy[segment].forEach((child: string) => {
          addWithChildren(child, level + 1)
        })
      }
    }
    
    // Find root segments - only those that are not children of any other segment
    const allChildren = new Set(Object.values(hierarchy).flat())
    const roots: string[] = []
    
    // Add all segments that have children but are not children themselves
    Object.keys(hierarchy).forEach(parent => {
      if (!allChildren.has(parent)) {
        roots.push(parent)
      }
    })
    
    // Add standalone segments (no children and not a child of anyone)
    availableSegments.forEach((segment: string) => {
      if (!allChildren.has(segment) && !hierarchy[segment]) {
        roots.push(segment)
      }
    })
    
    // Sort roots to ensure consistent order
    roots.sort()
    roots.forEach(root => addWithChildren(root, 0))
    
    return options.length > 0 ? options : availableSegments.map((s: string) => ({ value: s, label: s, level: 0, isParent: false }))
  }
  
  const hierarchicalOptions = getHierarchicalOptions()

  // Add segment to selection
  const handleAddSegment = () => {
    if (!currentSegmentSelection) return
    
    const id = `${selectedSegmentType}::${currentSegmentSelection}`
    const exists = selectedSegments.find(s => s.id === id)
    
    if (!exists) {
      const newSegment = {
        type: selectedSegmentType,
        segment: currentSegmentSelection,
        id
      }
      
      const updated = [...selectedSegments, newSegment]
      setSelectedSegments(updated)
      
      // Update store with segment names AND the full advanced segments data
      updateFilters({ 
        segments: updated.map(s => s.segment),
        segmentType: selectedSegmentType, // Keep this for compatibility
        advancedSegments: updated // Pass the full segment+type data
      } as any)
    }
    
    // Clear current selection after adding
    setCurrentSegmentSelection('')
  }

  // Remove a segment
  const handleRemoveSegment = (id: string) => {
    const updated = selectedSegments.filter(s => s.id !== id)
    setSelectedSegments(updated)
    updateFilters({ 
      segments: updated.map(s => s.segment),
      advancedSegments: updated // Pass the full segment+type data
    } as any)
  }

  // Clear all segments
  const handleClearAllSegments = () => {
    setSelectedSegments([])
    setCurrentSegmentSelection('')
    updateFilters({ segments: [], advancedSegments: [] } as any)
  }

  // Remove a geography
  const handleRemoveGeography = (geo: string) => {
    const updated = filters.geographies.filter(g => g !== geo)
    updateFilters({ geographies: updated })
  }

  // Clear all geographies
  const handleClearAllGeographies = () => {
    updateFilters({ geographies: [] })
  }

  if (!data) return null

  const segmentTypes = Object.keys(data.dimensions.segments)

  return (
    <div className="bg-white rounded-lg shadow-sm p-2.5 space-y-2">
      {/* Data Type Selection */}
      <div>
        <label className="text-xs font-medium text-gray-600 uppercase">
          Data Type
        </label>
        <div className="flex gap-1 mt-1">
          <button
            onClick={() => updateFilters({ dataType: 'value' })}
            className={`flex-1 px-3 py-1.5 text-sm rounded ${
              filters.dataType === 'value'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Value
          </button>
          <button
            onClick={() => updateFilters({ dataType: 'volume' })}
            className={`flex-1 px-3 py-1.5 text-sm rounded ${
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
        <label className="text-xs font-medium text-gray-600 uppercase">
          View Mode
        </label>
        <select
          value={filters.viewMode}
          onChange={(e) => updateFilters({ viewMode: e.target.value as any })}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded mt-1"
        >
          <option value="segment-mode">Segment Mode</option>
          <option value="geography-mode">Geography Mode</option>
          <option value="matrix">Matrix View</option>
        </select>
      </div>

      {/* Geography Selection */}
      <div>
        <GeographyMultiSelect />
        
        {/* Selected Geographies Display */}
        {filters.geographies.length > 0 && (
          <div className="mt-1 p-1.5 bg-blue-50 rounded">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center text-xs font-medium text-blue-900">
                <MapPin className="h-3 w-3 mr-1" />
                Selected ({filters.geographies.length})
              </div>
              <button
                onClick={handleClearAllGeographies}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {filters.geographies.map(geo => (
                <span
                  key={geo}
                  className="inline-flex items-center px-1.5 py-0.5 text-xs bg-white text-blue-800 rounded border border-blue-200"
                >
                  {geo}
                  <button
                    onClick={() => handleRemoveGeography(geo)}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Segment Selection Section */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600 uppercase">
          Segment Selection (Multi-Type)
        </div>
        
        {/* Segment Type Selector */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Step 1: Select Segment Type
          </label>
          <select
            value={selectedSegmentType}
            onChange={(e) => {
              setSelectedSegmentType(e.target.value)
              setCurrentSegmentSelection('') // Clear selection when type changes
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {segmentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Segment Selector */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Step 2: Select Segment from {selectedSegmentType}
          </label>
          <select
            value={currentSegmentSelection}
            onChange={(e) => setCurrentSegmentSelection(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
          >
            <option value="">Select a segment...</option>
            {hierarchicalOptions.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                style={{ fontWeight: option.isParent ? 'bold' : 'normal' }}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Add Button - Now on its own line */}
          <button
            onClick={handleAddSegment}
            disabled={!currentSegmentSelection}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Selected Segment</span>
          </button>
        </div>

        {/* Selected Segments Display */}
        {selectedSegments.length > 0 && (
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-sm font-medium text-green-900">
                <Tag className="h-4 w-4 mr-1" />
                Selected Segments ({selectedSegments.length})
              </div>
              <button
                onClick={handleClearAllSegments}
                className="text-xs text-green-600 hover:text-green-800"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-1">
              {selectedSegments.map(({ type, segment, id }) => (
                <div
                  key={id}
                  className="flex items-center justify-between p-2 bg-white rounded border border-green-200"
                >
                  <div className="text-xs">
                    <span className="font-medium text-gray-600">{type}:</span>
                    <span className="ml-2 text-gray-800">{segment}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveSegment(id)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {selectedSegments.length === 0 && (
          <p className="text-xs text-gray-500 italic">
            💡 Select segments from different types for cross-type comparison.
          </p>
        )}
      </div>

      {/* Year Range */}
      <div>
        <YearRangeSlider />
      </div>

      {/* Summary */}
      {(filters.geographies.length > 0 || selectedSegments.length > 0) && (
        <div className="p-3 bg-gray-100 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Comparison Summary
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>📍 {filters.geographies.length} geographies</div>
            <div>📊 {selectedSegments.length} segments from {new Set(selectedSegments.map(s => s.type)).size} types</div>
            <div>📅 Years: {filters.yearRange[0]} - {filters.yearRange[1]}</div>
            <div>📈 Data: {filters.dataType}</div>
          </div>
        </div>
      )}
    </div>
  )
}
