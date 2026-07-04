import { FileDown, FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type { ReportTab } from "@/types/reports";

const exportLabels: Record<ReportTab, string> = {
  revenue: "revenue report",
  expense: "expense report",
  outstanding: "outstanding report",
  renewal: "renewal report",
};

interface ReportExportActionsProps {
  activeTab: ReportTab;
}

export function ReportExportActions({ activeTab }: ReportExportActionsProps) {
  const label = exportLabels[activeTab];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl"
        disabled
        title={`Export ${label} to Excel (coming soon)`}
      >
        <FileSpreadsheet />
        Export to Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl"
        disabled
        title={`Export ${label} to PDF (coming soon)`}
      >
        <FileDown />
        Export to PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl"
        disabled
        title={`Print ${label} (coming soon)`}
      >
        <Printer />
        Print
      </Button>
    </div>
  );
}
