"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import {
  Plus,
  Github,
  History,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatHistoryMenu } from "./ChatHistoryMenu";
import { useRouter } from "next/navigation";

const AppSidebarContent = ({ chatId }: { chatId?: string }) => {
  const { open, animate } = useSidebar();
  const router = useRouter();

  const links = [
    {
      label: "GitHub",
      href: "https://github.com/mylife-as-miles/askable",
      icon: (
        <Github className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  const handleNewChat = () => {
    window.location.href = "/";
  };

  return (
    <>
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {open ? <Logo /> : <LogoIcon />}
        <div className="mt-8 flex flex-col gap-2">
          {/* Custom Link for New Chat to force reload */}
          <button
            onClick={handleNewChat}
            className={cn(
              "flex items-center justify-start gap-2 group/sidebar py-2",
              "px-2" // Add padding to align with SidebarLink
            )}
          >
            <Plus className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />
            <motion.span
              animate={{
                display: animate ? (open ? "inline-block" : "none") : "inline-block",
                opacity: animate ? (open ? 1 : 0) : 1,
              }}
              className="text-sidebar-foreground text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
            >
              New Chat
            </motion.span>
          </button>

          {links.map((link, idx) => (
            <SidebarLink key={idx} link={link} />
          ))}
          {/* Special handling for ChatHistoryMenu */}
          <div className={cn("flex items-center justify-start gap-2 group/sidebar py-2")}> 
            <History className="text-sidebar-foreground h-5 w-5 flex-shrink-0 ml-2" />
            <motion.span
              animate={{
                display: animate ? (open ? "inline-block" : "none") : "inline-block",
                opacity: animate ? (open ? 1 : 0) : 1,
              }}
              className="text-sidebar-foreground text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
            >
              <ChatHistoryMenu chatId={chatId} />
            </motion.span>
          </div>
        </div>
      </div>
      <div>
        {/* The user menu from the old sidebar can be added here if needed */}
      </div>
    </>
  );
};

export function AppSidebar({ chatId }: { chatId?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <AppSidebarContent chatId={chatId} />
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-foreground py-1 relative z-20"
    >
      <img src="/logo.svg" className="h-5 w-5 flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-foreground whitespace-pre"
      >
        Askable
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-foreground py-1 relative z-20"
    >
      <img src="/logo.svg" className="h-5 w-5 flex-shrink-0" />
    </Link>
  );
};
