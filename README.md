# LostFound

**Lost. Found. Returned.**

A faster way to reconnect students with their belongings.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd lostfound

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📋 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run type-check   # Run TypeScript type checking
```

## 🎨 Design System

### Color Palette

- **Background**: `#0B0B0C` - Deep dark background
- **Text**: `#F2F2F2` - High contrast text
- **Muted**: `#9CA3AF` - Secondary text and borders
- **Primary**: `#A855F7` - Purple gradient start
- **Primary-2**: `#EC4899` - Pink gradient end

### Typography

- **Font Family**: System UI stack for optimal performance
- **Focus Rings**: WCAG AA compliant with 2px outline
- **Skip Links**: Available for keyboard navigation

## ♿ Accessibility Features

- **WCAG AA Compliant**: High contrast ratios and proper focus management
- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Skip Links**: Quick navigation to main content
- **Focus Management**: Clear focus rings and logical tab order

## 🏗️ Project Structure

```
src/
├── app/
│   ├── (public)/          # Public routes group
│   │   ├── layout.tsx     # Public layout with navigation
│   │   └── page.tsx       # Homepage hero
│   ├── globals.css        # Global styles and CSS variables
│   └── layout.tsx         # Root layout
├── components/
│   └── ui/                # Reusable UI components
│       ├── Button.tsx     # Button component with variants
│       └── Input.tsx      # Input component with accessibility
├── lib/
│   └── utils.ts           # Utility functions (cn helper)
└── styles/
    └── globals.css        # Custom CSS variables and base styles
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom CSS variables
- **Linting**: ESLint with accessibility rules
- **Formatting**: Prettier with Tailwind plugin
- **UI Components**: Custom components (no external UI library)

## 🎯 Features

- **Dark Theme**: Custom dark theme with CSS variables
- **Responsive Design**: Mobile-first approach
- **Gradient CTAs**: Eye-catching gradient buttons
- **Accessibility**: WCAG AA compliant
- **Type Safety**: Strict TypeScript configuration
- **Code Quality**: ESLint + Prettier setup

## 🚀 Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import your repository**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables** (if needed)
   - In your Vercel project settings, go to "Environment Variables"
   - Add any environment variables your application requires
   - Apply to all environments (Production, Preview, Development)

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app
   - Your site will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd lostfound
   vercel
   ```

3. **Follow the prompts** to link your project and set environment variables

### Post-Deployment

- **Automatic Deployments**: Every push to your main branch triggers a new deployment
- **Preview Deployments**: Pull requests get preview URLs automatically
- **Custom Domain**: Add your domain in Vercel project settings

### Notes

- No `vercel.json` needed: Next.js is auto-detected and Vercel uses smart defaults
- Environment variables must be set in Vercel dashboard for production
- Build command: `npm run build` (auto-detected)
- Output directory: `.next` (auto-detected)

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email support@lostfound.com or join our Slack channel.
