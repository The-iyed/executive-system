import { useState } from 'react';
import {
  DirectivesList,
} from '@/modules/shared/features/directives-list';
import { useDirectivesList } from '@/modules/shared/hooks/useDirectivesList';
import {
  DIRECTIVE_TYPE_OPTIONS,
} from '@/modules/shared/types/minister-directive-enums';
import { CreateDirectiveModal } from '../components/CreateDirectiveModal';

export default function DirectivesListPage() {
  const [showCreate, setShowCreate] = useState(false);

  const list = useDirectivesList({
    queryKeyPrefix: 'uc19-directives',
    tabMode: 'type',
    defaultTypeTab: 'GENERAL',
  });

  return (
    <>
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
      <CreateDirectiveModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}
