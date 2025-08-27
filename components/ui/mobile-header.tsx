"use client"

import type React from "react"
import { MobileNav } from "@/components/ui/mobile-nav"

interface MobileHeaderProps {
  title: string
  subtitle?: string
  sidebar: React.ReactNode
}

export function MobileHeader({ title, subtitle, sidebar }: MobileHeaderProps) {
  return (
    <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
        <MobileNav>{sidebar}</MobileNav>
      </div>
    </div>
  )
}
