"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold">Kuch galat hua</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error.message?.includes("API")
            ? "Server se data load nahi hua. Internet ya server check karein."
            : error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">ID: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Dobara Try Karein
      </Button>
    </div>
  );
}
