"use client";

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Cek localStorage atau setelan default OS
    const theme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (theme === 'dark' || (!theme && systemDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  // Mencegah hydration mismatch
  if (!mounted) return <div className="w-9 h-9"></div>;

  return (
    <button 
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-gray-200 dark:bg-[#0F1117] border border-gray-300 dark:border-gray-800 text-gray-700 dark:text-[#F59E0B] hover:bg-gray-300 dark:hover:bg-gray-800 transition-all duration-300 shadow-sm"
      title={isDark ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}