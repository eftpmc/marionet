"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, Sun, Moon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Overview from "@/components/dashboard/Overview"
import Settings from "@/components/dashboard/Settings"

export default function Dashboard() {
  const [user, setUser] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "settings">("overview")
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    fetch("/api/me").then(async (res) => {
      if (res.ok) {
        const data = await res.json()
        setUser(data.user.username)
      } else {
        router.push("/login")
      }
    })
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" })
    router.push("/login")
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4 shadow">
        {/* Desktop shows "Dashboard", mobile shows dropdown */}
        <h1 className="hidden md:block text-xl font-bold">Dashboard</h1>
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setActiveTab("overview")}>
                Overview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("settings")}>
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Hi, {user}</span>

          {/* Dark mode toggle */}
          <Button
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Logout */}
          <Button size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar (desktop only) */}
        <aside className="w-64 border-r border-border p-6 hidden md:block">
          <nav className="space-y-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`block text-sm font-medium ${activeTab === "overview" ? "underline underline-offset-4" : "hover:underline underline-offset-4"
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`block text-sm font-medium ${activeTab === "settings" ? "underline underline-offset-4" : "hover:underline underline-offset-4"
                }`}
            >
              Settings
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6">
          {activeTab === "overview" && <Overview />}
          {activeTab === "settings" && (
            <div className="rounded-lg border border-border p-6 shadow-shadow">
              <h2 className="text-lg font-semibold mb-4">Settings</h2>
              <Settings initialUsername={user} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}