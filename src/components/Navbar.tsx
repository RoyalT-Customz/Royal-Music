"use client";

import Link from "next/link";

interface NavbarProps {
  credits: number;
}

export default function Navbar({ credits }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-shadow">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Royal<span className="text-brand-400">Music</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Create
            </Link>
            <Link
              href="/enhance"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Enhance
            </Link>
            <Link
              href="/"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Library
            </Link>
            <Link
              href="/"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Explore
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Credit Counter */}
            <div className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border ${credits > 0 ? 'border-brand-500/30 bg-brand-500/10 text-brand-300' : 'border-red-500/30 bg-red-500/10 text-red-400'} transition-colors`}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
              </svg>
              <span className="font-semibold">{credits}</span>
              <span className="text-xs opacity-70 hidden sm:inline">credits</span>
            </div>
            <button className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5">
              Sign In
            </button>
            <button className="text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-brand-500/20">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
