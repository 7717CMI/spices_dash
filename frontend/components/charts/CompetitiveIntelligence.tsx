'use client'

import { CompetitiveDashboard } from './CompetitiveDashboard'
import { MarketShareAnalysis } from './MarketShareAnalysis'

interface CompetitiveIntelligenceProps {
  height?: number
}

export function CompetitiveIntelligence({ height = 600 }: CompetitiveIntelligenceProps) {
  return (
    <div className="w-full space-y-6">
      {/* Main Header - Subtle enterprise style */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-[#52B69A] to-[#168AAD] rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Competitive Intelligence 2025</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              Market landscape analysis and competitive positioning
            </p>
          </div>
        </div>
      </div>

      {/* Market Share Analysis Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Company Market Share Analysis 2025
        </h3>
        <MarketShareAnalysis year={new Date().getFullYear()} />
      </div>

      {/* Competitive Dashboard Section */}
      <div>
        <CompetitiveDashboard />
      </div>

      {/* Key Insights */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Market Concentration</div>
            <div className="text-lg font-bold text-gray-900">Moderately Concentrated</div>
            <div className="text-xs text-gray-500 mt-1">Top 3 players hold 75% share</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Market Leader</div>
            <div className="text-lg font-bold text-gray-900">Hebei Xing Chemical</div>
            <div className="text-xs text-gray-500 mt-1">42% market share</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Growth Opportunity</div>
            <div className="text-lg font-bold text-gray-900">Asia Pacific</div>
            <div className="text-xs text-gray-500 mt-1">Fastest growing region</div>
          </div>
        </div>
      </div>
    </div>
  )
}
