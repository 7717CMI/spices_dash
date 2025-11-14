import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic' // Disable caching for this route

export async function GET() {
  try {
    // Read the distributors intelligence JSON file from public folder
    const filePath = join(process.cwd(), 'public', 'distributors-intelligence.json')
    const fileContents = await readFile(filePath, 'utf8')
    const data = JSON.parse(fileContents)
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error loading distributors data:', error)
    return NextResponse.json(
      { error: 'Failed to load distributors data' },
      { status: 500 }
    )
  }
}
