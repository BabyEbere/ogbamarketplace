'use client';

import React from 'react';
import { Search, Bell, Sparkles, RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  liveStats?: {
    label: string;
    value: string | number;
    badge?: string;
  };
}

export default function DashboardHeader({ title, subtitle, liveStats }: DashboardHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
              {title}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {liveStats && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-900">{liveStats.label}:</span>
              <span className="text-xs font-extrabold text-emerald-700">{liveStats.value}</span>
              {liveStats.badge && (
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-md">
                  {liveStats.badge}
                </span>
              )}
            </div>
          )}

          <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">
            <span>Omoku, ONELGA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
