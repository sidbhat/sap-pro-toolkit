# Deployment Guide for SAP Pro Toolkit Community Hub

This guide explains how to deploy the community website to various hosting platforms.

## Prerequisites

- Node.js 18+ installed
- Git configured
- Access to hosting platform (Vercel, Netlify, or GitHub Pages)

## Local Development

```bash
cd website
npm install
npm run dev
```

Website runs at: http://localhost:3000

## Build for Production

```bash
cd website
npm run build
```

This creates a static export in the `out/` directory.

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

**Automatic Deployment:**

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Import Project"
4. Select the `sap-pro-toolkit` repository
5. Configure build settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `website`
   - **Build Command**: `npm run build`
   - **Output Directory**: `out`
6. Click "Deploy"

**Result**: Automatic deployments on every push to main branch
**URL**: `https://sap-pro-toolkit.vercel.app` (or custom domain)

**Manual CLI Deployment:**

```bash
# Install Vercel CLI
npm install -g vercel

# From website/ directory
cd website
vercel --prod
```

### Option 2: Netlify

**Automatic Deployment:**

1. Go to https://netlify.com
2. Sign in with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select the `sap-pro-toolkit` repository
5. Configure build settings:
   - **Base directory**: `website`
   - **Build command**: `npm run build`
   - **Publish directory**: `website/out`
6. Click "Deploy site"

**Result**: Automatic deployments on every push to main branch
**URL**: `https://sap-pro-toolkit.netlify.app` (or custom domain)

**Manual CLI Deployment:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# From website/ directory
cd website
npm run build
netlify deploy --prod --dir=out
```

### Option 3: GitHub Pages

**Setup:**

1. Enable GitHub Pages in repository settings
2. Select "GitHub Actions" as source
3. Create workflow file:

```yaml
# .github/workflows/deploy.yml
name: Deploy Website

on:
  push:
    branches: [main]
    paths:
      - 'website/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        working-directory: website
        run: npm ci
        
      - name: Build
        working-directory: website
        run: npm run build
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./website/out
```

**Result**: Automatic deployments on every push to main branch
**URL**: `https://sidbhat.github.io/sap-pro-toolkit/`

## Custom Domain Setup

### Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Netlify:
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Update DNS records as instructed

### GitHub Pages:
1. Add `CNAME` file to `website/public/` with your domain
2. Update DNS records to point to GitHub Pages

## Environment Variables

This website doesn't require any environment variables or API keys.

## Continuous Deployment

All three platforms support automatic deployment:
- **Trigger**: Push to main branch
- **Build time**: ~2-3 minutes
- **Preview**: Available for pull requests

## Monitoring

After deployment, verify:
- [ ] Home page loads correctly
- [ ] Navigation works (Home, Profiles, Contributing)
- [ ] All links functional
- [ ] GitHub links point to correct repository
- [ ] No console errors in browser DevTools

## Troubleshooting

### Build Fails

**Error**: "Module not found"
**Fix**: Ensure all dependencies installed: `npm ci`

**Error**: "Out of memory"
**Fix**: Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`

### Pages Don't Load

**Issue**: 404 errors on routes
**Fix**: Ensure `output: 'export'` in `next.config.mjs`

### Styling Missing

**Issue**: CSS not loading
**Fix**: Check `globals.css` imported in `app/layout.tsx`

## Performance

Static export results in:
- **First Load**: <1s
- **Page Size**: ~50KB per page
- **Lighthouse Score**: 95+ (Performance, Accessibility, SEO)

## Security

- No server-side code (static export)
- No environment variables
- No API keys
- All profile JSONs sanitized for public use

## Support

For deployment issues:
- Check build logs on hosting platform
- Review Next.js export documentation
- Open issue on GitHub
