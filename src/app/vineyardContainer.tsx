'use client'

import { Container } from "@nextui-org/react"

export default function VineyardContainer({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Container css={{
      height: "calc(100vh - var(--nextui--navbarHeight))",
    }}>
      {children}
    </Container>
  )
}