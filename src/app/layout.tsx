import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Theme from './theme'
import "./layout.css"
import VineyardNavbar from './vineyardNavbar'
import { Container } from '@nextui-org/react'
import VineyardContainer from './vineyardContainer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Checkers',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Theme>
          <VineyardNavbar links={
            ["/", "/checkers"]
          } />
          <main>
            <VineyardContainer>
              {children}
            </VineyardContainer>
          </main>
        </Theme>
      </body>
    </html>
  )
}
