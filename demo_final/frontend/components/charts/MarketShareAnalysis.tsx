'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { generateMarketShareData } from '@/lib/competitive-intelligence-data'

interface MarketShareAnalysisProps {
  year?: number
}

export function MarketShareAnalysis({ year = 2024 }: MarketShareAnalysisProps) {
  const marketShareData = useMemo(() => generateMarketShareData(), [])

  // Custom label renderer for pie slices
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.03) return null // Don't show label for very small slices
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    )
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0]
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-sm text-gray-600">Market Share:</span>
            <span className="text-sm font-semibold text-gray-900">{data.value.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-sm text-gray-600">Revenue (USD Mn):</span>
            <span className="text-sm font-semibold text-gray-900">
              {((data.value / 100) * 5000).toFixed(0)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Custom legend
  const renderLegend = (props: any) => {
    const { payload } = props
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-gray-700">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Pie Chart */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={marketShareData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={140}
                fill="#8884d8"
                dataKey="marketShare"
                nameKey="company"
              >
                {marketShareData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Market Stats */}
        <div className="lg:w-80">
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="space-y-3">
              {marketShareData.slice(0, 5).map((company, idx) => (
                <div key={company.company} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 w-4">{idx + 1}.</span>
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: company.color }}
                    />
                    <span className="text-sm text-gray-700">{company.company}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {company.marketShare.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Top 5 Total:</span>
                <span className="font-semibold text-gray-900">
                  {marketShareData.slice(0, 5).reduce((sum, c) => sum + c.marketShare, 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Market Size:</span>
                <span className="font-semibold text-gray-900">~5,000 USD Mn</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
