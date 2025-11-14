# Vercel Setup Instructions

## IMPORTANT: Root Directory Configuration

Your Next.js app is in the `frontend` subdirectory. You **MUST** configure this in Vercel Dashboard:

### Steps:

1. **Go to your Vercel project**: https://vercel.com/dashboard
2. **Select your project** (`spices_dash`)
3. **Go to Settings** → **General**
4. **Find "Root Directory"** section
5. **Click "Edit"** and set it to: `frontend`
6. **Save** the changes
7. **Redeploy** your project

### Why?

Vercel needs to know where your `package.json` and Next.js app are located. Since your app is in the `frontend` folder (not the root), you need to tell Vercel to use `frontend` as the root directory.

Once you set the Root Directory to `frontend`:
- Vercel will automatically find your `package.json`
- It will detect Next.js correctly
- Build commands will run from the `frontend` directory
- No need for `cd frontend &&` in commands

### Alternative (if Root Directory setting doesn't work):

If for some reason you can't set the Root Directory in the dashboard, you can use the simplified `vercel.json` which relies on the dashboard setting. If that doesn't work, we can add back the explicit commands.

## After Setting Root Directory

Once you've set the Root Directory to `frontend` in the Vercel dashboard:
1. The build should automatically detect Next.js
2. All commands will run from the `frontend` directory
3. Your deployment should succeed

