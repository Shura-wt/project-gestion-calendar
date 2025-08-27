"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"

interface NavigationButtonsProps {
  address: string
  className?: string
}

export function NavigationButtons({ address, className = "" }: NavigationButtonsProps) {
  const encodedAddress = encodeURIComponent(address)

  const openGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank")
  }

  const openWaze = () => {
    window.open(`https://waze.com/ul?q=${encodedAddress}`, "_blank")
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={openGoogleMaps}
        className="flex items-center gap-1 px-2 py-1 h-8 bg-transparent"
      >
        <Image src="/icons/google-maps.svg" alt="Google Maps" width={16} height={16} className="flex-shrink-0" />
        <span className="hidden sm:inline text-xs">Maps</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={openWaze}
        className="flex items-center gap-1 px-2 py-1 h-8 bg-transparent"
      >
        <Image src="/icons/waze.svg" alt="Waze" width={16} height={16} className="flex-shrink-0" />
        <span className="hidden sm:inline text-xs">Waze</span>
      </Button>
    </div>
  )
}
