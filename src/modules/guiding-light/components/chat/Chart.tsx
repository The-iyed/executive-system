/**
 * Chart component – same logic and behavior as super-agent-v1 Chart.
 * Renders table or Highcharts (bar, line, column, pie, etc.) with export and tabs.
 */
import React, { useMemo, useState, useEffect, useRef } from "react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import { Download, FileSpreadsheet, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import type { ChartData, PaginationInfo } from "@gl/api/data-analyzer/types";
import { exportStatsAsBlob } from "@gl/api/data-analyzer/types";
import { exportTableAsXlsx } from "@gl/utils/tableExport";

(async () => {
  try {
    const exportingModule = await import("highcharts/modules/exporting");
    const exportDataModule = await import("highcharts/modules/export-data");
    const exporting = (exportingModule as { default?: (h: typeof Highcharts) => void })?.default;
    const exportData = (exportDataModule as { default?: (h: typeof Highcharts) => void })?.default;
    if (typeof exporting === "function") exporting(Highcharts);
    if (typeof exportData === "function") exportData(Highcharts);
  } catch {
    // ignore
  }
})();

const FONT_FAMILY = "'Somar Sans', 'IBM Plex Sans Arabic', Arial, sans-serif";

function rtlLabelHtml(text: string): string {
  return `<span dir="rtl" lang="ar" style="display:inline-block;text-align:inherit">${String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")}</span>`;
}

const THEME_COLORS = {
  light: { bgSurface: "#ffffff", textPrimary: "#020202", borderColor: "#ececec" },
  dark: { bgSurface: "#1a1d27", textPrimary: "#e8eaf0", borderColor: "#2e323f" },
} as const;

type HighchartsChartType = "bar" | "line" | "column" | "pie" | "area" | "scatter" | "spline" | "double_bar";
const CHART_TYPES: HighchartsChartType[] = ["bar", "line", "column", "pie", "area", "scatter", "spline", "double_bar"];

const CHART_TYPE_LABELS: Record<string, string> = {
  bar: "شريطي",
  line: "خطي",
  column: "أعمدة",
  pie: "دائري",
  area: "منطقة",
  scatter: "مبعثر",
  spline: "منحني",
  double_bar: "شريطي مزدوج",
  table: "جدول",
};

export interface ChartProps {
  chartData: ChartData;
  pagination?: PaginationInfo | null;
  onPageChange?: (page: number) => void;
  loadingPage?: number | null;
  messageId?: string;
}

export function Chart({ chartData, pagination, onPageChange, loadingPage, messageId }: ChartProps) {
  const direction: "rtl" | "ltr" = "rtl";
  const theme: "light" | "dark" = "light";
  const colors = THEME_COLORS[theme];

  const [selectedChartType, setSelectedChartType] = useState<string>(chartData.chart_type);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportApiPending, setExportApiPending] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const chartRef = useRef<HighchartsReact.RefObject>(null);

  useEffect(() => {
    setSelectedChartType(chartData.chart_type);
  }, [chartData]);

  useEffect(() => {
    const chart = chartRef.current?.chart;
    if (!chart) return;
    chart.update(
      {
        chart: { backgroundColor: colors.bgSurface, plotBackgroundColor: colors.bgSurface, style: { color: colors.textPrimary } },
        tooltip: { backgroundColor: colors.bgSurface, borderColor: colors.borderColor, style: { color: colors.textPrimary } },
        legend: { itemStyle: { color: colors.textPrimary } },
        xAxis: { labels: { style: { color: colors.textPrimary } }, lineColor: colors.borderColor, tickColor: colors.borderColor },
        yAxis: { labels: { style: { color: colors.textPrimary } }, title: { style: { color: colors.textPrimary } }, gridLineColor: colors.borderColor },
      },
      true,
      true
    );
  }, [theme, colors]);

  useEffect(() => {
    if (!showExportMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        exportMenuRef.current &&
        exportButtonRef.current &&
        !exportMenuRef.current.contains(e.target as Node) &&
        !exportButtonRef.current.contains(e.target as Node)
      )
        setShowExportMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showExportMenu]);

  const showNotification = (message: string, type: "error" | "success" = "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleExportTable = async (format: "xlsx", tableData: { columns: string[]; rows: unknown[][] }) => {
    const filename = `table-${Date.now()}`;
    setShowExportMenu(false);
    try {
      await exportTableAsXlsx(tableData, filename, showNotification);
      showNotification("تم تصدير الجدول XLSX", "success");
    } catch {
      showNotification("فشل تصدير الجدول", "error");
    }
  };

  const handleExportTableViaApi = async () => {
    if (!messageId) return;
    setShowExportMenu(false);
    setExportApiPending(true);
    try {
      const blob = await exportStatsAsBlob(messageId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `table-export-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification("تم تصدير الجدول", "success");
    } catch {
      showNotification("فشل تصدير الجدول", "error");
    } finally {
      setExportApiPending(false);
    }
  };

  const chartTabs: { title: string; value: string }[] = useMemo(() => {
    if (chartData.chart_type === "table") return [];
    return [
      ...CHART_TYPES.map((type) => ({ title: CHART_TYPE_LABELS[type] ?? type, value: type })),
      { title: CHART_TYPE_LABELS.table, value: "table" },
    ];
  }, [chartData.chart_type]);

  const tableData = useMemo(() => {
    if (chartData.chart_type === "table") return chartData.data;
    if (selectedChartType === "table" && chartData.data && "categories" in chartData.data) {
      const d = chartData.data;
      const columns = [d.xAxisTitle || "الفئة", ...d.series.map((s) => s.name)];
      const rows = (d.categories ?? []).map((cat, i) => [cat, ...d.series.map((s) => s.data[i])]);
      return { columns, rows };
    }
    return null;
  }, [chartData, selectedChartType]);

  const highchartsOptions: Highcharts.Options | null = useMemo(() => {
    if (chartData.chart_type === "table" || selectedChartType === "table") return null;
    const highchartsData = chartData.data;
    if (!("categories" in highchartsData) || !highchartsData.series?.length) return null;

    const chartType = (selectedChartType as HighchartsChartType) || chartData.chart_type;
    const isPieChart = chartType === "pie";
    const isRtl = direction === "rtl";

    let filteredCategories: string[] = [];
    let filteredSeriesData: Array<{ name: string; data: (number | null)[]; color?: string }> = [];
    if (!isPieChart && highchartsData.categories && highchartsData.series.length > 0) {
      highchartsData.categories.forEach((category, categoryIndex) => {
        const hasData = highchartsData.series.some(
          (s) => s.data[categoryIndex] != null
        );
        if (hasData) {
          filteredCategories.push(category);
          highchartsData.series.forEach((series, seriesIndex) => {
            if (!filteredSeriesData[seriesIndex]) {
              filteredSeriesData[seriesIndex] = { name: series.name, data: [], color: series.color };
            }
            filteredSeriesData[seriesIndex].data.push(series.data[categoryIndex] ?? null);
          });
        }
      });
    }
    const categoriesToUse = filteredCategories.length > 0 ? filteredCategories : highchartsData.categories;
    const seriesToUse = filteredSeriesData.length > 0 ? filteredSeriesData : highchartsData.series;

    let pieChartData: Array<{ name: string; y: number }> | null = null;
    if (isPieChart && highchartsData.categories && highchartsData.series.length > 0) {
      const first = highchartsData.series[0];
      pieChartData = highchartsData.categories
        .map((cat, i) => ({ name: cat, y: first.data[i] ?? 0 }))
        .filter((item) => item.y > 0);
    }

    const isBarChart = chartType === "bar" || chartType === "double_bar";
    const categoryCount = categoriesToUse?.length ?? 0;

    const baseOptions: Highcharts.Options = {
      chart: {
        type: (chartType === "double_bar" ? "bar" : chartType) as "bar" | "line" | "column" | "pie" | "area" | "scatter" | "spline",
        height: isBarChart ? Math.max(500, categoryCount * 42) : isPieChart ? 480 : undefined,
        marginLeft: isBarChart ? 220 : undefined,
        marginRight: isBarChart ? 100 : undefined,
        backgroundColor: colors.bgSurface,
        plotBackgroundColor: colors.bgSurface,
        style: { fontFamily: FONT_FAMILY, color: colors.textPrimary, ...(isRtl && { direction: "rtl" }) },
      },
      title: { text: undefined },
      credits: { enabled: false },
      ...(!isPieChart && {
        xAxis: {
          categories: categoriesToUse,
          title: { text: null },
          labels: {
            style: { color: colors.textPrimary },
            ...(isRtl && { useHTML: true, align: "right", style: { textAlign: "right", color: colors.textPrimary }, formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) { return rtlLabelHtml(this.value as string); } }),
          },
          lineColor: colors.borderColor,
          tickColor: colors.borderColor,
        },
        yAxis: {
          min: 0,
          title: { text: highchartsData.yAxisTitle ?? undefined, align: "high", style: { color: colors.textPrimary } },
          labels: {
            style: { color: colors.textPrimary },
            ...(isRtl && { useHTML: true, align: "right", formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) { return rtlLabelHtml(String(this.value ?? "")); } }),
          },
          gridLineColor: colors.borderColor,
        },
      }),
      series:
        isPieChart && pieChartData && pieChartData.length > 0
          ? [{ name: highchartsData.series[0]?.name ?? "", data: pieChartData, type: "pie" } as Highcharts.SeriesPieOptions]
          : (seriesToUse.map((s) => ({
              name: s.name,
              data: s.data,
              type: chartType === "double_bar" ? "bar" : chartType,
              ...(s.color && { color: s.color }),
            })) as Highcharts.SeriesOptionsType[]),
      legend: { enabled: seriesToUse.length > 1, itemStyle: { color: colors.textPrimary }, ...(isRtl && { rtl: true, useHTML: true }) },
      tooltip: {
        enabled: true,
        shared: !isPieChart,
        valueDecimals: 2,
        padding: 12,
        backgroundColor: colors.bgSurface,
        borderColor: colors.borderColor,
        useHTML: true,
        style: { color: colors.textPrimary },
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true,
            crop: false,
            overflow: "allow",
            align: isRtl ? "left" : "right",
            style: { color: colors.textPrimary },
            ...(isRtl && { useHTML: true, formatter: function (this: Highcharts.Point) { return rtlLabelHtml(String(this.y ?? "")); } }),
          },
          groupPadding: 0.1,
        },
        column: {
          dataLabels: { enabled: true, crop: false, overflow: "allow", style: { color: colors.textPrimary }, ...(isRtl && { useHTML: true, formatter: function (this: Highcharts.Point) { return rtlLabelHtml(String(this.y ?? "")); } }) },
          groupPadding: 0.1,
        },
        pie: {
          dataLabels: { enabled: true, style: { color: colors.textPrimary }, ...(isRtl && { useHTML: true, formatter: function (this: Highcharts.Point) { return rtlLabelHtml(this.name ?? ""); } }) },
        },
      },
      exporting: { enabled: true, fallbackToExportServer: false, buttons: { contextButton: { enabled: false } }, ...(isRtl && { allowHTML: true }) },
    };
    return baseOptions;
  }, [chartData, selectedChartType, direction, colors]);

  const currentPage = pagination?.current_page ?? pagination?.page ?? 1;
  const totalPages = pagination?.total_pages ?? 1;

  if (chartData.chart_type === "table" || selectedChartType === "table") {
    const dataToRender = chartData.chart_type === "table" ? chartData.data : tableData;
    if (!dataToRender) return null;

    return (
      <div className="mt-3 space-y-3 rounded-2xl border border-border bg-muted/30 p-4" dir="rtl">
        {notification && (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${notification.type === "error" ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-700 dark:text-green-400"}`}>
            {notification.message}
          </div>
        )}
        {chartTabs.length > 0 && chartData.chart_type !== "table" && (
          <div className="flex flex-wrap gap-1">
            {chartTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedChartType(tab.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${selectedChartType === tab.value ? "bg-[#048F86] text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {tab.title}
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <div className="relative" ref={exportMenuRef}>
            <button
              ref={exportButtonRef}
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Download className="size-4" />
              تصدير الجدول
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-background py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => (messageId ? handleExportTableViaApi() : handleExportTable("xlsx", dataToRender))}
                  disabled={!!(messageId && exportApiPending)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                >
                  <FileSpreadsheet className="size-4" />
                  {messageId && exportApiPending ? "جاري التصدير..." : "XLSX"}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[400px] text-right text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {dataToRender.columns.map((col, i) => (
                  <th key={i} className="px-3 py-2 font-medium text-foreground">
                    {String(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(dataToRender.rows ?? []).map((row, ri) => (
                <tr key={ri} className="border-b border-border/70 last:border-0">
                  {(row as unknown[]).map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-muted-foreground">
                      {String(cell ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && onPageChange && (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loadingPage != null}
              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              <ChevronRight className="size-4" />
            </button>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loadingPage != null}
              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!highchartsOptions) return null;

  const downloadOptions = [
    { text: "PNG", type: "image/png" },
    { text: "JPEG", type: "image/jpeg" },
    { text: "PDF", type: "application/pdf" },
    { text: "SVG", type: "image/svg+xml" },
  ];

  const handleDownload = async (type: string) => {
    if (!chartRef.current?.chart) return;
    setIsDownloading(true);
    const chart = chartRef.current.chart;
    try {
      if (type === "application/pdf") {
        const html2canvas = (await import("html2canvas")).default;
        const { jsPDF } = await import("jspdf");
        const containerRef = (chartRef.current as unknown as { container?: { current?: HTMLElement } })?.container;
        const chartEl: HTMLElement | null = containerRef?.current ?? (containerRef as unknown as HTMLElement) ?? null;
        if (!chartEl) throw new Error("Chart container not found");
        const hcContainer = chartEl.querySelector(".highcharts-container") as HTMLElement ?? chartEl;
        const clone = hcContainer.cloneNode(true) as HTMLElement;
        clone.style.position = "absolute";
        clone.style.left = "-99999px";
        clone.style.overflow = "visible";
        document.body.appendChild(clone);
        const canvas = await html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        document.body.removeChild(clone);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? "landscape" : "portrait", unit: "px", format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`chart-${selectedChartType}-${Date.now()}.pdf`);
        return;
      }
      (chart as Highcharts.Chart & { exportChart: (opts: unknown, cb?: () => void) => void }).exportChart(
        { type: type as Highcharts.ExportingMimeTypeValue, filename: `chart-${Date.now()}`, backgroundColor: "#ffffff" },
        () => {}
      );
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-border bg-muted/30 p-4" dir={direction}>
      {chartTabs.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {chartTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedChartType(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${selectedChartType === tab.value ? "bg-[#048F86] text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {tab.title}
            </button>
          ))}
        </div>
      )}
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setIsDownloadMenuOpen((o) => !o)}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {isDownloading ? "جاري التحميل..." : "تحميل"}
        </button>
        {isDownloadMenuOpen && !isDownloading && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-background py-1 shadow-lg">
            {downloadOptions.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => { handleDownload(opt.type); setIsDownloadMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              >
                {opt.text}
              </button>
            ))}
          </div>
        )}
      </div>
      <HighchartsReact ref={chartRef} highcharts={Highcharts} options={highchartsOptions} updateArgs={[true, true, true]} />
    </div>
  );
}
