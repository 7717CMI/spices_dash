/**
 * Competitive Intelligence Data Generator
 * Generates data for competitive dashboard and market share analysis
 * Last updated: 2024
 */

export interface CompanyData {
  id: string
  name: string
  headquarters: string
  ceo: string
  yearEstablished: number
  portfolio: string
  strategies: string[]
  regionalStrength: string
  overallRevenue: number // in INR Cr
  segmentalRevenue: number // in INR Cr for 2024
  marketShare: number // percentage
}

export interface MarketShareData {
  company: string
  marketShare: number
  color: string
}

// Top spice companies in India spices market
const companies = [
  'Everest Food Products Pvt Ltd',
  'MDH Spices',
  'MTR Foods Pvt Ltd',
  'Catch Foods',
  'DS Group',
  'Zoff Foods',
  'Eastern Condiments Private Limited',
  'Malpani Spices',
  'Others'
]

// Company colors using the enterprise palette
const companyColors: Record<string, string> = {
  'Everest Food Products Pvt Ltd': '#52B69A',      // Teal
  'MDH Spices': '#34A0A4',             // Medium Teal
  'MTR Foods Pvt Ltd': '#D9ED92',   // Yellow Green
  'Catch Foods': '#184E77', // Navy Blue
  'DS Group': '#B5E48C',  // Light Lime
  'Zoff Foods': '#1E6091', // Deep Blue
  'Eastern Condiments Private Limited': '#168AAD', // Deep Teal
  'Malpani Spices': '#1A759F', // Blue Teal
  'Others': '#99D98C'                 // Medium Green
}

// Headquarters locations
const headquarters: Record<string, string> = {
  'Everest Food Products Pvt Ltd': 'Mumbai, India',
  'MDH Spices': 'New Delhi, India',
  'MTR Foods Pvt Ltd': 'Bangalore, India',
  'Catch Foods': 'Mumbai, India',
  'DS Group': 'New Delhi, India',
  'Zoff Foods': 'Mumbai, India',
  'Eastern Condiments Private Limited': 'Kochi, India',
  'Malpani Spices': 'Mumbai, India',
  'Others': 'Various'
}

// CEOs (simulated names)
const ceos: Record<string, string> = {
  'Everest Food Products Pvt Ltd': 'Ramesh Shah',
  'MDH Spices': 'Dharampal Gulati',
  'MTR Foods Pvt Ltd': 'Vikram Maiya',
  'Catch Foods': 'Rajesh Agarwal',
  'DS Group': 'Shri Ram',
  'Zoff Foods': 'Amit Gupta',
  'Eastern Condiments Private Limited': 'K. V. Thomas',
  'Malpani Spices': 'Ramesh Malpani',
  'Others': 'Multiple'
}

// Year established
const yearEstablished: Record<string, number> = {
  'Everest Food Products Pvt Ltd': 1971,
  'MDH Spices': 1919,
  'MTR Foods Pvt Ltd': 1924,
  'Catch Foods': 1989,
  'DS Group': 1929,
  'Zoff Foods': 1995,
  'Eastern Condiments Private Limited': 1997,
  'Malpani Spices': 1985,
  'Others': 0
}

// Product portfolios
const portfolios: Record<string, string> = {
  'Everest Food Products Pvt Ltd': 'Spice Blends, Masala Mixes, Ready-to-Cook',
  'MDH Spices': 'Whole Spices, Ground Spices, Spice Blends',
  'MTR Foods Pvt Ltd': 'Ready-to-Eat, Spice Mixes, Instant Foods',
  'Catch Foods': 'Spice Powders, Blended Spices, Seasonings',
  'DS Group': 'Spice Blends, Food Products, Beverages',
  'Zoff Foods': 'Spice Mixes, Condiments, Seasonings',
  'Eastern Condiments Private Limited': 'Spice Blends, Curry Powders, Masalas',
  'Malpani Spices': 'Whole Spices, Ground Spices, Blended Spices',
  'Others': 'Various Spice Products'
}

// Regional strengths
const regionalStrengths: Record<string, string> = {
  'Everest Food Products Pvt Ltd': 'North India, West India',
  'MDH Spices': 'North India, Global',
  'MTR Foods Pvt Ltd': 'South India, Global',
  'Catch Foods': 'North India, West India',
  'DS Group': 'North India, East India',
  'Zoff Foods': 'North India, West India',
  'Eastern Condiments Private Limited': 'South India, Kerala',
  'Malpani Spices': 'West India, Maharashtra',
  'Others': 'Pan-India'
}

// Market share percentages (must sum to 100)
const marketShares: Record<string, number> = {
  'Everest Food Products Pvt Ltd': 18.0,
  'MDH Spices': 22.0,
  'MTR Foods Pvt Ltd': 15.0,
  'Catch Foods': 12.0,
  'DS Group': 10.0,
  'Zoff Foods': 8.0,
  'Eastern Condiments Private Limited': 6.0,
  'Malpani Spices': 4.0,
  'Others': 5.0
}

// Generate strategies based on company type
function generateStrategies(company: string): string[] {
  const strategyMap: Record<string, string[]> = {
    'Everest Food Products Pvt Ltd': ['Brand Expansion', 'Product Innovation', 'Retail Penetration'],
    'MDH Spices': ['Heritage Branding', 'Quality Focus', 'Global Expansion'],
    'MTR Foods Pvt Ltd': ['Ready-to-Eat Focus', 'Premium Positioning', 'Export Markets'],
    'Catch Foods': ['Value Positioning', 'Mass Market', 'Distribution Network'],
    'DS Group': ['Diversification', 'Premium Products', 'Regional Dominance'],
    'Zoff Foods': ['Modern Branding', 'Youth Market', 'Digital Presence'],
    'Eastern Condiments Private Limited': ['Regional Specialization', 'Authentic Recipes', 'Local Markets'],
    'Malpani Spices': ['Quality Spices', 'B2B Focus', 'Export Orientation'],
    'Others': ['Diverse Strategies', 'Regional Focus', 'Market Specific']
  }
  
  return strategyMap[company] || ['Market Development', 'Product Innovation', 'Strategic Partnerships']
}

// Generate revenue based on market share
function generateRevenue(marketShare: number): { overall: number, segmental: number } {
  // Total market size approximately 50000 INR Cr (India Spices Market)
  const totalMarketSize = 50000
  const segmentalRevenue = (marketShare / 100) * totalMarketSize
  
  // Overall revenue is typically 1.5-3x the segmental revenue (company has other products)
  const multiplier = 1.5 + Math.random() * 1.5
  const overallRevenue = segmentalRevenue * multiplier
  
  return {
    overall: Math.round(overallRevenue),
    segmental: Math.round(segmentalRevenue)
  }
}

/**
 * Generate competitive intelligence data for all companies
 */
export function generateCompetitiveData(): CompanyData[] {
  return companies.map(company => {
    const revenue = generateRevenue(marketShares[company])
    
    return {
      id: company.toLowerCase().replace(/\s+/g, '-'),
      name: company,
      headquarters: headquarters[company],
      ceo: ceos[company],
      yearEstablished: yearEstablished[company],
      portfolio: portfolios[company],
      strategies: generateStrategies(company),
      regionalStrength: regionalStrengths[company],
      overallRevenue: revenue.overall,
      segmentalRevenue: revenue.segmental,
      marketShare: marketShares[company]
    }
  })
}

/**
 * Generate market share data for pie chart
 */
export function generateMarketShareData(): MarketShareData[] {
  return companies.map(company => ({
    company,
    marketShare: marketShares[company],
    color: companyColors[company]
  }))
}

/**
 * Get top companies by market share
 */
export function getTopCompanies(limit: number = 5): CompanyData[] {
  const allCompanies = generateCompetitiveData()
  return allCompanies
    .filter(c => c.name !== 'Others')
    .sort((a, b) => b.marketShare - a.marketShare)
    .slice(0, limit)
}

/**
 * Calculate market concentration (HHI - Herfindahl-Hirschman Index)
 */
export function calculateMarketConcentration(): { hhi: number; concentration: string } {
  const shares = Object.values(marketShares)
  const hhi = shares.reduce((sum, share) => sum + Math.pow(share, 2), 0)
  
  let concentration = 'Competitive'
  if (hhi < 1500) {
    concentration = 'Competitive'
  } else if (hhi < 2500) {
    concentration = 'Moderately Concentrated'
  } else {
    concentration = 'Highly Concentrated'
  }
  
  return { hhi: Math.round(hhi), concentration }
}

/**
 * Get company comparison data for competitive dashboard
 */
export function getCompanyComparison(): {
  headers: string[];
  rows: { label: string; values: (string | number)[] }[];
} {
  const companies = generateCompetitiveData().slice(0, 10) // Top 10 companies
  
  const headers = companies.map(c => c.name)
  
  const rows = [
    {
      label: "Headquarters",
      values: companies.map(c => c.headquarters)
    },
    {
      label: "Key Management (CEO)",
      values: companies.map(c => c.ceo)
    },
    {
      label: "Year of Establishment",
      values: companies.map(c => c.yearEstablished || 'N/A')
    },
    {
      label: "Product/Service Portfolio",
      values: companies.map(c => c.portfolio)
    },
    {
      label: "Strategies/Recent Developments",
      values: companies.map(c => c.strategies.join(', '))
    },
    {
      label: "Regional Strength",
      values: companies.map(c => c.regionalStrength)
    },
    {
      label: "Overall Revenue (INR Cr)",
      values: companies.map(c => c.overallRevenue.toLocaleString())
    },
    {
      label: "Segmental Revenue (INR Cr), 2024",
      values: companies.map(c => c.segmentalRevenue.toLocaleString())
    }
  ]
  
  return { headers, rows }
}
