import { TableRow, RowErrors, ColumnConfig, TableValidation } from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-()]{7,20}$/;

export function validateRow(row: TableRow, columns: ColumnConfig[]): RowErrors {
  const errors: RowErrors = {};

  for (const col of columns) {
    const value = row[col.key];

    if (col.required) {
      if (col.type === "checkbox") continue;
      const strVal = typeof value === "string" ? value.trim() : "";
      if (!strVal) {
        errors[col.key] = `${col.label} مطلوب`;
        continue;
      }
    }

    const strVal = typeof value === "string" ? value.trim() : "";
    if (!strVal) continue;

    if (col.type === "email" && !EMAIL_REGEX.test(strVal)) {
      errors[col.key] = "بريد إلكتروني غير صالح";
    } else if (col.type === "phone" && !PHONE_REGEX.test(strVal)) {
      errors[col.key] = "رقم هاتف غير صالح";
    } else if (col.validationRegex && !col.validationRegex.test(strVal)) {
      errors[col.key] = col.validationMessage || "قيمة غير صالحة";
    }
  }

  return errors;
}

export function validateAllRows(rows: TableRow[], columns: ColumnConfig[]): RowErrors[] {
  return rows.map((row) => validateRow(row, columns));
}

export function hasErrors(allErrors: RowErrors[]): boolean {
  return allErrors.some((e) => Object.values(e).some(Boolean));
}

export function validateTable(
  rows: TableRow[],
  validation?: TableValidation
): string | null {
  if (!validation) return null;
  const min = validation.minItems ?? (validation.required ? 1 : 0);
  if (rows.length < min) {
    return validation.errorMessage || "يجب إضافة عنصر واحد على الأقل";
  }
  return null;
}
