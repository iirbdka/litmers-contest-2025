"use client"

import type React from "react"

import { useState } from "react"
import { AppHeader } from "./app-header"
import { AppSidebar, MobileSidebar } from "./app-sidebar"
import { Sheet, SheetContent } from "@/components/ui/sheet"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1">
        <AppSidebar />
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <MobileSidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
