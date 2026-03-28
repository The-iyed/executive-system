import {
  DirectivesList,
} from '@/modules/shared/features/directives-list';
import { useDirectivesList } from '@/modules/shared/hooks/useDirectivesList';
import {
  DIRECTIVE_TYPE_OPTIONS,
} from '@/modules/shared/types/minister-directive-enums';

export default function DirectivesListPage() {
  const list = useDirectivesList({
    queryKeyPrefix: 'uc19-directives',
    tabMode: 'type',
    defaultTypeTab: 'GENERAL',
  });

  return (
    <DirectivesList
      title="التوجيهات"
      subtitle="إدارة ومتابعة التوجيهات الوزارية"
      total={list.total}
      tabMode="type"
      typeTabs={DIRECTIVE_TYPE_OPTIONS}
      activeType={list.activeType}
      onTypeChange={list.handleTypeChange}
      directives={list.directives}
      isLoading={list.isLoading}
      error={list.error}
      currentPage={list.currentPage}
      totalPages={list.totalPages}
      onPageChange={list.handlePageChange}
      statusField="scheduling_officer_status"
    />
  );
}
