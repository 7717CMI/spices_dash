# India Spices Market Dashboard

A comprehensive analytics dashboard for the India Spices Market built with Next.js, React, and TypeScript.

## Features

- **Interactive Charts**: Multiple chart types including bar charts, line charts, heatmaps, and bubble charts
- **Advanced Filtering**: Filter by geography, segment type, year range, and more
- **Real-time Insights**: Auto-generated insights based on selected filters
- **Competitive Intelligence**: Market share analysis and competitive landscape
- **Distributor Intelligence**: Comprehensive distributor database and analytics
- **Export Capabilities**: Export charts and reports as PNG or PDF

## Tech Stack

- **Framework**: Next.js 16
- **UI Library**: React 19
- **State Management**: Zustand
- **Charts**: Recharts, D3.js
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Vercel Deployment

This project is configured for easy deployment on Vercel:

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in Vercel
3. Vercel will automatically detect the Next.js framework
4. The `vercel.json` configuration will handle the build settings

**Note**: The project root is set to the `frontend` directory in `vercel.json`.

### Manual Build

To build for production:

```bash
cd frontend
npm run build
npm start
```

## Project Structure

```
.
├── frontend/              # Next.js application
│   ├── app/              # Next.js app router
│   │   ├── api/         # API routes
│   │   └── page.tsx     # Main dashboard page
│   ├── components/      # React components
│   │   ├── charts/      # Chart components
│   │   └── filters/     # Filter components
│   ├── lib/             # Utility functions and types
│   └── public/          # Static assets and JSON data
├── data/                # Source data files
└── vercel.json          # Vercel configuration
```

## Data Files

The dashboard uses JSON data files located in `frontend/public/`:

- `comparison-data.json`: Main market data
- `distributors-intelligence.json`: Distributor information

## Environment Variables

No environment variables are required for basic functionality. All data is loaded from JSON files in the public directory.

## License

Private - All rights reserved

