import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useConversationSplits } from '../../hooks/use-conversation-splits';
import { CaseFilesBreadcrumb } from './components/case-files-breadcrumb';
import { CaseFilesSection } from './components/case-files-section';
import { CaseDetailsHeader } from './components/case-details-header';
import { CaseDetailsTableView } from './components/case-details-table-view';
import { CaseDetailsGridView } from './components/case-details-grid-view';
import { useCaseData } from './hooks/use-case-data';
import type { ExtractionResult } from '../../hooks/use-cases';
import type { CaseDetailsTabType } from '../../components/case-details-tabs';
import type { ViewMode, EditingState } from './types';

const CaseFiles: React.FC = () => {
  const { conversation_id } = useParams<{ conversation_id: string }>();
  const [selectedTab, setSelectedTab] = useState<CaseDetailsTabType>("primary");
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  
  const { data: splits, isLoading, error, isFetching } = useConversationSplits(conversation_id);
  const isDataLoading = isLoading || isFetching;
  // Cast splits to ExtractionResult[] to satisfy useCaseData type requirements
  const extractionResults = (splits as ExtractionResult[] | undefined);
  const { caseFiles, caseDetails } = useCaseData(extractionResults, selectedTab);

  // Convert ConversationSplitsError to standard Error for component compatibility
  const standardError: Error | null = error
    ? new Error(error.message || 'حدث خطأ غير معروف')
    : null;

  useEffect(() => {
    setEditingState(null);
  }, [selectedTab]);

  const handleEdit = (detailId: string) => {
    setEditingState({ id: detailId, tab: selectedTab });
  };

  const handleSave = () => {
    setEditingState(null);
  };

  return (
    <div className="w-full min-h-full px-12 pt-8 pb-8" dir="rtl">
      <CaseFilesBreadcrumb />

      <CaseFilesSection
        files={caseFiles}
        isLoading={isDataLoading}
        error={standardError}
      />

      <CaseDetailsHeader
        selectedTab={selectedTab}
        viewMode={viewMode}
        onTabChange={setSelectedTab}
        onViewChange={setViewMode}
      />

      {viewMode === 'table' ? (
        <CaseDetailsTableView
          details={caseDetails}
          selectedTab={selectedTab}
          editingState={editingState}
          isLoading={isDataLoading}
          onEdit={handleEdit}
          onSave={handleSave}
        />
      ) : (
        <CaseDetailsGridView
          details={caseDetails}
          selectedTab={selectedTab}
          editingState={editingState}
          isLoading={isDataLoading}
          onEdit={handleEdit}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default CaseFiles;
