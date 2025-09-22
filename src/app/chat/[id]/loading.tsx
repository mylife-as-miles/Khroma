"use client";

import { Header } from "@/components/header";
import { cn } from "@/lib/utils";

export default function Loading() {
  return (
  <div className="min-h-[100svh] bg-card flex flex-col w-full md:h-screen">
      <Header />
      <div className="flex flex-col md:ml-[70px] flex-1">
        <div className="flex-1 overflow-y-auto p-4 gap-4 flex flex-col mx-auto max-w-[700px] w-full">
          {/* User bubble 1 (right) */}
          <div className={cn("flex justify-end flex-col items-end")}>
            <div
              className="flex justify-end items-center relative overflow-hidden gap-2.5 px-3 py-2 rounded bg-slate-200 border border-[#cad5e2] max-w-[240px] md:max-w-[50%] animate-pulse"
              style={{ boxShadow: "0px 0px 7px -5px rgba(0,0,0,0.25)" }}
            >
              <p className="text-sm text-left text-[#0f172b] w-24 h-4 bg-slate-300 rounded animate-pulse" />
            </div>
          </div>
          {/* Assistant bubble 1 (left) */}
          <div className={cn("flex justify-end flex-col items-start")}>
            <div className="w-full">
              <div className="text-slate-800 text-sm prose">
                <div className="w-32 h-4 bg-slate-100 rounded mb-2 animate-pulse" />
                <div className="w-48 h-4 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
          {/* User bubble 2 (right) */}
          <div className={cn("flex justify-end flex-col items-end")}>
            <div
              className="flex justify-end items-center relative overflow-hidden gap-2.5 px-3 py-2 rounded bg-slate-200 border border-[#cad5e2] max-w-[240px] md:max-w-[50%] animate-pulse"
              style={{ boxShadow: "0px 0px 7px -5px rgba(0,0,0,0.25)" }}
            >
              <p className="text-sm text-left text-[#0f172b] w-16 h-4 bg-slate-300 rounded animate-pulse" />
            </div>
          </div>
          {/* Assistant bubble 2 (left) */}
          <div className={cn("flex justify-end flex-col items-start")}>
            <div className="w-full">
              <div className="text-slate-800 text-sm prose">
                <div className="w-40 h-4 bg-slate-100 rounded mb-2 animate-pulse" />
                <div className="w-28 h-4 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
          {/* Assistant bubble 3 */}
          <div className={cn("flex justify-end flex-col items-start")}>
            <div className="w-full">
              <div className="text-slate-800 text-sm prose">
                <div className="w-36 h-4 bg-slate-100 rounded mb-2 animate-pulse" />
                <div className="w-44 h-4 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
          {/* Assistant bubble 4 */}
          <div className={cn("flex justify-end flex-col items-start")}>
            <div className="w-full">
              <div className="text-slate-800 text-sm prose">
                <div className="w-24 h-4 bg-slate-100 rounded mb-2 animate-pulse" />
                <div className="w-32 h-4 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
