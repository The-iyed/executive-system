import { useState, useCallback } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { Button } from "@gl/components/ui/button";
import {
  generateChart,
  paginateStats,
  type ChartData,
  type PaginationInfo,
} from "@gl/api/data-analyzer/types";
import type { MessageResponse } from "@gl/api/types";
import { Chart } from "./Chart";

interface StatsBlockProps {
  response: MessageResponse;
  isStreaming?: boolean;
}

function getRequestId(response: MessageResponse): string | undefined {
  const info = response.debug_info as Record<string, unknown> | null;
  return info?.request_id as string | undefined;
}

function getMessageId(response: MessageResponse): string | undefined {
  const info = response.debug_info as Record<string, unknown> | null;
  return info?.message_id as string | undefined;
}

function hasAccessDeniedError(response: MessageResponse): boolean {
  const info = response.debug_info as Record<string, unknown> | null;
  if (info?.access_denied_error === true) return true;
  const text = response.response?.toLowerCase() ?? "";
  return text.includes("access denied");
}

function hasQueryError(response: MessageResponse): boolean {
  const info = response.debug_info as Record<string, unknown> | null;
  if (info?.success === false) return true;
  const text = (response.response ?? "").trim();
  if (!text) return false;
  if (text.startsWith("{") || text.includes('"success"')) {
    try {
      const parsed = JSON.parse(text) as { success?: boolean };
      if (parsed.success === false) return true;
    } catch {
      const lower = text.toLowerCase();
      if (lower.includes('"success": false') || lower.includes("'success': false"))
        return true;
    }
  }
  return false;
}

function StatsBlock({ response, isStreaming }: StatsBlockProps) {
  const requestId = getRequestId(response);
  const messageId = getMessageId(response);
  const isStats =
    response.tool_used === "stats" || response.has_chart_data === true;
  const hasChartData = response.has_chart_data === true;
  const accessDenied = hasAccessDeniedError(response);
  const queryError = hasQueryError(response);

  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [summarizedMessage, setSummarizedMessage] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limit = 100;

  const loadChart = useCallback(
    async (page: number = 1) => {
      if (!requestId) return;
      setLoading(true);
      setError(null);
      try {
        const isTablePagination =
          chartData?.chart_type === "table" && page > 1;
        const res = isTablePagination
          ? await paginateStats({
              request_id: requestId,
              message_id: messageId,
              page,
              limit,
            })
          : await generateChart({
              request_id: requestId,
              message_id: messageId,
              limit,
              page,
            });

        const raw = res as Record<string, unknown>;
        if (raw.success === false || raw.error) {
          setError((raw.error as string) || "فشل تحميل البيانات");
          return;
        }

        const chart = (raw.chart_data ?? raw.chartData) as ChartData | undefined;
        const data = chart ?? (raw as unknown as ChartData);
        if (data?.chart_type && data?.data != null) {
          setChartData(data as ChartData);
          setSummarizedMessage(
            (raw.summarized_message ?? raw.summarizedMessage) as string
          );
          const pag = (raw.pagination ?? raw.pagination) as PaginationInfo | undefined;
          if (pag) {
            setPagination({
              ...pag,
              current_page: pag.current_page ?? pag.page ?? page,
              total_pages: pag.total_pages ?? 1,
              total_items: pag.total_items ?? pag.total ?? 0,
            });
            setCurrentPage(pag.current_page ?? pag.page ?? page);
          } else {
            setCurrentPage(page);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "فشل تحميل البيانات");
      } finally {
        setLoading(false);
      }
    },
    [requestId, messageId, chartData?.chart_type]
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadChart(page);
  };

  const shouldShowButton =
    requestId &&
    !chartData &&
    hasChartData &&
    !isStreaming &&
    !accessDenied &&
    !queryError;

  if (!isStats || !hasChartData) return null;

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4" dir="rtl">
      {shouldShowButton && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-[#048F86]/30 text-[#048F86] hover:bg-[#048F86]/10"
          onClick={() => loadChart(1)}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 shrink-0 animate-spin" />
              <span>جاري التوليد...</span>
            </>
          ) : (
            <>
              <BarChart3 className="size-4 shrink-0" />
              <span>عرض الرسم البياني / الجدول</span>
            </>
          )}
        </Button>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {chartData && (
        <>
          {summarizedMessage && (
            <p className="text-sm text-muted-foreground">{summarizedMessage}</p>
          )}
          <Chart
            chartData={chartData}
            pagination={pagination}
            onPageChange={handlePageChange}
            loadingPage={loading ? currentPage : null}
            messageId={messageId}
          />
        </>
      )}
    </div>
  );
}

export { StatsBlock };
