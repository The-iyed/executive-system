/**
 * Main hook for UC05 Content Request Detail page.
 * Encapsulates: data fetching, mutations, form state, computed values, tab logic.
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth';
import { MeetingStatus } from '@/modules/shared/types';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import {
  getContentRequestById,
  submitContentReturn,
  submitContentConsultation,
  completeContentConsultation,
  getContentConsultants,
  approveContent,
  listActions,
  analyzeContradictions,
  getAttachmentInsightsWithPolling,
  runCompareByAttachment,
  getContentDirectives,
  createContentDirective,
  updateContentDirective,
  deleteContentDirective,
  type ActionItem,
  type ConsultantUser,
  type DirectiveForApprove,
  type AnalyzeResponse,
  type ComparePresentationsResponse,
  type ContentRequestDetailResponse,
  type ContentDirective,
  type CreateContentDirectivePayload,
  type UpdateContentDirectivePayload,
} from '../../../data/contentApi';
import {
  getConsultationRecordsWithParams,
  getSuggestedActions,
  type ConsultationRecord,
} from '../../../../UC02/data/meetingsApi';
import { postMeetingsMatch } from '../../../../shared/api/meetings';
import { PATH } from '../../../routes/paths';
import { getStatusLabel, normalizeAssignees } from '../utils';
import type { OptionType } from '@/modules/shared/components';

export function useContentRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /* ── Tab state ── */
  const [activeTab, setActiveTab] = useState<string>('request-info');

  /* ── Modal states ── */
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResponse | null>(null);
  const [analyzingRecordId, setAnalyzingRecordId] = useState<string | null>(null);
  const [returnNotes, setReturnNotes] = useState('');

  /* ── Consultation state ── */
  const [consultationNotes, setConsultationNotes] = useState('');
  const [selectedConsultantId, setSelectedConsultantId] = useState('');
  const [consultantSearch, setConsultantSearch] = useState('');
  const [showConsultantPicker, setShowConsultantPicker] = useState(false);

  /* ── Content tab: compare & insights ── */
  const [insightsModalAttachment, setInsightsModalAttachment] = useState<{ id: string; file_name: string } | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareResult, setCompareResult] = useState<ComparePresentationsResponse | null>(null);
  const [compareErrorDetail, setCompareErrorDetail] = useState<string | null>(null);
  const insightsAbortControllerRef = useRef<AbortController | null>(null);

  /* ── Content tab: directives ── */
  const [aiDirectivesSuggestions, setAiDirectivesSuggestions] = useState<
    Array<{ id: string; directive_text: string; responsible_entity: string; due_date: string; status: string }>
  >([]);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);
  const [editableAiDirectives, setEditableAiDirectives] = useState<
    Record<string, { directive_text: string; responsible_entity: string; due_date: string; status: string }>
  >({});
  const [deletedExistingDirectiveIds, setDeletedExistingDirectiveIds] = useState<Set<string>>(new Set());
  const [deletedSuggestedActionIds, setDeletedSuggestedActionIds] = useState<Set<string>>(new Set());
  const [aiDirectiveActions, setAiDirectiveActions] = useState<Record<string, ActionItem>>({});
  const [manualAddedActions, setManualAddedActions] = useState<ActionItem[]>([]);
  const [addDirectiveSelectValue, setAddDirectiveSelectValue] = useState<OptionType | null>(null);
  const [showAddDirectiveRow, setShowAddDirectiveRow] = useState(false);
  const addDirectiveActionMapRef = useRef<Map<string, ActionItem>>(new Map());
  const [manualActionEdits, setManualActionEdits] = useState<
    Record<number, { due_date?: string | null; status?: string; assignees?: string[] }>
  >({});
  const [assigneeInputByActionId, setAssigneeInputByActionId] = useState<Record<number, string>>({});
  const directiveDueDateFromDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  /* ── Content tab: executive summary ── */
  const [executiveSummaryFile, setExecutiveSummaryFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [guidanceNotes, setGuidanceNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Preview drawer ── */
  const [previewAttachment, setPreviewAttachment] = useState<{
    blob_url: string; file_name: string; file_type?: string;
  } | null>(null);

  /* ── Actions bar ── */
  const [actionsBarOpen, setActionsBarOpen] = useState(false);

  /* ── Queries ── */
  const { data: contentRequest, isLoading, error } = useQuery({
    queryKey: ['content-request', id],
    queryFn: () => getContentRequestById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (contentRequest?.id || id) {
      trackEvent('UC-05', 'uc05_content_request_detail_viewed', { content_request_id: contentRequest?.id ?? id });
    }
  }, [contentRequest?.id, id]);

  const rawMeetingId = contentRequest?.meeting_id ?? contentRequest?.meeting?.meeting_id ?? contentRequest?.meeting?.id ?? id;
  const suggestedActionsMeetingId = rawMeetingId != null && String(rawMeetingId).trim() !== '' ? String(rawMeetingId).trim() : null;

  /* ── Content Directives CRUD query + mutations ── */
  const { data: contentDirectives = [], isLoading: isLoadingContentDirectives } = useQuery({
    queryKey: ['content-directives', id],
    queryFn: () => getContentDirectives(id!),
    enabled: !!id,
  });

  const createDirectiveMutation = useMutation({
    mutationFn: (data: CreateContentDirectivePayload) => createContentDirective(id!, data),
    onMutate: async (newDirective) => {
      await queryClient.cancelQueries({ queryKey: ['content-directives', id] });
      const prev = queryClient.getQueryData<ContentDirective[]>(['content-directives', id]);
      const optimistic: ContentDirective = { id: newDirective.id ?? -(Date.now()), title: newDirective.title, due_date: newDirective.due_date, assignees: newDirective.assignees, status: newDirective.status };
      queryClient.setQueryData<ContentDirective[]>(['content-directives', id], (old) => [...(old ?? []), optimistic]);
      return { prev };
    },
    onSuccess: () => { toast.success('تم إضافة التوجيه بنجاح'); },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(['content-directives', id], context.prev);
      toast.error('فشل إضافة التوجيه');
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['content-directives', id] }); },
  });

  const updateDirectiveMutation = useMutation({
    mutationFn: ({ directiveId, data }: { directiveId: number; data: UpdateContentDirectivePayload }) =>
      updateContentDirective(id!, directiveId, data),
    onMutate: async ({ directiveId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['content-directives', id] });
      const prev = queryClient.getQueryData<ContentDirective[]>(['content-directives', id]);
      queryClient.setQueryData<ContentDirective[]>(['content-directives', id], (old) =>
        (old ?? []).map((d) => d.id === directiveId ? { ...d, ...data } : d)
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(['content-directives', id], context.prev);
      toast.error('فشل تحديث التوجيه');
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['content-directives', id] }); },
  });

  const deleteDirectiveMutation = useMutation({
    mutationFn: (directiveId: number) => deleteContentDirective(id!, directiveId),
    onMutate: async (directiveId) => {
      await queryClient.cancelQueries({ queryKey: ['content-directives', id] });
      const prev = queryClient.getQueryData<ContentDirective[]>(['content-directives', id]);
      queryClient.setQueryData<ContentDirective[]>(['content-directives', id], (old) =>
        (old ?? []).filter((d) => d.id !== directiveId)
      );
      return { prev };
    },
    onSuccess: () => { toast.success('تم حذف التوجيه بنجاح'); },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(['content-directives', id], context.prev);
      toast.error('فشل حذف التوجيه');
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['content-directives', id] }); },
  });

  const { data: suggestedActionsData } = useQuery({
    queryKey: ['business-cards-suggested-actions', suggestedActionsMeetingId],
    queryFn: () => getSuggestedActions(suggestedActionsMeetingId!, { skip: 0, limit: 100 }),
    enabled: !!suggestedActionsMeetingId,
  });

  const suggestedActionsItems: Array<{
    id: number | string; meeting_id?: number; title: string; due_date?: string | null;
    assignees?: string; status?: string; is_completed?: boolean; completed_at?: string | null;
    created_at?: string; updated_at?: string;
  }> = Array.isArray(suggestedActionsData)
    ? suggestedActionsData
    : ((Array.isArray((suggestedActionsData as any)?.items)
        ? (suggestedActionsData as any).items
        : []) as any[]);

  const hasSuggestedActions =
    suggestedActionsItems.length > 0 ||
    (Array.isArray(suggestedActionsData?.items) && (suggestedActionsData?.items?.length ?? 0) > 0) ||
    ((suggestedActionsData as any)?.total ?? 0) > 0;

  const { data: consultationRecords, isLoading: isLoadingConsultationRecords } = useQuery({
    queryKey: ['consultation-records', id],
    queryFn: () => getConsultationRecordsWithParams(id!, { include_drafts: false, skip: 0, limit: 100 }),
    enabled: !!id && activeTab === 'directives-log',
  });

  const { data: consultationRecordsWithDrafts, isLoading: isLoadingConsultationRecordsWithDrafts } = useQuery({
    queryKey: ['consultation-records-with-drafts', id],
    queryFn: () => getConsultationRecordsWithParams(id!, { include_drafts: true, skip: 0, limit: 100 }),
    enabled: !!id,
  });

  const draftsRecords = consultationRecordsWithDrafts?.items?.filter(
    (item) =>
      item.is_draft ||
      (!item.consultation_answers?.length && !item.assignees?.some((a) => a.answers?.length)) ||
      item.consultation_answers?.some((a) => a.is_draft),
  ) || [];

  const { data: consultantsResponse, isLoading: isLoadingConsultants } = useQuery({
    queryKey: ['content-consultants', consultantSearch],
    queryFn: () => getContentConsultants({ search: consultantSearch || '', role_code: 'CONTENT_CONSULTANT', user_code: '', skip: 0, limit: 50 }),
    enabled: showConsultantPicker,
  });
  const consultants: ConsultantUser[] = consultantsResponse?.items || [];

  /* ── Mutations ── */
  const insightsMutation = useMutation({
    mutationFn: ({ attachmentId, signal }: { attachmentId: string; signal?: AbortSignal }) =>
      getAttachmentInsightsWithPolling(attachmentId, { signal }),
    onError: () => {},
  });

  const compareByAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => runCompareByAttachment(attachmentId),
    onSuccess: (data) => { setCompareResult(data); setCompareErrorDetail(null); setIsCompareModalOpen(true); },
    onError: (error: unknown) => {
      setCompareResult(null);
      const err = error as { response?: { data?: { detail?: string } }; detail?: string };
      const detail = typeof err?.response?.data?.detail === 'string' ? err.response.data.detail : typeof err?.detail === 'string' ? err.detail : null;
      setCompareErrorDetail(detail);
      setIsCompareModalOpen(true);
    },
  });

  const submitReturnMutation = useMutation({
    mutationFn: (data: { content_notes: string }) => {
      if (!id) throw new Error('Meeting request ID is required');
      return submitContentReturn(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-request', id] });
      queryClient.invalidateQueries({ queryKey: ['content-requests'] });
      setReturnNotes('');
      setIsReturnModalOpen(false);
      navigate(PATH.CONTENT_REQUESTS);
    },
    onError: (error) => console.error('Error submitting return:', error),
  });

  const submitConsultationMutation = useMutation({
    mutationFn: (data: { consultant_user_id: string; consultation_question: string; is_draft?: boolean; consultant_display_name?: string }) => {
      if (!id) throw new Error('Meeting request ID is required');
      return submitContentConsultation(id, {
        consultant_user_id: data.consultant_user_id,
        consultation_question: data.consultation_question,
        is_draft: data.is_draft,
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['consultation-records', id] });
      await queryClient.cancelQueries({ queryKey: ['consultation-records-with-drafts', id] });
      const prevRecords = queryClient.getQueryData<{ items: ConsultationRecord[]; total: number; skip: number; limit: number; has_next: boolean; has_previous: boolean }>(['consultation-records', id]);
      const prevRecordsWithDrafts = queryClient.getQueryData<{ items: ConsultationRecord[]; total: number; skip: number; limit: number; has_next: boolean; has_previous: boolean }>(['consultation-records-with-drafts', id]);
      const consultantName = variables.consultant_display_name?.trim() || contentRequest?.submitter_name || 'مستشار';
      const optimisticRecord: ConsultationRecord = {
        id: `optimistic-${Date.now()}`, type: 'CONTENT', question: variables.consultation_question,
        round_number: 1, requested_at: new Date().toISOString(),
        status: variables.is_draft ? 'DRAFT' : 'PENDING', is_draft: variables.is_draft ?? false,
        assignees: [{ user_id: variables.consultant_user_id, name: consultantName, role: null, status: variables.is_draft ? 'DRAFT' : 'PENDING', responded_at: null, request_number: null, answers: [] }],
      };
      const appendToCache = (key: readonly unknown[], prev: typeof prevRecords) => {
        const prevItems = prev?.items ?? [];
        queryClient.setQueryData(key, { items: [...prevItems, optimisticRecord], total: (prev?.total ?? 0) + 1, skip: prev?.skip ?? 0, limit: prev?.limit ?? 100, has_next: prev?.has_next ?? false, has_previous: prev?.has_previous ?? false });
      };
      appendToCache(['consultation-records-with-drafts', id], prevRecordsWithDrafts);
      if (!variables.is_draft) appendToCache(['consultation-records', id], prevRecords);
      setConsultationNotes(''); setSelectedConsultantId(''); setConsultantSearch('');
      return { prevRecords, prevRecordsWithDrafts };
    },
    onSuccess: (_data, variables) => { toast.success(variables.is_draft ? 'تم حفظ المسودة بنجاح' : 'تم إرسال الاستشارة بنجاح'); },
    onError: (error, _variables, context) => {
      if (context?.prevRecords != null) queryClient.setQueryData(['consultation-records', id], context.prevRecords);
      if (context?.prevRecordsWithDrafts != null) queryClient.setQueryData(['consultation-records-with-drafts', id], context.prevRecordsWithDrafts);
      const err = error as { response?: { data?: { message?: string; detail?: string } }; message?: string };
      const message = err?.response?.data?.message ?? err?.response?.data?.detail ?? (err instanceof Error ? err.message : String(error));
      toast.error(`فشل إرسال الاستشارة: ${message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['content-request', id] });
      queryClient.invalidateQueries({ queryKey: ['content-requests'] });
      queryClient.invalidateQueries({ queryKey: ['consultation-records', id] });
      queryClient.invalidateQueries({ queryKey: ['consultation-records-with-drafts', id] });
    },
  });

  const publishDraftMutation = useMutation({
    mutationFn: (consultationId: string) => {
      if (!id) throw new Error('Meeting request ID is required');
      return completeContentConsultation(id, consultationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-request', id] });
      queryClient.invalidateQueries({ queryKey: ['content-requests'] });
      queryClient.invalidateQueries({ queryKey: ['consultation-records-with-drafts', id] });
      queryClient.invalidateQueries({ queryKey: ['consultation-records', id] });
      setIsDraftsModalOpen(false);
      navigate(PATH.CONTENT_REQUESTS);
    },
    onError: (error) => console.error('Error publishing draft:', error),
  });

  const sendToSchedulingMutation = useMutation({
    mutationFn: async (data: { file: File; notes?: string; directives?: DirectiveForApprove[] }) => {
      if (!id) throw new Error('Meeting request ID is required');
      return approveContent(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-request', id] });
      queryClient.invalidateQueries({ queryKey: ['content-requests'] });
      setExecutiveSummaryFile(null); setGuidanceNotes('');
      setAiDirectivesSuggestions([]); setEditableAiDirectives({});
      setAiDirectiveActions({}); setManualAddedActions([]);
      setManualActionEdits({}); setAssigneeInputByActionId({});
      setShowAddDirectiveRow(false);
      navigate(PATH.CONTENT_REQUESTS);
    },
    onError: (error) => console.error('Error sending to scheduling officer:', error),
  });

  const analyzeContradictionsMutation = useMutation({
    mutationFn: (sentences: string[]) => analyzeContradictions(sentences),
    onSuccess: (data) => { setAnalyzeResult(data); setIsAnalyzeModalOpen(true); setAnalyzingRecordId(null); },
    onError: () => { setAnalyzeResult(null); setIsAnalyzeModalOpen(true); setAnalyzingRecordId(null); },
  });

  useEffect(() => {
    if (sendToSchedulingMutation.isPending) setActionsBarOpen(true);
  }, [sendToSchedulingMutation.isPending]);

  /* ── File upload handlers ── */
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  const MAX_FILE_SIZE = 20 * 1024 * 1024;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = Array.from(e.dataTransfer.files)[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) { console.error('File size exceeds 20MB'); return; }
    if (!ALLOWED_TYPES.includes(file.type)) { console.error('File type not allowed'); return; }
    setExecutiveSummaryFile(file);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) { console.error('File size exceeds 20MB'); return; }
    if (!ALLOWED_TYPES.includes(file.type)) { console.error('File type not allowed'); return; }
    setExecutiveSummaryFile(file);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setExecutiveSummaryFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  /* ── AI Directives handlers ── */
  const handleRequestAiDirectives = useCallback(async () => {
    if (!id) return;
    setIsLoadingAiSuggestions(true);
    try {
      const { results } = await postMeetingsMatch(id);
      const suggestedFromAllResults = (results || []).flatMap((r) => r.suggested_actions_written || []);
      const formattedSuggestions = suggestedFromAllResults.map((item, index) => ({
        id: `ai-match-${item.uep_id}-${index}-${item.title?.slice(0, 20) ?? ''}`,
        directive_text: item.title ?? '',
        responsible_entity: '',
        due_date: '',
        status: item.status ?? (item.success ? 'written' : 'pending'),
      }));
      setAiDirectivesSuggestions((prev) => [...prev, ...formattedSuggestions]);
      const editableState: Record<string, { directive_text: string; responsible_entity: string; due_date: string; status: string }> = {};
      formattedSuggestions.forEach((s) => { editableState[s.id] = { directive_text: s.directive_text, responsible_entity: s.responsible_entity, due_date: s.due_date, status: s.status }; });
      setEditableAiDirectives((prev) => ({ ...prev, ...editableState }));
      const actionEntries: Array<{ id: string; action: ActionItem }> = [];
      await Promise.all(
        formattedSuggestions.map(async (s) => {
          const title = (s.directive_text ?? '').trim();
          if (!title) return;
          try {
            const actions = await listActions({ search: title, limit: 1, skip: 0 });
            if (actions[0]) actionEntries.push({ id: s.id, action: actions[0] });
          } catch (e) { console.warn('Failed to fetch action:', e); }
        }),
      );
      setAiDirectiveActions((prev) => ({ ...prev, ...Object.fromEntries(actionEntries.map((e) => [e.id, e.action])) }));
    } catch (error) {
      console.error('Error fetching AI match suggestions:', error);
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  }, [id]);

  const handleUpdateAiDirective = useCallback((directiveId: string, field: string, value: string) => {
    setEditableAiDirectives((prev) => ({ ...prev, [directiveId]: { ...prev[directiveId], [field]: value } }));
  }, []);

  const handleDeleteAiDirective = useCallback((directiveId: string) => {
    setAiDirectivesSuggestions((prev) => prev.filter((d) => d.id !== directiveId));
    setEditableAiDirectives((prev) => { const n = { ...prev }; delete n[directiveId]; return n; });
  }, []);

  const loadActionsForAddDirective = useCallback(async (search: string, _skip: number, limit: number) => {
    const actions = await listActions({ search: search || '', limit: limit || 20 });
    actions.forEach((a) => addDirectiveActionMapRef.current.set(String(a.id), a));
    return {
      items: actions.map((a) => ({ value: String(a.id), label: a.title })),
      total: actions.length, skip: 0, limit: limit || 20, has_next: false, has_previous: false,
    };
  }, []);

  const handleAddDirectiveSelectChange = useCallback((opt: OptionType | null) => {
    if (!opt?.value) return;
    const action = addDirectiveActionMapRef.current.get(opt.value);
    if (action) {
      setManualAddedActions((prev) => { if (prev.some((a) => a.id === action.id)) return prev; return [...prev, action]; });
      setShowAddDirectiveRow(false);
    }
    setAddDirectiveSelectValue(null);
  }, []);

  const handleDeleteManualAction = useCallback((actionId: number) => {
    setManualAddedActions((prev) => prev.filter((a) => a.id !== actionId));
    setManualActionEdits((prev) => { const n = { ...prev }; delete n[actionId]; return n; });
  }, []);

  const updateManualActionDueDate = useCallback((actionId: number, due_date: string | null) => {
    setManualActionEdits((prev) => ({ ...prev, [actionId]: { ...prev[actionId], due_date } }));
  }, []);
  const updateManualActionStatus = useCallback((actionId: number, status: string) => {
    setManualActionEdits((prev) => ({ ...prev, [actionId]: { ...prev[actionId], status } }));
  }, []);
  const getManualActionAssignees = useCallback((actionId: number, fallback: string[]) => {
    return manualActionEdits[actionId]?.assignees ?? fallback;
  }, [manualActionEdits]);
  const setManualActionAssignees = useCallback((actionId: number, assignees: string[]) => {
    setManualActionEdits((prev) => ({ ...prev, [actionId]: { ...prev[actionId], assignees } }));
  }, []);
  const addManualActionAssignee = useCallback((actionId: number, email: string, currentAssignees: string[]) => {
    const trimmed = email.trim();
    if (!trimmed || currentAssignees.includes(trimmed)) return;
    setManualActionAssignees(actionId, [...currentAssignees, trimmed]);
  }, [setManualActionAssignees]);
  const removeManualActionAssignee = useCallback((actionId: number, index: number, currentAssignees: string[]) => {
    setManualActionAssignees(actionId, currentAssignees.filter((_, i) => i !== index));
  }, [setManualActionAssignees]);

  const handleDeleteExistingDirective = useCallback((directiveId: string) => {
    setDeletedExistingDirectiveIds((prev) => new Set(prev).add(directiveId));
  }, []);
  const handleDeleteSuggestedAction = useCallback((directiveId: string) => {
    const numericOrStringId = directiveId.replace(/^suggested-/, '');
    setDeletedSuggestedActionIds((prev) => new Set(prev).add(numericOrStringId));
  }, []);

  /* ── Submission handlers ── */
  const handleSubmitReturn = useCallback(() => {
    if (!returnNotes.trim()) return;
    submitReturnMutation.mutate({ content_notes: returnNotes.trim() });
  }, [returnNotes, submitReturnMutation]);

  const handleSubmitConsultation = useCallback((type: 'draft' | 'submit') => {
    if (!selectedConsultantId) { toast.error('الرجاء اختيار المستشار أولاً'); return; }
    if (!consultationNotes.trim()) { toast.error('الرجاء إدخال سؤال الاستشارة'); return; }
    const selectedConsultant = consultants.find((c) => c.id === selectedConsultantId);
    const consultantDisplayName = selectedConsultant ? `${selectedConsultant.first_name ?? ''} ${selectedConsultant.last_name ?? ''}`.trim() : undefined;
    submitConsultationMutation.mutate({
      consultant_user_id: selectedConsultantId,
      consultation_question: consultationNotes.trim(),
      is_draft: type === 'draft',
      consultant_display_name: consultantDisplayName,
    });
  }, [selectedConsultantId, consultationNotes, consultants, submitConsultationMutation]);

  const handleSendToScheduling = useCallback(() => {
    if (!hasDirectives) { toast.error('يرجى إضافة توجيه واحد على الأقل أولاً'); return; }
    const relatedDirectives = (contentRequest as ContentRequestDetailResponse)?.related_directives ?? [];
    const existingObjs: DirectiveForApprove[] = relatedDirectives
      .filter((d) => !deletedExistingDirectiveIds.has(String(d.id)))
      .map((d) => ({
        id: Number(d.id),
        title: (d.directive_text ?? (d as { directive?: string }).directive ?? '').trim() || '—',
        due_date: d.deadline ?? null,
        assignees: (d.responsible_persons ?? []).map((p) => (p as { email?: string }).email ?? (p as { name?: string }).name).filter(Boolean) as string[],
        status: d.directive_status ?? 'PENDING',
      }))
      .filter((d) => d.title !== '—');
    const aiObjs: DirectiveForApprove[] = aiDirectivesSuggestions
      .filter((d) => aiDirectiveActions[d.id])
      .map((d) => {
        const action = aiDirectiveActions[d.id];
        const title = (editableAiDirectives[d.id]?.directive_text ?? d.directive_text ?? '').trim() || action.title;
        return { id: action.id, title, due_date: action.due_date ?? null, assignees: action.assignees ?? [], status: action.status ?? 'PENDING' };
      });
    const suggestedObjs: DirectiveForApprove[] = suggestedActionsItems
      .filter((s) => !deletedSuggestedActionIds.has(String(s.id)))
      .map((s) => ({ id: Number(s.id), title: (s.title ?? '').trim() || '—', due_date: s.due_date ?? null, assignees: normalizeAssignees(s.assignees), status: s.status ?? 'PENDING' }))
      .filter((d) => d.title !== '—');
    const manualObjs: DirectiveForApprove[] = manualAddedActions.map((a) => {
      const edits = manualActionEdits[a.id];
      return { id: a.id, title: (a.title ?? '').trim() || '—', due_date: edits?.due_date !== undefined ? edits.due_date : (a.due_date ?? null), assignees: edits?.assignees ?? a.assignees ?? [], status: edits?.status ?? a.status ?? 'PENDING' };
    });
    const directivesToSend: DirectiveForApprove[] = [...existingObjs, ...aiObjs, ...suggestedObjs, ...manualObjs];
    sendToSchedulingMutation.mutate({ file: executiveSummaryFile, notes: guidanceNotes.trim(), directives: directivesToSend.length > 0 ? directivesToSend : undefined });
  }, [executiveSummaryFile, contentRequest, deletedExistingDirectiveIds, aiDirectivesSuggestions, aiDirectiveActions, editableAiDirectives, suggestedActionsItems, deletedSuggestedActionIds, manualAddedActions, manualActionEdits, guidanceNotes, sendToSchedulingMutation]);

  /* ── Computed ── */
  const hasDirectives = useMemo(() => {
    const apiCount = contentDirectives.length;
    const existingCount = (contentRequest?.related_directives ?? [])
      .filter(d => !deletedExistingDirectiveIds.has(String(d.id))).length;
    const aiCount = aiDirectivesSuggestions.filter(d => aiDirectiveActions[d.id]).length;
    const suggestedCount = suggestedActionsItems.filter(s => !deletedSuggestedActionIds.has(String(s.id))).length;
    const manualCount = manualAddedActions.length;
    return (apiCount + existingCount + aiCount + suggestedCount + manualCount) > 0;
  }, [contentDirectives, contentRequest, deletedExistingDirectiveIds, aiDirectivesSuggestions, aiDirectiveActions, suggestedActionsItems, deletedSuggestedActionIds, manualAddedActions]);

  const meetingStatus = (contentRequest?.status as MeetingStatus | string) || MeetingStatus.UNDER_REVIEW;
  const statusLabel = getStatusLabel(meetingStatus);
  const schedulingContentNote = ((contentRequest as any)?.scheduling_officer_note_for_content ?? '').toString().trim();

  const tabs = useMemo(() => [
    { id: 'request-info', label: 'معلومات الطلب' },
    { id: 'meeting-info', label: 'معلومات الاجتماع' },
    { id: 'content', label: 'المحتوى' },
    { id: 'directives-log', label: 'الاستشارات' },
    { id: 'invitees', label: 'قائمة المدعوين' },
    { id: 'notes', label: 'الملاحظات' },
  ], []);

  return {
    // Core
    id, navigate, user, isLoading, error, contentRequest, meetingStatus, statusLabel,
    // Tabs
    tabs, activeTab, setActiveTab,
    // Actions bar
    actionsBarOpen, setActionsBarOpen,
    // Preview
    previewAttachment, setPreviewAttachment,
    // Return modal
    isReturnModalOpen, setIsReturnModalOpen, returnNotes, setReturnNotes,
    submitReturnMutation, handleSubmitReturn,
    // Drafts modal
    isDraftsModalOpen, setIsDraftsModalOpen, draftsRecords,
    isLoadingConsultationRecordsWithDrafts, publishDraftMutation,
    handlePublishDraft: (consultationId: string) => publishDraftMutation.mutate(consultationId),
    // Consultations tab
    consultationRecords, isLoadingConsultationRecords,
    consultants, isLoadingConsultants,
    selectedConsultantId, setSelectedConsultantId,
    consultantSearch, setConsultantSearch,
    showConsultantPicker, setShowConsultantPicker,
    consultationNotes, setConsultationNotes,
    submitConsultationMutation, handleSubmitConsultation,
    schedulingContentNote,
    // Analyze
    analyzeContradictionsMutation, analyzingRecordId, setAnalyzingRecordId,
    analyzeResult, setAnalyzeResult, isAnalyzeModalOpen, setIsAnalyzeModalOpen,
    // Content tab: compare & insights
    insightsMutation, insightsModalAttachment, setInsightsModalAttachment, insightsAbortControllerRef,
    compareByAttachmentMutation, isCompareModalOpen, setIsCompareModalOpen,
    compareResult, setCompareResult, compareErrorDetail, setCompareErrorDetail,
    // Content tab: directives
    aiDirectivesSuggestions, editableAiDirectives, aiDirectiveActions,
    deletedExistingDirectiveIds, deletedSuggestedActionIds,
    manualAddedActions, manualActionEdits, assigneeInputByActionId,
    showAddDirectiveRow, setShowAddDirectiveRow,
    addDirectiveSelectValue, setAddDirectiveSelectValue,
    directiveDueDateFromDate, isLoadingAiSuggestions, suggestedActionsItems, hasSuggestedActions,
    handleRequestAiDirectives, handleUpdateAiDirective, handleDeleteAiDirective,
    handleDeleteExistingDirective, handleDeleteSuggestedAction,
    loadActionsForAddDirective, handleAddDirectiveSelectChange,
    handleDeleteManualAction, updateManualActionDueDate, updateManualActionStatus,
    getManualActionAssignees, addManualActionAssignee, removeManualActionAssignee,
    setAssigneeInputByActionId,
    // Content tab: executive summary
    executiveSummaryFile, setExecutiveSummaryFile, isDragging, guidanceNotes, setGuidanceNotes,
    fileInputRef, handleDragOver, handleDragLeave, handleDrop, handleFileSelect, handleRemoveFile,
    // Send to scheduling
    sendToSchedulingMutation, handleSendToScheduling, hasDirectives,
  };
}
