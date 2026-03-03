// =====================================================
// 1. app/layout.tsx — add ThemeProvider + PWA meta tags
// =====================================================
// Add these to your root layout.tsx <head>:

/*
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2563eb" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="SkillLink" />
<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
*/

// =====================================================
// 2. Install shadcn dark mode (next-themes)
// =====================================================
// Run: pnpm add next-themes

// =====================================================
// 3. Create components/theme-provider.tsx
// =====================================================
export const ThemeProviderCode = `
"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
`

// =====================================================
// 4. Wrap root layout with ThemeProvider
// =====================================================
export const RootLayoutCode = `
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="SkillLink" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
`