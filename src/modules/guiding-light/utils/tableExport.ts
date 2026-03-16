/**
 * Export table data to XLSX (same as super-agent-v1).
 */
import type { TableChartData } from "@gl/api/data-analyzer/types";

export async function exportTableAsXlsx(
  tableData: TableChartData,
  filename: string = "table",
  onError?: (message: string) => void
): Promise<void> {
  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const wsData: unknown[][] = [tableData.columns, ...tableData.rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const maxWidth = 50;
    const colWidths = tableData.columns.map((_, colIndex) => {
      const columnData = wsData.map((row) => String((row as unknown[])[colIndex] ?? ""));
      const maxLength = Math.max(...columnData.map((c) => c.length));
      return { wch: Math.min(maxLength + 2, maxWidth) };
    });
    ws["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (error: unknown) {
    console.error("Error exporting to XLSX:", error);
    const msg = "فشل تصدير XLSX";
    if (onError) onError(msg);
    else throw error;
  }
}
