import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/lib/ui';
import { DirectivesList, type TypeTab } from '@/modules/shared/features/directives-list';
import { useDirectivesList } from '@/modules/shared/hooks/useDirectivesList';
import {
  DIRECTIVE_TYPE_LABELS,
  DIRECTIVE_TYPE_OPTIONS,
} from '@/modules/shared/types/minister-directive-enums';
import { CreateMinisterDirectiveModal } from './CreateMinisterDirectiveModal';

/** UC-13: الكل + جدولة + same three type tabs as UC-19 (عام / مركز الحكومة / المكتب التنفيذي). */
const UC13_TYPE_TABS: TypeTab[] = [
  { value: 'ALL', label: 'الكل' },
  { value: 'SCHEDULING', label: DIRECTIVE_TYPE_LABELS.SCHEDULING },
  ...DIRECTIVE_TYPE_OPTIONS,
];

export interface DirectivesByTypeTabsProps {
  /** Query key prefix for React Query cache (e.g. uc19-directives, uc13-directives) */
  queryKeyPrefix: string;
  /**
   * UC-19 default: tabs عام / مركز الحكومة / المكتب التنفيذي (no “all”).
   * UC-13: tabs الكل + جدولة + عام + مركز الحكومة + المكتب التنفيذي.
   */
  variant?: 'standard' | 'uc13';
}

/**
 * Minister directives list with type tabs (GENERAL / SCHEDULING / …).
 * Used by UC-19 minister-directives and UC-13 directives routes.
 */
export function DirectivesByTypeTabs({
  queryKeyPrefix,
  variant = 'standard',
}: DirectivesByTypeTabsProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const list = useDirectivesList({
    queryKeyPrefix,
    tabMode: 'type',
    defaultTypeTab: variant === 'uc13' ? undefined : 'GENERAL',
  });

  const typeTabs: TypeTab[] = variant === 'uc13' ? UC13_TYPE_TABS : DIRECTIVE_TYPE_OPTIONS;

  return (
    <>
      <DirectivesList
        title="التوجيهات"
        subtitle="إدارة ومتابعة التوجيهات الوزارية"
        total={list.total}
        tabMode="type"
        typeTabs={typeTabs}
        activeType={list.activeType}
        onTypeChange={list.handleTypeChange}
        directives={list.directives}
        isLoading={list.isLoading}
        error={list.error}
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        onPageChange={list.handlePageChange}
        statusField="scheduling_officer_status"
        headerRight={
          <Button
            type="button"
            size="sm"
            className="gap-1.5 shrink-0 bg-[#048F86] hover:bg-[#037A72] text-white"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            إضافة توجيه
          </Button>
        }
      />
      <CreateMinisterDirectiveModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => list.invalidate()}
      />
    </>
  );
}
