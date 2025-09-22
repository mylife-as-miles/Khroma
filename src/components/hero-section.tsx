import React from "react";
import { CodeDemo } from "@/components/CodeDemo";
import { Button } from "@/components/ui/button";
import { Upload, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
  <div className="w-full flex flex-col md:flex-row items-center md:items-start md:justify-between gap-10 px-4 sm:px-6">
      <div className="max-w-xl flex flex-col items-center md:items-start">
        <img src="/logo.svg" alt="Khroma" className="size-10 mb-6" />

        {/* Badges */}
  <div className="flex items-center divide-x divide-border mb-4 text-xs text-muted-foreground rounded-full border bg-card/70 backdrop-blur overflow-hidden">
          <div className="inline-flex items-center gap-1 px-2.5 py-1">
            <Sparkles className="size-3" />
            AI for data analysis
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1">
            <ShieldCheck className="size-3" />
            Private by default
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1">
            OpenRouter-powered
          </div>
        </div>

        {/* Title */}
        <h1 className="text-[26px] sm:text-[28px] md:text-[40px] font-semibold text-foreground text-center md:text-left leading-tight tracking-tight max-[360px]:text-[22px]">
          Ask questions of your CSVs. Get charts, code, and insight.
        </h1>

        {/* Subhead */}
        <p className="mt-4 text-slate-600 text-center md:text-left max-w-[44ch]">
          Upload a CSV, then ask a question to generate Python code and charts using pandas and matplotlib—ready to run.
        </p>

        {/* CTAs */}
        <div className="mt-6 flex items-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <a href="#upload">
              <Upload className="size-4" /> Upload CSV
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <a href="/" rel="noreferrer">
              Learn more <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </div>

      {/* Code demo */}
      <div className="hidden md:block">
  <div className="rounded-xl border shadow-sm bg-card p-2">
          <CodeDemo duration={8} delay={0.3} writing={true} cursor={true} />
        </div>
      </div>
    </div>
  );
}
