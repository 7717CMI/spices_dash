import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    // Read the distributors intelligence JSON file from public folder
    const filePath = join(process.cwd(), 'public', 'distributors-intelligence.json')
    const fileContents = await readFile(filePath, 'utf8')
    const data = JSON.parse(fileContents)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error loading distributors data:', error)
    return NextResponse.json(
      { error: 'Failed to load distributors data' },
      { status: 500 }
    )
  }
}
