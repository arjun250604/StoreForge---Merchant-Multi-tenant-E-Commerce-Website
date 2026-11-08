"use client";

import React from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintReceiptButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-xs print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="h-3.5 w-3.5" />
      Print Invoice
    </Button>
  );
}

