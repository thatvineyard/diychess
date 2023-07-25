'use client'

import { createTheme, NextUIProvider,  useSSR } from "@nextui-org/react"
import { ThemeProvider } from "next-themes"

const lightTheme = createTheme({
  type: 'light',
  theme: {
    colors: {
      mycolor: '#0F0',
    }, // optional
  }
})

const darkTheme = createTheme({
  type: 'dark',
  theme: {
    colors: {
      white: '#0F0',
      primary: '#F0F',
      primarySolidContrast: '#FF0',
      mycolor: "#0F0",
    }, // optional
  }
})

export default function Theme({
  children,
}: {
  children: React.ReactNode
}) {
  const { isBrowser } = useSSR()
  return (
    isBrowser && (
      <ThemeProvider
        defaultTheme="system"
        attribute="class"
        value={{
          light: lightTheme.className,
          dark: darkTheme.className
        }}
      >
        <NextUIProvider>
          {children}
        </NextUIProvider>
      </ThemeProvider>
    )
  )
}
