import { TableRow, ColumnConfig } from "./types";

export function mapRowToPayload(
  row: TableRow,
  columns: ColumnConfig[],
  index: number
): Record<string, unknown> {
  const payload: Record<string, unknown> = { item_number: index };

  for (const col of columns) {
    payload[col.key] = row[col.key];
  }

  if (row.isExternal === false && row.object_guid) {
    payload.object_guid = row.object_guid;
  }

  if (row.id) {
    payload.id = row.id;
  }

  if (payload.is_presentation_required === undefined) {
    payload.is_presentation_required = false;
  }

  return payload;
}

export function mapAllRowsToPayload(
  rows: TableRow[],
  columns: ColumnConfig[]
): Record<string, unknown>[] {
  return rows.map((row, i) => mapRowToPayload(row, columns, i));
}
