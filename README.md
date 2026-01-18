# SAP Pro Toolkit Website

This is the documentation website for SAP Pro Toolkit, built with [Nextra](https://nextra.site/).

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Opens at http://localhost:3000
```

### Building

```bash
# Build static site
npm run build

# Build and export static files
npm run export

# Static files will be in ./out directory
```

## 📁 Structure

```
website/
├── pages/              # Content pages (MDX)
│   ├── index.mdx      # Landing page
│   ├── profiles.mdx   # Profile database
│   └── contributing.mdx # Contributing guide
├── theme.config.jsx   # Nextra theme configuration
├── next.config.js     # Next.js configuration
└── package.json       # Dependencies
```

## 🎨 Customization

### Theme Config
Edit `theme.config.jsx` to customize:
- Logo and branding
- Navigation
- Footer
- SEO meta tags

### Styling
Nextra uses Tailwind CSS. Custom styles can be added via:
- Component-level styling in MDX files
- Global CSS (if needed)

## 📝 Adding Content

### New Page
1. Create `pages/your-page.mdx`
2. Add frontmatter and content
3. Page automatically appears in navigation

### Using Components
```mdx
import { Callout } from 'nextra/components'

<Callout type="info">
  Your message here
</Callout>
```

Available types: `default`, `info`, `warning`, `error`

## 🚀 Deployment

### GitHub Pages
```bash
# Build and export
npm run export

# Deploy ./out directory to GitHub Pages
```

### Vercel (Recommended)
1. Import GitHub repository
2. Vercel auto-detects Nextra
3. Deploy automatically on push

### Netlify
1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `.next`

## 📚 Documentation

- [Nextra Documentation](https://nextra.site/)
- [Next.js Documentation](https://nextjs.org/docs)
- [MDX Documentation](https://mdxjs.com/)

## 🤝 Contributing

See [Contributing Guide](../PROFILES.md) for how to contribute to the website content.
