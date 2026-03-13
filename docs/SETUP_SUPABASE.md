# Supabase Setup Guide

This guide will walk you through setting up Supabase for the Reclaim application, including creating a project, setting up storage buckets, and configuring environment variables.

## Prerequisites

- A Supabase account (sign up at [https://supabase.com](https://supabase.com) if you don't have one)

## Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com) and sign in
2. Click **"New Project"** or **"Create a new project"**
3. Fill in the project details:
   - **Name**: Choose a name for your project (e.g., "Reclaim")
   - **Database Password**: Create a strong password (save this securely - you'll need it for database access)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Select your plan (Free tier is fine for development)
4. Click **"Create new project"**
5. Wait for the project to be provisioned (this may take a few minutes)

## Step 2: Get Your API Keys

1. Once your project is ready, go to **Settings** → **API**
2. You'll find the following keys:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: This is your `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## Step 3: Create Storage Bucket for Item Photos

1. In your Supabase dashboard, navigate to **Storage** in the left sidebar
2. Click **"Create a new bucket"**
3. Configure the bucket:
   - **Name**: `item-photos`
   - **Public bucket**: **Unchecked** (make it private)
   - Click **"Create bucket"**
4. After creating the bucket, click on it to configure settings:
   - Go to **"Policies"** tab
   - Click **"New Policy"** → **"Create a policy from scratch"**
   - **Policy name**: `Allow authenticated uploads`
   - **Allowed operation**: `INSERT`
   - **Policy definition**: 
     ```sql
     (bucket_id = 'item-photos'::text) AND (auth.role() = 'authenticated'::text)
     ```
   - Click **"Review"** → **"Save policy"**
   - Repeat for `SELECT` operation (for viewing photos):
     - **Policy name**: `Allow authenticated reads`
     - **Allowed operation**: `SELECT`
     - **Policy definition**: 
       ```sql
       (bucket_id = 'item-photos'::text) AND (auth.role() = 'authenticated'::text)
       ```
5. Configure file size and type limits:
   - Go to **Storage** → **Settings** (gear icon)
   - Set **File size limit**: `5242880` (5MB in bytes)
   - Set **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/gif`
   - Click **"Save"**

## Step 4: Configure Environment Variables

### Local Development (.env.local)

Create or update `.env.local` in the `lostfound` directory with the following:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Where to find these values:**
- `NEXT_PUBLIC_SUPABASE_URL`: Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Settings → API → anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Settings → API → service_role key

### Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production, Preview, Development |

4. Click **"Save"** for each variable
5. **Important**: After adding environment variables, redeploy your application for the changes to take effect

## Step 5: Verify Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. The application will validate environment variables on startup. If any are missing, you'll see clear error messages.

3. Test file upload functionality to ensure the storage bucket is configured correctly.

## Security Notes

- ⚠️ **Never commit** `.env.local` to version control
- ⚠️ **Never expose** `SUPABASE_SERVICE_ROLE_KEY` to the client - it has admin privileges
- ✅ The `NEXT_PUBLIC_*` variables are safe to expose to the client
- ✅ The service role key is only used in server-side code (API routes, server components)

## Troubleshooting

### "Environment variable missing" error
- Check that `.env.local` exists in the `lostfound` directory
- Verify all three variables are set correctly
- Restart your development server after adding variables

### Storage upload fails
- Verify the bucket name is exactly `item-photos`
- Check that storage policies allow authenticated users
- Verify file size and MIME type restrictions match your uploads

### Vercel deployment issues
- Ensure all environment variables are added to Vercel
- Redeploy after adding new environment variables
- Check Vercel build logs for specific error messages
