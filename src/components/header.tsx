"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { ChatHistoryMenu } from "./ChatHistoryMenu";
import { cn } from "@/lib/utils";
import TooltipUsage from "./TooltipUsage";
import { SidebarProvider } from "@/components/ui/sidebar";

interface HeaderProps {
  chatId?: string;
}

export function Header({ chatId }: HeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <></>;

  return (
    <SidebarProvider>
      <aside
        className={cn(
          `md:flex-col md:w-[60px] md:left-0 md:top-0 items-center border-border z-30 bg-card/80 md:bg-card backdrop-blur supports-[backdrop-filter]:bg-card/60 text-foreground
          flex flex-row-reverse justify-between sticky md:fixed
          transition-transform duration-300 ease-in-out
          md:translate-y-0
          top-0 left-0 right-0
          h-[60px]
          `,

          "md:h-[calc(100vh)] border-b md:border-b-0 md:border-r"
        )}
        style={{
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {/* Icons (top on desktop, left on mobile) */}
  <div className="flex flex-row gap-2.5 text-muted-foreground md:flex-col md:gap-4 md:w-full items-center">
          <Link
            href="/"
            className="hidden items-center justify-center md:flex p-4 border-b border-border"
          >
            <img src="/logo.svg" className="min-w-[22px]" />
          </Link>

          <ChatHistoryMenu chatId={chatId} />

          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 px-0 cursor-pointer mx-auto bg-transparent border-transparent h-auto"
            >
              <img src="/new.svg" className="size-8 min-w-[32px]" />
            </Button>
          </Link>

          <div className="flex md:hidden">
            <TooltipUsage />
          </div>
        </div>
        {/* Logo (bottom on desktop, right on mobile) */}
        <Link
          href="/"
          className="flex items-center md:mt-auto md:mb-2 md:w-full justify-center md:hidden pl-4"
        >
          <img src="/logo.svg" className="size-[24px]" />
        </Link>
        <div className="hidden md:flex">
          <TooltipUsage />
        </div>
      </aside>
  {/* Spacer for mobile header height */}
  <div className={cn("block md:hidden", "min-h-[70px]")} />
  <div className={cn("hidden md:block", "min-h-[10px]")} />
    </SidebarProvider>
  );
}
