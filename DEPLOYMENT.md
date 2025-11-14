# Vercel Deployment Guide

This guide will help you deploy the India Spices Market Dashboard to Vercel.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to Git**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project in Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - Vercel will auto-detect Next.js

3. **Configure Project Settings**
   - **Root Directory**: Set to `frontend` (or leave blank if using vercel.json)
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

4. **Follow the prompts**
   - Link to existing project or create new
   - Confirm settings
   - Deploy

## Configuration Files

The project includes the following configuration:

- **`vercel.json`**: Vercel-specific settings
  - Root directory: `frontend`
  - Framework: Next.js
  - Build and install commands

- **`frontend/next.config.ts`**: Next.js configuration
  - Production optimizations
  - Serverless function settings

## Important Notes

### File Size Limits

- Vercel has a 50MB limit for serverless functions
- The JSON data files in `public/` are served as static assets (no limit)
- If your data files exceed 50MB, consider:
  - Splitting into multiple files
  - Using a database or external storage
  - Implementing pagination

### Environment Variables

Currently, no environment variables are required. If you need to add them:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add your variables
4. Redeploy

### API Routes

All API routes are configured with:
- `dynamic = 'force-dynamic'` to disable caching
- Proper error handling
- Cache-control headers

### Build Optimization

The Next.js config includes:
- Compression enabled
- React strict mode
- Optimized image handling
- Serverless function body size limit (10MB)

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version (should be 18+)
4. Check for TypeScript errors: `npm run build` locally

### API Routes Not Working

1. Verify file paths use `process.cwd()`
2. Check that JSON files are in `public/` directory
3. Ensure files are committed to Git
4. Check serverless function logs in Vercel dashboard

### Large File Issues

If you encounter issues with large JSON files:
1. Check file sizes: `ls -lh frontend/public/*.json`
2. Consider compressing or splitting files
3. Use external storage (S3, etc.) if needed

## Post-Deployment

After successful deployment:

1. **Test all features**
   - Charts load correctly
   - Filters work
   - API routes respond
   - Data displays properly

2. **Set up custom domain** (optional)
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS as instructed

3. **Enable Analytics** (optional)
   - Go to Project Settings → Analytics
   - Enable Vercel Analytics

## Continuous Deployment

Vercel automatically deploys on every push to your main branch:
- Push to `main` → Production deployment
- Push to other branches → Preview deployment

## Support

For issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Review build logs in Vercel dashboard
- Check Next.js documentation for framework-specific issues

