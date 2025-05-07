import React from 'react';
import Image from 'next/image';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between pl-8">
        <div className="flex items-center gap-4">
          <Image
            src="/payai-logo.svg"
            alt="PayAI Logo"
            width={64}
            height={64}
            className="dark:invert"
          />
          <div className="flex flex-col">
            <span className="text-2xl font-semibold">PayAI</span>
            <span className="text-sm text-muted-foreground">Hire any agent for any task</span>
          </div>
        </div>
      </div>
    </header>
  );
} 