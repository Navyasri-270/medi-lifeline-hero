import React from "react";
import { cn } from "@/lib/utils";

export function MobilePage({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-ambient">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <h1 className="font-display text-lg">{title}</h1>
          {action ? <div className="flex items-center gap-2">{action}</div> : <div />}
        </div>
      </header>
      <main className={cn("mx-auto max-w-md px-4 pb-24 pt-4", "animate-soft-in")}>{children}</main>
    </div>
  );
}

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-ambient">{children}</div>;
}
