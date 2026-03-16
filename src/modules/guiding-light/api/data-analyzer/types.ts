import { apiClient } from "../client";

export interface ChartSeries {
  name: string;
  data: number[];
  color?: string;
}

export interface TableChartData {
  columns: string[];
  rows: unknown[][];
}

export interface HighchartsChartData {
  categories: string[];
  series: ChartSeries[];
  xAxisTitle?: string;
  yAxisTitle?: string;
}

export type ChartData =
  | { chart_type: "table"; data: TableChartData }
  | {
      chart_type: "bar" | "line" | "column" | "pie" | "area" | "scatter" | "spline" | "double_bar";
      data: HighchartsChartData;
    };

export interface PaginationInfo {
  page?: number;
  current_page?: number;
  limit?: number;
  page_size?: number;
  total_pages?: number;
  total?: number;
  total_items?: number;
  has_next?: boolean;
  has_prev?: boolean;
  next_page?: number | null;
  prev_page?: number | null;
}

export interface GenerateChartRequest {
  request_id: string;
  message_id?: string;
  limit?: number;
  page?: number;
}

export type GenerateChartResponse =
  | (ChartData & {
      request_id?: string;
      summarized_message?: string;
      pagination?: PaginationInfo | null;
      success?: boolean;
      error?: string | null;
    })
  | {
      request_id: string;
      chart_data: ChartData;
      summarized_message: string;
      pagination?: PaginationInfo;
    };

export interface PaginateRequest {
  request_id: string;
  message_id?: string;
  page?: number;
  limit?: number;
}

export interface PaginateResponse {
  request_id: string;
  chart_data: ChartData;
  summarized_message: string;
  pagination?: PaginationInfo;
}

export async function generateChart(
  request: GenerateChartRequest
): Promise<GenerateChartResponse> {
  return apiClient.post<GenerateChartResponse>("", "data-analyzer/chart", request);
}

export async function paginateStats(
  request: PaginateRequest
): Promise<PaginateResponse> {
  return apiClient.post<PaginateResponse>("", "data-analyzer/paginate", request);
}

/** Export table/stats as XLSX blob via API (full dataset). */
export async function exportStatsAsBlob(messageId: string): Promise<Blob> {
  return apiClient.getBlob("", `data-analyzer/export/${messageId}`, {
    accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
