type TableErrors = Record<string, Record<string, string>>;

export function getTableErrorList(
  errors: TableErrors = {},
  rows: { id: string }[]
) {
  const result: Record<string, number[]> = {};

  // map rowId -> item number
  const rowIndexMap = new Map<string, number>();
  rows.forEach((row, index) => {
    rowIndexMap.set(row.id, index + 1);
  });

  Object.entries(errors).forEach(([rowId, fields]) => {
    const itemNumber = rowIndexMap.get(rowId);
    if (!itemNumber) return;

    Object.values(fields).forEach((message) => {
      if (!message) return;

      if (!result[message]) {
        result[message] = [];
      }

      result[message].push(itemNumber);
    });
  });

  return result;
}