import { FileDown, FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportExportActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" className="rounded-xl" disabled>
        <FileSpreadsheet />
        Export to Excel
      </Button>
      <Button variant="outline" size="sm" className="rounded-xl" disabled>
        <FileDown />
        Export to PDF
      </Button>
      <Button variant="outline" size="sm" className="rounded-xl" disabled>
        <Printer />
        Print
      </Button>
    </div>
  );
}
