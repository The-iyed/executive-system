import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Loader,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@sanad-ai/ui';
import { Home, ChevronLeft, Grid3x3, Table2 } from 'lucide-react';
import { PdfCard } from '../../components';
import { CaseDetailsTabs, type CaseDetailsTabType } from '../../components/case-details-tabs';
import { PATH } from '../../routes/path';
import { getCaseDetailsFromApi, CaseDetail } from './mockCaseFiles';
import { useConversationSplits } from '../../hooks/use-conversation-splits';

const FONT_FAMILY = '"Frutiger LT Arabic", "Cairo", "Tajawal", sans-serif';

/**
 * Format file size from bytes to readable format
 */
const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return 'غير معروف';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface DetailCardProps {
  detail: CaseDetail;
  selectedTab: CaseDetailsTabType;
  editingState: { id: string; tab: CaseDetailsTabType } | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const DetailCard: React.FC<DetailCardProps> = ({ 
  detail, 
  selectedTab,
  editingState,
  // onEdit,
  // onSave,
  // onCancel
}) => {
  // Check if this card is being edited by comparing id and tab
  const isEditing = editingState?.id === detail.id && editingState?.tab === selectedTab;
  
  const [description, setDescription] = useState(detail.description);
  
  // Update description when detail.description changes (from API) or when not editing
  useEffect(() => {
    if (!isEditing) {
      setDescription(detail.description);
    }
  }, [detail.description, isEditing]);

  // const handleSave = () => {
  //   // if selectedTab is analysis, save the description to the analysis field
  //   if (selectedTab === "analysis") {
  //     console.log("save analysis", { detail, description });
  //   }
  //   // TODO: Implement actual save logic here (API call)
  //   onSave();
  // };

  // const handleCancel = () => {
  //   setDescription(detail.description);
  //   onCancel();
  // };


  return (
    <div
      className={`bg-white rounded-[22px] p-6 transition-all duration-200 w-full box-shadow-[0_4.499px_89.98px_0_rgba(0,0,0,0.08)] ${
        isEditing ? 'h-auto' : 'h-auto'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2 min-w-0 w-full">
        <div className="flex-1 min-w-0 overflow-hidden">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3
                  className="text-base font-bold text-right text-[#101828] overflow-hidden w-full cursor-default line-clamp-2"
                  style={{ 
                    fontFamily: FONT_FAMILY,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-word'
                  }}
                >
                  {detail.title}
                </h3>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                align="start" 
                className="max-w-md bg-gray-900 text-white border-gray-700 shadow-lg"
              >
                <p className="text-right text-white" style={{ fontFamily: FONT_FAMILY }}>
                  {detail.title}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {/* <div className="flex-shrink-0 flex-grow-0">
          {!isEditing ? (
            <button
              onClick={onEdit}
              className="flex items-center justify-center w-6 h-6 p-0 border-0 bg-transparent cursor-pointer hover:opacity-80 transition-opacity"
              aria-label="تعديل"
            >
              <img src={EditIcon} alt="تعديل" className="w-6 h-6" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="flex items-center justify-center w-[70px] h-[35px] px-[15px] rounded-[5px] border-[0.2px] border-[#D8D8D8] hover:opacity-90 transition-opacity cursor-pointer"
                style={{
                  background: 'linear-gradient(0deg, #00A79D 0%, #00A79D 100%), #F8F8F8',
                }}
              >
                <span
                  className="text-white text-right text-base font-bold"
                  style={{
                    fontFamily: FONT_FAMILY,
                    lineHeight: '30.428px',
                  }}
                >
                  حفظ
                </span>
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center justify-center w-[70px] h-[35px] px-[15px] rounded-[5px] border-[0.2px] border-[#D8D8D8] hover:opacity-90 transition-opacity cursor-pointer bg-white"
              >
                <span
                  className="text-[#666] text-right text-base font-bold"
                  style={{
                    fontFamily: FONT_FAMILY,
                    lineHeight: '30.428px',
                  }}
                >
                  إلغاء
                </span>
              </button>
            </div>
          )}
        </div> */}
      </div>
      <div className="mt-2 min-w-0">
        {!isEditing ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p
                  className="text-sm text-[#475467] text-right leading-relaxed overflow-hidden text-ellipsis whitespace-nowrap cursor-default"
                  style={{
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {description}
                </p>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                align="start" 
                className="max-w-md bg-gray-900 text-white border-gray-700 shadow-lg"
              >
                <p className="text-right text-white" style={{ fontFamily: FONT_FAMILY }}>
                  {description}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full p-2 text-sm text-right text-[#666] border border-[#D8D8D8] rounded-[5px] resize-none focus:outline-none focus:ring-2 focus:ring-[#00A79D] focus:ring-offset-1"
            style={{
              fontFamily: FONT_FAMILY,
              minHeight: '60px',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          />
        )}
      </div>
    </div>
  );
};

// Table View Row Component
interface TableRowProps {
  detail: CaseDetail;
  selectedTab: CaseDetailsTabType;
  editingState: { id: string; tab: CaseDetailsTabType } | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const TableRow: React.FC<TableRowProps> = ({
  detail,
  selectedTab,
  editingState,
  // onEdit,
  // onSave,
  // onCancel
}) => {
  // Check if this row is being edited by comparing id and tab
  const isEditing = editingState?.id === detail.id && editingState?.tab === selectedTab;
  
  const [description, setDescription] = useState(detail.description);
  
  // Update description when detail.description changes (from API) or when not editing
  useEffect(() => {
    if (!isEditing) {
      setDescription(detail.description);
    }
  }, [detail.description, isEditing]);

  // const handleSave = () => {
  //   // if selectedTab is analysis, save the description to the analysis field
  //   if (selectedTab === "analysis") {
  //     console.log("save analysis", { detail, description });
  //   }
  //   // TODO: Implement actual save logic here (API call)
  //   onSave();
  // };

  // const handleCancel = () => {
  //   setDescription(detail.description);
  //   onCancel();
  // };

  return (
    <tr className="border-b border-[#EAECF0] hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 align-top w-[30%] max-w-[300px]">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3
                className="text-base font-bold text-right text-[#101828] overflow-hidden w-full cursor-default line-clamp-2"
                style={{ 
                  fontFamily: FONT_FAMILY,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  wordBreak: 'break-word'
                }}
              >
                {detail.title}
              </h3>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              align="start" 
              className="max-w-md bg-gray-900 text-white border-gray-700 shadow-lg"
            >
              <p className="text-right text-white" style={{ fontFamily: FONT_FAMILY }}>
                {detail.title}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </td>
      <td className="px-4 py-3 align-top w-[70%]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 w-full">
            {!isEditing ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p
                      className="text-sm text-[#475467] text-right leading-relaxed overflow-hidden w-full cursor-default line-clamp-3"
                      style={{
                        fontFamily: FONT_FAMILY,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'break-word'
                      }}
                    >
                      {description}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    align="start" 
                    className="max-w-md bg-gray-900 text-white border-gray-700 shadow-lg"
                  >
                    <p className="text-right text-white whitespace-pre-wrap" style={{ fontFamily: FONT_FAMILY }}>
                      {description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-2 text-sm text-right text-[#666] border border-[#D8D8D8] rounded-[5px] resize-none focus:outline-none focus:ring-2 focus:ring-[#00A79D] focus:ring-offset-1"
                style={{
                  fontFamily: FONT_FAMILY,
                  minHeight: '80px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              />
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

const CaseFiles: React.FC = () => {
  const navigate = useNavigate();
  const { conversation_id } = useParams<{ conversation_id: string }>();
  const [selectedTab, setSelectedTab] = useState<CaseDetailsTabType>("primary");
  // Track which card is being edited: stores { id, tab }
  const [editingState, setEditingState] = useState<{ id: string; tab: CaseDetailsTabType } | null>(null);
  // View mode: 'table' (default) or 'grid'
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Reset editing state when tab changes
  useEffect(() => {
    setEditingState(null);
  }, [selectedTab]);
  
  // Fetch detailed splits - returns ExtractionResult[] array
  const { data: splits, isLoading, error, isFetching } = useConversationSplits(conversation_id);
  
  // Determine if we're loading (either initial load or refetching)
  const isDataLoading = isLoading || isFetching;

  // Map splits to CaseFile format for display
  const caseFiles = useMemo(() => {
    if (!splits || !Array.isArray(splits) || splits.length === 0) return [];
    
    return splits.map((split) => ({
      id: split.split_id || '',
      name: split.pdf_filename || 'مستند غير معروف',
      size: formatFileSize(split.raw_text_length),
    }));
  }, [splits]);

  // Get case details from API based on selected tab
  const caseDetails = useMemo(() => {
    if (!splits || !Array.isArray(splits)) {
      return [];
    }
    // Extract metadata from splits if available
    // Metadata includes agent_response with analyze and case-details fields
    const metadata = (splits as any)._splitMetadata as Map<string, { 
      id?: string; 
      result?: string; 
      agent_response?: {
        result?: string;
        reasoning?: string;
        win_loss_reason_content_type?: { classification?: string; sub_classification?: string };
        main_classification_win_loss_reason?: string;
        sub_reason_win_loss?: string;
        root_cause_win_loss?: string;
        actual_description_root_cause?: string;
        workflow_steps_description?: string;
        proposed_solution_description?: string;
        proposed_solution_sub_classification?: string;
        proposed_solution_main_classification?: string;
        case_classification?: string;
        case_subject?: string;
        case_value?: string;
        actual_financial_impact?: string;
      }
    }> | undefined;
    return getCaseDetailsFromApi(splits, selectedTab, metadata);
  }, [splits, selectedTab]);

  // Handlers for card editing
  const handleEdit = (detailId: string) => {
    setEditingState({ id: detailId, tab: selectedTab });
  };

  const handleSave = () => {
    // Clear editing state after save
    setEditingState(null);
  };

  const handleCancel = () => {
    setEditingState(null);
  };

  return (
    <div className="w-full min-h-full px-12 pt-8 pb-8" dir="rtl">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList className="flex items-center gap-2">
          <BreadcrumbItem>
            <BreadcrumbLink
              href={PATH.CASES}
              onClick={(e) => {
                e.preventDefault();
                navigate(PATH.CASES);
              }}
              className="flex items-center gap-1 text-[#666] hover:text-[#1A1A1A] transition-colors"
            >
              <Home className="w-4 h-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronLeft className="w-4 h-4 text-[#666]" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage
              className="text-[#1A1A1A] font-medium"
              style={{ fontFamily: FONT_FAMILY }}
            >
              تفاصيل القضية
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Case Files Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-2xl font-bold text-right text-[#1A1A1A]"
            style={{ fontFamily: FONT_FAMILY }}
          >
            ملفات القضية
          </h2>
          {!isDataLoading && !error && caseFiles.length > 0 && (
            <p
              className="text-sm text-[#666] text-right"
              style={{ fontFamily: FONT_FAMILY }}
            >
              عدد الملفات: {caseFiles.length}
            </p>
          )}
        </div>
        <div 
          className="flex flex-col items-end gap-[24.786px] rounded-[14.872px] border-[1.239px] border-[#EAECF0] bg-white p-[29.744px] shadow-[0_1.239px_3.718px_0_rgba(16,24,40,0.10),0_1.239px_2.479px_0_rgba(16,24,40,0.06)]"
        >
          {isDataLoading ? (
            <div className="flex items-center justify-center w-full py-8">
              <Loader className="w-8 h-8 text-[#00A79D]" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center w-full py-8">
              <p
                className="text-sm text-[#DC2626] text-right"
                style={{ fontFamily: FONT_FAMILY }}
              >
                حدث خطأ في تحميل الملفات: {error.message || 'خطأ غير معروف'}
              </p>
            </div>
          ) : caseFiles.length === 0 ? (
            <div className="flex items-center justify-center w-full py-8">
              <p
                className="text-sm text-[#666] text-right"
                style={{ fontFamily: FONT_FAMILY }}
              >
                لا توجد ملفات متاحة
              </p>
            </div>
          ) : (
            <div className="flex flex-row gap-[24.786px] overflow-x-auto w-full case-files-scroll">
              {caseFiles.map((file) => (
                <PdfCard
                  key={file.id}
                  name={file.name}
                  size={file.size}
                  className="max-w-[442px]"
                />
              ))}
            </div>
          )}
          <style>{`
            .case-files-scroll {
              scrollbar-gutter: stable;
            }
            .case-files-scroll::-webkit-scrollbar {
              height: 8px;
            }
            .case-files-scroll::-webkit-scrollbar-track {
              background: transparent;
              border-radius: 15px;
            }
            .case-files-scroll::-webkit-scrollbar-thumb {
              background: #E0E0E0;
              border-radius: 15px;
            }
            .case-files-scroll::-webkit-scrollbar-thumb:hover {
              background: #D0D0D0;
            }
          `}</style>
        </div>
      </div>

      {/* Case Details Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-6 mb-4">
          <h2
            className="text-2xl font-bold text-right text-[#1A1A1A]"
            style={{ fontFamily: FONT_FAMILY }}
          >
            تفاصيل القضية
          </h2>
          <div className="flex items-center gap-4">
            {/* View Toggle Icons */}
            <div className="flex items-center gap-2 border border-[#EAECF0] rounded-[8px] p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center justify-center w-8 h-8 rounded-[6px] transition-all ${
                  viewMode === 'table'
                    ? 'bg-[#00A79D] text-white'
                    : 'bg-transparent text-[#666] hover:bg-gray-100'
                }`}
                aria-label="عرض الجدول"
              >
                <Table2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center w-8 h-8 rounded-[6px] transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#00A79D] text-white'
                    : 'bg-transparent text-[#666] hover:bg-gray-100'
                }`}
                aria-label="عرض الشبكة"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-shrink-0">
              <CaseDetailsTabs
                value={selectedTab}
                onValueChange={setSelectedTab}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Detail Cards Grid or Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[#EAECF0] overflow-hidden">
          {isDataLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-[#00A79D]" />
            </div>
          ) : caseDetails.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p
                className="text-sm text-[#666] text-right"
                style={{ fontFamily: FONT_FAMILY }}
              >
                لا توجد تفاصيل متاحة
              </p>
            </div>
          ) : (
            <table className="w-full table-fixed" dir="rtl">
              <thead className="bg-[#F9FAFB] border-b border-[#EAECF0]">
                <tr>
                  <th
                    className="px-4 py-3 text-right text-sm font-bold text-[#101828] w-[30%] max-w-[300px]"
                    style={{ fontFamily: FONT_FAMILY }}
                  >
                    العنوان
                  </th>
                  <th
                    className="px-4 py-3 text-right text-sm font-bold text-[#101828] w-[70%]"
                    style={{ fontFamily: FONT_FAMILY }}
                  >
                    الوصف
                  </th>
                </tr>
              </thead>
              <tbody>
                {caseDetails.map((detail) => (
                  <TableRow
                    key={`${detail.id}:${selectedTab}`}
                    detail={detail}
                    selectedTab={selectedTab}
                    editingState={editingState}
                    onEdit={() => handleEdit(detail.id)}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-[radial-gradient(ellipse_at_center,_#f4f4f4_0%,_#f4f4f4_45%,_#ffffff_100%)]
    shadow-[0_8px_24px_rgba(0,0,0,0.04)]
    rounded-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 min-h-[200px]">
          {isDataLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-[#00A79D]" />
            </div>
          ) : caseDetails.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <p
                className="text-sm text-[#666] text-right"
                style={{ fontFamily: FONT_FAMILY }}
              >
                لا توجد تفاصيل متاحة
              </p>
            </div>
          ) : (
            caseDetails.map((detail) => (
              <DetailCard
                key={`${detail.id}:${selectedTab}`}
                detail={detail}
                selectedTab={selectedTab}
                editingState={editingState}
                onEdit={() => handleEdit(detail.id)}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CaseFiles;