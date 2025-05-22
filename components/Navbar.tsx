"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Menu, X, User, LogOut, ChevronDown } from "lucide-react"
import { useState } from "react"

const navItems = [
  { label: "Home", href: "/" },
  { label: "Create Resume", href: "/create" },
  { label: "Analyze", href: "/analyze" },
  { label: "Mentors", href: "/mentors" },
]

export function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false })
      toast.success("Logged out successfully")
      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Failed to logout")
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* App Logo/Name */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Resume Analyzer
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-all duration-200",
                  pathname === item.href
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-purple-600 to-blue-500 transform scale-x-0 transition-transform duration-200",
                    pathname === item.href ? "scale-x-100" : "group-hover:scale-x-100"
                  )}
                />
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            {session ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 text-white">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {session.user?.name || session.user?.email}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login">
                  <Button 
                    variant="ghost" 
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 shadow-sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="absolute top-20 left-0 right-0 bg-white border-b border-gray-100 md:hidden animate-in slide-in-from-top-2">
              <div className="container mx-auto px-4 py-4">
                {/* User Profile Section - Mobile */}
                {session && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-4">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 text-white">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {session.user?.name || session.user?.email}
                      </p>
                      <p className="text-xs text-gray-500">View Profile</p>
                    </div>
                  </div>
                )}

                {/* Mobile Navigation Links */}
                <div className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                        pathname === item.href
                          ? "bg-gray-50 text-gray-900"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* Mobile Auth Buttons */}
                <div className="pt-4 mt-4 border-t border-gray-100">
                  {session ? (
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full text-gray-600 hover:text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Link href="/auth/login" className="block w-full">
                        <Button 
                          variant="ghost" 
                          className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        >
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/auth/register" className="block w-full">
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600">
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}