import type { RelatedDirective } from '../../types';
import type { TableColumn } from '../data-table';
import { formatDateArSA, translateDirectiveStatus } from '../../utils/format';

const cellClass = 'text-sm text-[#475467]';
const fontStyle = { fontFamily: "'Almarai', sans-serif" } as const;

/**
 * Shared column definitions for "related directives" / التوجيهات المرتبطة table.
 * Used in meeting detail and other UCs that display RelatedDirective[].
 */
export function getDirectivesTableColumns(): TableColumn<RelatedDirective>[] {
  return [
    {
      id: 'index',
      header: '#',
      width: 'w-20',
      align: 'center',
      render: (_row: RelatedDirective, index: number) => (
        <span className={cellClass} style={fontStyle}>
          {index + 1}
        </span>
      ),
    },
    {
      id: 'directive_number',
      header: 'رقم التوجيه',
      width: 'w-36',
      align: 'end',
      render: (row: RelatedDirective) => (
        <span className={cellClass} style={fontStyle}>
          {row.directive_number}
        </span>
      ),
    },
    {
      id: 'directive_date',
      header: 'تاريخ التوجيه',
      width: 'w-32',
      align: 'end',
      render: (row: RelatedDirective) => (
        <span className={cellClass} style={fontStyle}>
          {formatDateArSA(row.directive_date)}
        </span>
      ),
    },
    {
      id: 'directive_text',
      header: 'نص التوجيه',
      width: 'flex-1',
      align: 'end',
      render: (row: RelatedDirective) => (
        <span className={`${cellClass} whitespace-pre-wrap`} style={fontStyle}>
          {row.directive_text || '—'}
        </span>
      ),
    },
    {
      id: 'deadline',
      header: 'الموعد النهائي',
      width: 'w-32',
      align: 'end',
      render: (row: RelatedDirective) => (
        <span className={cellClass} style={fontStyle}>
          {formatDateArSA(row.deadline)}
        </span>
      ),
    },
    {
      id: 'responsible_persons',
      header: 'المسؤولون',
      width: 'w-48',
      align: 'end',
      render: (row: RelatedDirective) => {
        const names = (row.responsible_persons ?? []).map((p) => p.name).filter(Boolean);
        return (
          <span className={cellClass} style={fontStyle}>
            {names.length ? names.join('، ') : '—'}
          </span>
        );
      },
    },
    {
      id: 'directive_status',
      header: 'الحالة',
      width: 'w-28',
      align: 'center',
      render: (row: RelatedDirective) => (
        <span className={cellClass} style={fontStyle}>
          {translateDirectiveStatus(row.directive_status)}
        </span>
      ),
    },
  ];
}
