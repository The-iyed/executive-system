import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useAuth } from "@/modules/auth";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronUp,
  ChevronDown,
  Send,
  Eye,
  Download,
  RotateCcw,
  Upload,
  ClipboardCheck,
  MessageSquare,
  Clock,
  User,
  Mail,
  Phone,
  Trash2,
  Hash,
  Building2,
  FileCheck,
  Scale,
  Sparkles,
  Loader2,
  AlertCircle,
  FileText,
  CalendarClock,
  StickyNote,
  Users,
  Search,
  X,
} from "lucide-react";
import { formatDateArabic, formatDateTimeArabic, formatTimeAgoArabic } from "@/modules/shared/utils";
import {
  DetailPageHeader,
  StatusBadge,
  MeetingActionsBar,
  DataTable,
  MeetingInfo,
  ReadOnlyField,
  AttachmentPreviewDrawer,
  FormAsyncSelectV2,
  FormDatePicker,
  Mou7tawaContentTab,
  type MeetingInfoData,
  type OptionType,
} from "@/modules/shared/components";
import { MeetingStatus, MeetingStatusLabels, SectorLabels } from "@/modules/shared/types";
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
  type ActionItem,
  type Attachment,
  type ConsultantUser,
  type DirectiveForApprove,
  type AnalyzeResponse,
  type AttachmentInsightsResponse,
  type ComparePresentationsResponse,
  type ContentRequestDetailResponse,
} from "../data/contentApi";
import { getConsultationRecordsWithParams, getSuggestedActions, type ConsultationRecord } from "../../UC02/data/meetingsApi";
import { postMeetingsMatch } from "../../shared/api/meetings";
import { toast } from "sonner";

/** Start of local calendar day (for date pickers: no past due dates). */
function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Action status options for manual/suggested directive rows (editable). */
const ACTION_STATUS_OPTIONS = [
  { value: "PENDING", label: "قيد الانتظار" },
  { value: "IN_PROGRESS", label: "قيد التنفيذ" },
  { value: "COMPLETED", label: "مكتمل" },
  { value: "LATE", label: "متأخر" },
] as const;

/** Get display name for assignee/consultant from API response (handles name, assignee_name, first_name+last_name). */
function getAssigneeDisplayName(a: {
  name?: string;
  assignee_name?: string;
  first_name?: string;
  last_name?: string;
}): string {
  if (a.name?.trim()) return a.name.trim();
  if (a.assignee_name?.trim()) return a.assignee_name.trim();
  const first = a.first_name?.trim() ?? "";
  const last = a.last_name?.trim() ?? "";
  if (first || last) return `${first} ${last}`.trim();
  return "-";
}

/** Safely format related_guidance which may be a string or a directive object/array from the API */
function formatRelatedGuidance(value: unknown): string {
  if (typeof value === "string") return value.trim() || "-";
  if (value && typeof value === "object") {
    if (Array.isArray(value)) {
      const texts = value
        .map((d: { directive_text?: string }) => (d?.directive_text != null ? String(d.directive_text) : ""))
        .filter(Boolean);
      return texts.length > 0 ? texts.join(" ") : "-";
    }
    if ("directive_text" in value && typeof (value as { directive_text?: string }).directive_text === "string") {
      return (value as { directive_text: string }).directive_text;
    }
  }
  return "-";
}
import {
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/lib/ui";
import { PATH } from "../routes/paths";
import pdfIcon from "../../shared/assets/pdf.svg";
import { trackEvent } from "@/lib/analytics";
import { InviteesTableForm } from "@/modules/shared/features/invitees-table-form";

// Get status label with support for custom statuses
const getStatusLabel = (status: MeetingStatus | string): string => {
  if (status in MeetingStatusLabels) {
    return MeetingStatusLabels[status as MeetingStatus];
  }
  // Handle custom statuses
  if (status === "UNDER_CONTENT_REVIEW") {
    return "قيد مراجعة المحتوى";
  }
  return status as string;
};

// Format file size helper
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
};

// Safely render notes coming as string/object/array from API
const getNotesText = (...candidates: unknown[]): string => {
  const extract = (value: unknown): string | null => {
    if (value == null) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }
    if (Array.isArray(value)) {
      const parts = value.map(extract).filter(Boolean) as string[];
      return parts.length ? parts.join("\n") : null;
    }
    if (typeof value === "object") {
      const v = value as Record<string, unknown>;
      if (typeof v.text === "string") return v.text;
      if (typeof v.note === "string") return v.note;
      if (typeof v.content === "string") return v.content;
      if (typeof v.value === "string") return v.value;
      return null;
    }
    return null;
  };

  for (const candidate of candidates) {
    const text = extract(candidate);
    if (text) return text;
  }
  return "-";
};

/** Translate known compare-presentations API error detail to Arabic */
function translateCompareErrorDetail(detail: string | null): string | null {
  if (!detail || typeof detail !== "string") return detail;
  const trimmed = detail.trim();
  if (trimmed.includes("Need at least two presentation attachments with completed extraction")) {
    return "يجب وجود عرضين تقديميين على الأقل مع اكتمال استخراج المحتوى للمقارنة. تأكد من وجود العرضين في النظام واكتمال الاستخراج، أو قدّم النسخة الأصلية والنسخة الجديدة.";
  }
  return detail;
}

/** Translate comparison API enum-like values to Arabic for display */
const COMPARE_STATUS: Record<string, string> = {
  completed: "مكتمل",
  pending: "قيد المعالجة",
};
const COMPARE_LEVEL: Record<string, string> = {
  minor: "طفيف",
  moderate: "متوسط",
  major: "كبير",
};
const COMPARE_RECOMMENDATION: Record<string, string> = {
  review: "مراجعة",
};

function translateCompareValue(value: string | undefined | null, map: Record<string, string>): string {
  if (value == null || value === "") return "—";
  const v = String(value).toLowerCase();
  return map[v] ?? value;
}

const ContentRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("request-info");
  const [guidanceNotes, setGuidanceNotes] = useState<string>("");
  const [executiveSummaryFile, setExecutiveSummaryFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState<boolean>(false);
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResponse | null>(null);
  const [analyzingRecordId, setAnalyzingRecordId] = useState<string | null>(null);
  const [returnNotes, setReturnNotes] = useState<string>("");
  const [consultationNotes, setConsultationNotes] = useState<string>("");
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>("");
  const [consultantSearch, setConsultantSearch] = useState<string>("");
  const [showConsultantPicker, setShowConsultantPicker] = useState(false);

  // LLM notes/insights modal for presentation attachment
  const [insightsModalAttachment, setInsightsModalAttachment] = useState<{ id: string; file_name: string } | null>(
    null,
  );

  // Compare presentations modal (تقييم الاختلاف بين العروض)
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareResult, setCompareResult] = useState<ComparePresentationsResponse | null>(null);
  const [compareErrorDetail, setCompareErrorDetail] = useState<string | null>(null);

  // PDF/file preview drawer
  const [previewAttachment, setPreviewAttachment] = useState<{
    blob_url: string;
    file_name: string;
    file_type?: string;
  } | null>(null);

  const insightsAbortControllerRef = useRef<AbortController | null>(null);

  // Actions bar (FAB) open state – same pattern as meeting detail
  const [actionsBarOpen, setActionsBarOpen] = useState(false);

  // AI Directives Suggestions
  const [aiDirectivesSuggestions, setAiDirectivesSuggestions] = useState<
    Array<{
      id: string;
      directive_text: string;
      responsible_entity: string;
      due_date: string;
      status: string;
    }>
  >([]);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);
  const [editableAiDirectives, setEditableAiDirectives] = useState<
    Record<
      string,
      {
        directive_text: string;
        responsible_entity: string;
        due_date: string;
        status: string;
      }
    >
  >({});
  /** IDs of existing directives (from API) that the user removed from the list – hide in UI only */
  const [deletedExistingDirectiveIds, setDeletedExistingDirectiveIds] = useState<Set<string>>(new Set());
  /** IDs of suggested-actions (from API) that the user removed from the list – hide in UI only */
  const [deletedSuggestedActionIds, setDeletedSuggestedActionIds] = useState<Set<string>>(new Set());
  /** Matched action from GET /api/v1/actions/ per AI directive id (key = ai directive id). */
  const [aiDirectiveActions, setAiDirectiveActions] = useState<Record<string, ActionItem>>({});
  /** Manually added directives from "إضافة توجيه" async select (list actions). */
  const [manualAddedActions, setManualAddedActions] = useState<ActionItem[]>([]);
  /** Selected value for the "إضافة توجيه" async select (cleared after adding). */
  const [addDirectiveSelectValue, setAddDirectiveSelectValue] = useState<OptionType | null>(null);
  /** When true, show an extra table row with async select in التوجيه column. */
  const [showAddDirectiveRow, setShowAddDirectiveRow] = useState(false);
  /** Ref: option value (action id) -> ActionItem for add-directive select. */
  const addDirectiveActionMapRef = useRef<Map<string, ActionItem>>(new Map());
  /** Edits for manual-added actions (due_date, status, assignees). */
  const [manualActionEdits, setManualActionEdits] = useState<
    Record<number, { due_date?: string | null; status?: string; assignees?: string[] }>
  >({});
  /** Inline input value for adding assignee (per manual action id). */
  const [assigneeInputByActionId, setAssigneeInputByActionId] = useState<Record<number, string>>({});
  /** Earliest selectable day for directive الموعد النهائي (today, local). */
  const directiveDueDateFromDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Fetch content request data from API
  const {
    data: contentRequest,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["content-request", id],
    queryFn: () => getContentRequestById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (contentRequest?.id || id) {
      trackEvent('UC-05', 'uc05_content_request_detail_viewed', {
        content_request_id: contentRequest?.id ?? id,
      });
    }
  }, [contentRequest?.id, id]);

  // meeting_id for suggested-actions: from content request detail or fallback to content-request id
  const rawMeetingId =
    contentRequest?.meeting_id ?? contentRequest?.meeting?.meeting_id ?? contentRequest?.meeting?.id ?? id;
  const suggestedActionsMeetingId =
    rawMeetingId != null && String(rawMeetingId).trim() !== "" ? String(rawMeetingId).trim() : null;

  // GET /api/v1/business-cards/suggested-actions?meeting_id=... – used in إضافة التوجيهات table; if has data, disable "اقتراح بالذكاء الاصطناعي"
  const { data: suggestedActionsData } = useQuery({
    queryKey: ["business-cards-suggested-actions", suggestedActionsMeetingId],
    queryFn: () => getSuggestedActions(suggestedActionsMeetingId!, { skip: 0, limit: 100 }),
    enabled: !!suggestedActionsMeetingId,
  });

  // API can return { items: [...] } or a raw array
  const suggestedActionsItems: Array<{
    id: number | string;
    meeting_id?: number;
    title: string;
    due_date?: string | null;
    assignees?: string;
    status?: string;
    is_completed?: boolean;
    completed_at?: string | null;
    created_at?: string;
    updated_at?: string;
  }> = Array.isArray(suggestedActionsData)
    ? suggestedActionsData
    : ((Array.isArray((suggestedActionsData as { items?: unknown[] })?.items)
        ? (suggestedActionsData as { items: unknown[] }).items
        : []) as Array<{
        id: number | string;
        meeting_id?: number;
        title: string;
        due_date?: string | null;
        assignees?: string;
        status?: string;
        is_completed?: boolean;
        completed_at?: string | null;
        created_at?: string;
        updated_at?: string;
      }>);

  const hasSuggestedActions =
    suggestedActionsItems.length > 0 ||
    (Array.isArray(suggestedActionsData?.items) && (suggestedActionsData?.items?.length ?? 0) > 0) ||
    ((suggestedActionsData as { total?: number } | undefined)?.total ?? 0) > 0;

  // Fetch consultation records (سجلات الاستشارات)
  const { data: consultationRecords, isLoading: isLoadingConsultationRecords } = useQuery({
    queryKey: ["consultation-records", id],
    queryFn: () =>
      getConsultationRecordsWithParams(id!, {
        include_drafts: false,
        skip: 0,
        limit: 100,
      }),
    enabled: !!id && activeTab === "directives-log",
  });

  // Fetch consultation records with drafts for drafts modal
  const { data: consultationRecordsWithDrafts, isLoading: isLoadingConsultationRecordsWithDrafts } = useQuery({
    queryKey: ["consultation-records-with-drafts", id],
    queryFn: () =>
      getConsultationRecordsWithParams(id!, {
        include_drafts: true,
        skip: 0,
        limit: 100,
      }),
    enabled: !!id,
  });

  const draftsRecords =
    consultationRecordsWithDrafts?.items?.filter(
      (item) =>
        item.is_draft ||
        (!item.consultation_answers?.length && !item.assignees?.some((a) => a.answers?.length)) ||
        item.consultation_answers?.some((a) => a.is_draft),
    ) || [];

  const queryClient = useQueryClient();

  const insightsMutation = useMutation({
    mutationFn: ({ attachmentId, signal }: { attachmentId: string; signal?: AbortSignal }) =>
      getAttachmentInsightsWithPolling(attachmentId, { signal }),
    onError: () => {},
  });

  // Consultants query for async select
  const { data: consultantsResponse, isLoading: isLoadingConsultants } = useQuery({
    queryKey: ["content-consultants", consultantSearch],
    queryFn: () =>
      getContentConsultants({
        search: consultantSearch || "",
        role_code: "CONTENT_CONSULTANT",
        user_code: "",
        skip: 0,
        limit: 50,
      }),
    enabled: showConsultantPicker,
  });

  const consultants: ConsultantUser[] = consultantsResponse?.items || [];

  // File upload handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      // Accept PDF, Word, Excel files (max 20MB)
      const file = droppedFiles[0];
      const maxSize = 20 * 1024 * 1024; // 20MB
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];

      if (file.size > maxSize) {
        // TODO: Show error toast
        console.error("File size exceeds 20MB");
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        // TODO: Show error toast
        console.error("File type not allowed");
        return;
      }

      setExecutiveSummaryFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const maxSize = 20 * 1024 * 1024; // 20MB
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];

      if (selectedFile.size > maxSize) {
        // TODO: Show error toast
        console.error("File size exceeds 20MB");
        return;
      }

      if (!allowedTypes.includes(selectedFile.type)) {
        // TODO: Show error toast
        console.error("File type not allowed");
        return;
      }

      setExecutiveSummaryFile(selectedFile);
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setExecutiveSummaryFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // AI Directives Suggestions Handler – POST /api/meetings/match, show suggested_actions_written
  const handleRequestAiDirectives = useCallback(async () => {
    if (!id) return;

    setIsLoadingAiSuggestions(true);
    try {
      const { results } = await postMeetingsMatch(id);

      const suggestedFromAllResults = (results || []).flatMap((r) => r.suggested_actions_written || []);

      const formattedSuggestions = suggestedFromAllResults.map((item, index) => ({
        id: `ai-match-${item.uep_id}-${index}-${item.title?.slice(0, 20) ?? ""}`,
        directive_text: item.title ?? "",
        responsible_entity: "",
        due_date: "",
        status: item.status ?? (item.success ? "written" : "pending"),
      }));

      // Append to existing directives – do not override
      setAiDirectivesSuggestions((prev) => [...prev, ...formattedSuggestions]);

      const editableState: Record<
        string,
        {
          directive_text: string;
          responsible_entity: string;
          due_date: string;
          status: string;
        }
      > = {};
      formattedSuggestions.forEach((suggestion) => {
        editableState[suggestion.id] = {
          directive_text: suggestion.directive_text,
          responsible_entity: suggestion.responsible_entity,
          due_date: suggestion.due_date,
          status: suggestion.status,
        };
      });
      setEditableAiDirectives((prev) => ({ ...prev, ...editableState }));

      // For each AI directive title, GET /api/v1/actions/?search=title&limit=1 and store the match
      const actionEntries: Array<{ id: string; action: ActionItem }> = [];
      await Promise.all(
        formattedSuggestions.map(async (suggestion) => {
          const title = (suggestion.directive_text ?? "").trim();
          if (!title) return;
          try {
            const actions = await listActions({ search: title, limit: 1, skip: 0 });
            const first = actions[0];
            if (first) {
              actionEntries.push({ id: suggestion.id, action: first });
            }
          } catch (e) {
            console.warn("Failed to fetch action for directive title:", title, e);
          }
        }),
      );
      setAiDirectiveActions((prev) => ({
        ...prev,
        ...Object.fromEntries(actionEntries.map((e) => [e.id, e.action])),
      }));
    } catch (error) {
      console.error("Error fetching AI match suggestions:", error);
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  }, [id]);

  const handleUpdateAiDirective = useCallback((directiveId: string, field: string, value: string) => {
    setEditableAiDirectives((prev) => ({
      ...prev,
      [directiveId]: {
        ...prev[directiveId],
        [field]: value,
      },
    }));
  }, []);

  const handleDeleteAiDirective = useCallback((directiveId: string) => {
    // Remove from AI suggestions
    setAiDirectivesSuggestions((prev) => prev.filter((d) => d.id !== directiveId));
    setEditableAiDirectives((prev) => {
      const newState = { ...prev };
      delete newState[directiveId];
      return newState;
    });
  }, []);

  /** Load options for "إضافة توجيه" async select – GET /api/v1/actions/ with search. */
  const loadActionsForAddDirective = useCallback(async (search: string, _skip: number, limit: number) => {
    const actions = await listActions({ search: search || "", limit: limit || 20 });
    actions.forEach((a) => addDirectiveActionMapRef.current.set(String(a.id), a));
    return {
      items: actions.map((a) => ({ value: String(a.id), label: a.title })),
      total: actions.length,
      skip: 0,
      limit: limit || 20,
      has_next: false,
      has_previous: false,
    };
  }, []);

  const handleAddDirectiveSelectChange = useCallback((opt: OptionType | null) => {
    if (!opt?.value) return;
    const action = addDirectiveActionMapRef.current.get(opt.value);
    if (action) {
      setManualAddedActions((prev) => {
        if (prev.some((a) => a.id === action.id)) return prev;
        return [...prev, action];
      });
      setShowAddDirectiveRow(false);
    }
    setAddDirectiveSelectValue(null);
  }, []);

  const handleDeleteManualAction = useCallback((actionId: number) => {
    setManualAddedActions((prev) => prev.filter((a) => a.id !== actionId));
    setManualActionEdits((prev) => {
      const next = { ...prev };
      delete next[actionId];
      return next;
    });
  }, []);

  const updateManualActionDueDate = useCallback((actionId: number, due_date: string | null) => {
    setManualActionEdits((prev) => ({ ...prev, [actionId]: { ...prev[actionId], due_date } }));
  }, []);
  const updateManualActionStatus = useCallback((actionId: number, status: string) => {
    setManualActionEdits((prev) => ({ ...prev, [actionId]: { ...prev[actionId], status } }));
  }, []);
  const getManualActionAssignees = useCallback(
    (actionId: number, fallback: string[]) => {
      return manualActionEdits[actionId]?.assignees ?? fallback;
    },
    [manualActionEdits],
  );
  const setManualActionAssignees = useCallback((actionId: number, assignees: string[]) => {
    setManualActionEdits((prev) => ({ ...prev, [actionId]: { ...prev[actionId], assignees } }));
  }, []);
  const addManualActionAssignee = useCallback(
    (actionId: number, email: string, currentAssignees: string[]) => {
      const trimmed = email.trim();
      if (!trimmed || currentAssignees.includes(trimmed)) return;
      setManualActionAssignees(actionId, [...currentAssignees, trimmed]);
    },
    [setManualActionAssignees],
  );
  const removeManualActionAssignee = useCallback(
    (actionId: number, index: number, currentAssignees: string[]) => {
      setManualActionAssignees(
        actionId,
        currentAssignees.filter((_, i) => i !== index),
      );
    },
    [setManualActionAssignees],
  );

  const handleDeleteExistingDirective = useCallback((directiveId: string) => {
    setDeletedExistingDirectiveIds((prev) => new Set(prev).add(directiveId));
  }, []);

  const handleDeleteSuggestedAction = useCallback((directiveId: string) => {
    const numericOrStringId = directiveId.replace(/^suggested-/, "");
    setDeletedSuggestedActionIds((prev) => new Set(prev).add(numericOrStringId));
  }, []);

  // Submit return mutation (إعادة للطلب)
  const submitReturnMutation = useMutation({
    mutationFn: (data: { content_notes: string }) => {
      if (!id) throw new Error("Meeting request ID is required");
      return submitContentReturn(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-request", id] });
      queryClient.invalidateQueries({ queryKey: ["content-requests"] });
      setReturnNotes("");
      setIsReturnModalOpen(false);
      navigate(PATH.CONTENT_REQUESTS);
    },
    onError: (error) => {
      console.error("Error submitting return:", error);
    },
  });

  // Submit consultation mutation (طلب استشارة) with optimistic update
  const submitConsultationMutation = useMutation({
    mutationFn: (data: {
      consultant_user_id: string;
      consultation_question: string;
      is_draft?: boolean;
      consultant_display_name?: string;
    }) => {
      if (!id) throw new Error("Meeting request ID is required");
      return submitContentConsultation(id, {
        consultant_user_id: data.consultant_user_id,
        consultation_question: data.consultation_question,
        is_draft: data.is_draft,
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["consultation-records", id] });
      await queryClient.cancelQueries({ queryKey: ["consultation-records-with-drafts", id] });

      const prevRecords = queryClient.getQueryData<{
        items: ConsultationRecord[];
        total: number;
        skip: number;
        limit: number;
        has_next: boolean;
        has_previous: boolean;
      }>(["consultation-records", id]);
      const prevRecordsWithDrafts = queryClient.getQueryData<{
        items: ConsultationRecord[];
        total: number;
        skip: number;
        limit: number;
        has_next: boolean;
        has_previous: boolean;
      }>(["consultation-records-with-drafts", id]);

      const consultantName =
        variables.consultant_display_name?.trim() ||
        contentRequest?.submitter_name ||
        "مستشار";
      const optimisticRecord: ConsultationRecord = {
        id: `optimistic-${Date.now()}`,
        type: "CONTENT",
        question: variables.consultation_question,
        round_number: 1,
        requested_at: new Date().toISOString(),
        status: variables.is_draft ? "DRAFT" : "PENDING",
        is_draft: variables.is_draft ?? false,
        assignees: [
          {
            user_id: variables.consultant_user_id,
            name: consultantName,
            role: null,
            status: variables.is_draft ? "DRAFT" : "PENDING",
            responded_at: null,
            request_number: null,
            answers: [],
          },
        ],
      };

      const appendToCache = (
        key: readonly unknown[],
        prev: typeof prevRecords
      ) => {
        const prevItems = prev?.items ?? [];
        queryClient.setQueryData(key, {
          items: [...prevItems, optimisticRecord],
          total: (prev?.total ?? 0) + 1,
          skip: prev?.skip ?? 0,
          limit: prev?.limit ?? 100,
          has_next: prev?.has_next ?? false,
          has_previous: prev?.has_previous ?? false,
        });
      };

      appendToCache(["consultation-records-with-drafts", id], prevRecordsWithDrafts);
      if (!variables.is_draft) {
        appendToCache(["consultation-records", id], prevRecords);
      }

      setConsultationNotes("");
      setSelectedConsultantId("");
      setConsultantSearch("");
      setIsConsultationModalOpen(false);

      return { prevRecords, prevRecordsWithDrafts };
    },
    onSuccess: (_data, variables) => {
      if (variables.is_draft) {
        toast.success("تم حفظ المسودة بنجاح");
      } else {
        toast.success("تم إرسال الاستشارة بنجاح");
      }
    },
    onError: (error, _variables, context) => {
      if (context?.prevRecords != null) {
        queryClient.setQueryData(["consultation-records", id], context.prevRecords);
      }
      if (context?.prevRecordsWithDrafts != null) {
        queryClient.setQueryData(
          ["consultation-records-with-drafts", id],
          context.prevRecordsWithDrafts
        );
      }
      const err = error as { response?: { data?: { message?: string; detail?: string } }; message?: string };
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.detail ??
        (err instanceof Error ? err.message : String(error));
      toast.error(`فشل إرسال الاستشارة: ${message}`);
      console.error("Error submitting consultation:", error);
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content-request", id] });
      queryClient.invalidateQueries({ queryKey: ["content-requests"] });
      queryClient.invalidateQueries({ queryKey: ["consultation-records", id] });
      queryClient.invalidateQueries({
        queryKey: ["consultation-records-with-drafts", id],
      });
    },
  });

  // Publish draft mutation
  const publishDraftMutation = useMutation({
    mutationFn: (consultationId: string) => {
      if (!id) throw new Error("Meeting request ID is required");
      return completeContentConsultation(id, consultationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-request", id] });
      queryClient.invalidateQueries({ queryKey: ["content-requests"] });
      queryClient.invalidateQueries({ queryKey: ["consultation-records-with-drafts", id] });
      queryClient.invalidateQueries({ queryKey: ["consultation-records", id] });
      setIsDraftsModalOpen(false);
      navigate(PATH.CONTENT_REQUESTS);
    },
    onError: (error) => {
      console.error("Error publishing draft:", error);
    },
  });

  const handlePublishDraft = (consultationId: string) => {
    publishDraftMutation.mutate(consultationId);
  };

  // Send to scheduling officer mutation (إرسال إلى مسؤول الجدولة)
  const sendToSchedulingMutation = useMutation({
    mutationFn: async (data: { file: File; notes?: string; directives?: DirectiveForApprove[] }) => {
      if (!id) throw new Error("Meeting request ID is required");
      return approveContent(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-request", id] });
      queryClient.invalidateQueries({ queryKey: ["content-requests"] });
      setExecutiveSummaryFile(null);
      setGuidanceNotes("");
      setAiDirectivesSuggestions([]);
      setEditableAiDirectives({});
      setAiDirectiveActions({});
      setManualAddedActions([]);
      setManualActionEdits({});
      setAssigneeInputByActionId({});
      setShowAddDirectiveRow(false);
      navigate(PATH.CONTENT_REQUESTS);
    },
    onError: (error) => {
      console.error("Error sending to scheduling officer:", error);
    },
  });

  const analyzeContradictionsMutation = useMutation({
    mutationFn: (sentences: string[]) => analyzeContradictions(sentences),
    onSuccess: (data) => {
      setAnalyzeResult(data);
      setIsAnalyzeModalOpen(true);
      setAnalyzingRecordId(null);
    },
    onError: (error) => {
      console.error("Error analyzing contradictions:", error);
      setAnalyzeResult(null);
      setIsAnalyzeModalOpen(true);
      setAnalyzingRecordId(null);
    },
  });

  const compareByAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => runCompareByAttachment(attachmentId),
    onSuccess: (data) => {
      setCompareResult(data);
      setCompareErrorDetail(null);
      setIsCompareModalOpen(true);
    },
    onError: (error: unknown) => {
      console.error("Error comparing presentations:", error);
      setCompareResult(null);
      const err = error as { response?: { data?: { detail?: string } }; detail?: string };
      const detail =
        typeof err?.response?.data?.detail === "string"
          ? err.response.data.detail
          : typeof err?.detail === "string"
            ? err.detail
            : null;
      setCompareErrorDetail(detail);
      setIsCompareModalOpen(true);
    },
  });

  // Keep actions bar open while "send to scheduling" is in progress so user sees loading state
  useEffect(() => {
    if (sendToSchedulingMutation.isPending) {
      setActionsBarOpen(true);
    }
  }, [sendToSchedulingMutation.isPending]);

  /** Normalize assignees to string[] for building approve payload. */
  const assigneesForApprove = (a: unknown): string[] => {
    if (Array.isArray(a)) return a.filter((x): x is string => typeof x === "string");
    if (typeof a === "string") {
      try {
        const parsed = JSON.parse(a) as unknown;
        return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const handleSendToScheduling = () => {
    if (!executiveSummaryFile) {
      // TODO: Show validation error - executive summary file is required
      console.error("Executive summary file is required");
      return;
    }

    const relatedDirectives = (contentRequest as ContentRequestDetailResponse)?.related_directives ?? [];
    const existingObjs: DirectiveForApprove[] = relatedDirectives
      .filter((d) => !deletedExistingDirectiveIds.has(String(d.id)))
      .map((d) => ({
        id: Number(d.id),
        title: (d.directive_text ?? (d as { directive?: string }).directive ?? "").trim() || "—",
        due_date: d.deadline ?? null,
        assignees: (d.responsible_persons ?? [])
          .map((p) => (p as { email?: string }).email ?? (p as { name?: string }).name)
          .filter(Boolean) as string[],
        status: d.directive_status ?? "PENDING",
      }))
      .filter((d) => d.title !== "—");

    const aiObjs: DirectiveForApprove[] = aiDirectivesSuggestions
      .filter((d) => aiDirectiveActions[d.id])
      .map((d) => {
        const action = aiDirectiveActions[d.id];
        const title = (editableAiDirectives[d.id]?.directive_text ?? d.directive_text ?? "").trim() || action.title;
        return {
          id: action.id,
          title,
          due_date: action.due_date ?? null,
          assignees: action.assignees ?? [],
          status: action.status ?? "PENDING",
        };
      });

    const suggestedObjs: DirectiveForApprove[] = suggestedActionsItems
      .filter((s) => !deletedSuggestedActionIds.has(String(s.id)))
      .map((s) => ({
        id: Number(s.id),
        title: (s.title ?? "").trim() || "—",
        due_date: s.due_date ?? null,
        assignees: assigneesForApprove(s.assignees),
        status: s.status ?? "PENDING",
      }))
      .filter((d) => d.title !== "—");

    const manualObjs: DirectiveForApprove[] = manualAddedActions.map((a) => {
      const edits = manualActionEdits[a.id];
      return {
        id: a.id,
        title: (a.title ?? "").trim() || "—",
        due_date: edits?.due_date !== undefined ? edits.due_date : (a.due_date ?? null),
        assignees: edits?.assignees ?? a.assignees ?? [],
        status: edits?.status ?? a.status ?? "PENDING",
      };
    });

    const directivesToSend: DirectiveForApprove[] = [...existingObjs, ...aiObjs, ...suggestedObjs, ...manualObjs];

    sendToSchedulingMutation.mutate({
      file: executiveSummaryFile,
      notes: guidanceNotes.trim(),
      directives: directivesToSend.length > 0 ? directivesToSend : undefined,
    });
  };

  const handleReturnRequest = () => {
    setIsReturnModalOpen(true);
  };

  const handleSubmitReturn = () => {
    if (!returnNotes.trim()) {
      // TODO: Show validation error
      return;
    }
    submitReturnMutation.mutate({
      content_notes: returnNotes.trim(),
    });
  };

  const handleSubmitConsultation = (type: "draft" | "submit") => {
    if (!selectedConsultantId) {
      toast.error("الرجاء اختيار المستشار أولاً");
      return;
    }
    if (!consultationNotes.trim()) {
      toast.error("الرجاء إدخال سؤال الاستشارة");
      return;
    }
    const selectedConsultant = consultants.find((c) => c.id === selectedConsultantId);
    const consultantDisplayName = selectedConsultant
      ? `${selectedConsultant.first_name ?? ""} ${selectedConsultant.last_name ?? ""}`.trim()
      : undefined;
    submitConsultationMutation.mutate({
      consultant_user_id: selectedConsultantId,
      consultation_question: consultationNotes.trim(),
      is_draft: type === "draft",
      consultant_display_name: consultantDisplayName,
    });
  };

  const meetingInfoData: MeetingInfoData = useMemo(() => {
    if (!contentRequest) return {};
    const cr = contentRequest as unknown as Record<string, unknown>;
    const owner = contentRequest.current_owner_user
      ? `${contentRequest.current_owner_user.first_name ?? ""} ${contentRequest.current_owner_user.last_name ?? ""}`.trim()
      : (contentRequest.current_owner_role?.name_ar ?? undefined);
    return {
      ...(contentRequest as MeetingInfoData),
      is_on_behalf_of: (cr.is_on_behalf_of as boolean) ?? undefined,
      meeting_manager_label: owner ?? undefined,
      meetingSubject: contentRequest.meeting_title ?? undefined,
      meetingDescription: contentRequest.meeting_subject ?? undefined,
      sector: contentRequest.sector ?? undefined,
      meetingType: contentRequest.meeting_type ?? undefined,
      is_urgent: contentRequest.is_direct_schedule === true,
      urgent_reason: (cr.meeting_justification as string) ?? contentRequest.meeting_justification ?? undefined,
      meeting_start_date: contentRequest.scheduled_at ?? undefined,
      meeting_end_date: undefined,
      meetingChannel: contentRequest.meeting_channel ?? undefined,
      meeting_location: (cr.meeting_location as string) ?? undefined,
      meetingCategory: contentRequest.meeting_classification ?? undefined,
      meetingReason: contentRequest.meeting_justification ?? undefined,
      relatedTopic: contentRequest.related_topic ?? undefined,
      dueDate: contentRequest.deadline ?? undefined,
      meetingClassification1: (cr.meeting_classification_type as string) ?? undefined,
      meetingConfidentiality: (cr.meeting_confidentiality as string) ?? undefined,
      meetingAgenda: contentRequest.agenda_items ?? undefined,
      is_based_on_directive: !!(
        contentRequest.related_directive_ids && contentRequest.related_directive_ids.length > 0
      ),
      directive_method: (cr.directive_method as string) ?? undefined,
      previous_meeting_minutes_file: undefined,
      directive_text: formatRelatedGuidance(contentRequest.related_guidance),
      notes: getNotesText(contentRequest.general_notes, contentRequest.content_officer_notes),
    };
  }, [contentRequest]);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  // Error state
  if (error || !contentRequest) {
    return (
      <div className="w-full h-full flex items-center justify-center" dir="rtl">
        <div className="text-red-600">حدث خطأ أثناء تحميل البيانات</div>
      </div>
    );
  }

  // Map status to MeetingStatus enum
  const meetingStatus = (contentRequest?.status as MeetingStatus | string) || MeetingStatus.UNDER_REVIEW;
  const statusLabel = getStatusLabel(meetingStatus);

  // Filter attachments
  const presentationAttachments = contentRequest?.attachments?.filter((att) => att.is_presentation) || [];
  const additionalAttachments = contentRequest?.attachments?.filter((att) => att.is_additional) || [];

  // Scheduler note for content, used in the notes tab
  const schedulingContentNote = ((contentRequest as any)?.scheduling_officer_note_for_content ?? "").toString().trim();

  const tabs = [
    {
      id: "request-info",
      label: "معلومات الطلب",
    },
    {
      id: "meeting-info",
      label: "معلومات الاجتماع",
    },
    {
      id: "content",
      label: "المحتوى",
    },
    {
      id: "directives-log",
      label: "الاستشارات",
    },
    {
      id: "invitees",
      label: "قائمة المدعوين",
    },
    {
      id: "notes",
      label: "الملاحظات",
    },
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      <div className="p-6">
        <DetailPageHeader
          title={`${contentRequest.meeting_title} (${contentRequest.request_number})`}
          onBack={() => navigate(-1)}
          statusBadge={<StatusBadge status={meetingStatus} label={statusLabel} />}
          primaryAction={undefined}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        {/* Tab Content Container - like UC04 */}
        <div className="overflow-y-auto p-[20px] h-full bg-white border border-[#E6E6E6] rounded-2xl  mt-0">
          {/* Tab Content */}
          {activeTab === "request-info" && (
            <div className="flex flex-col gap-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full p-[20px]">
                <ReadOnlyField label="رقم الطلب" value={contentRequest?.request_number ?? "-"} />
                <ReadOnlyField
                  label="تاريخ الطلب"
                  value={
                    formatDateArabic(
                      (contentRequest as { submitted_at?: string; created_at?: string })?.submitted_at ??
                        (contentRequest as { created_at?: string })?.created_at,
                    ) || "-"
                  }
                />
                <ReadOnlyField label="حالة الطلب" value={statusLabel} />
                <ReadOnlyField label="مقدم الطلب" value={resolveUserLabel((contentRequest as any)?.submitter, contentRequest?.submitter_name)} />
                <ReadOnlyField
                  label="مالك الاجتماع"
                  value={resolveUserLabel(contentRequest?.current_owner_user, contentRequest?.current_owner_role?.name_ar)}
                />
              </div>
            </div>
          )}

          {activeTab === "meeting-info" && (
            <div className="flex flex-col gap-6">
              <MeetingInfo data={meetingInfoData} dir="rtl" />
            </div>
          )}

          {activeTab === "content" &&
            (() => {
              const attachments = contentRequest?.attachments ?? [];
              const prevId = (contentRequest as { previous_meeting_attachment?: { id?: string } | null })?.previous_meeting_attachment?.id ?? null;
                        const presAttachments = attachments.filter((a: Attachment) => a.is_presentation);
              const presFiles = presAttachments.map((a: Attachment) => ({
                  id: a.id,
                  file_name: a.file_name,
                  file_size: a.file_size ?? 0,
                  file_type: a.file_type ?? "",
                  blob_url: a.blob_url ?? null,
                }));
              const optFiles = attachments
                .filter((a: Attachment) => a.is_additional && (prevId == null || a.id !== prevId))
                .map((a: Attachment) => ({
                  id: a.id,
                  file_name: a.file_name,
                  file_size: a.file_size ?? 0,
                  file_type: a.file_type ?? "",
                  blob_url: a.blob_url ?? null,
                }));
              const showContentOfficerNotes =
                meetingStatus === MeetingStatus.RETURNED_FROM_CONTENT && contentRequest.content_officer_notes;

              return (
                <TooltipProvider delayDuration={200}>
                  <div className="flex flex-col gap-6 w-full" dir="rtl">
                    <Mou7tawaContentTab
                    presentationFiles={presFiles}
                    optionalFiles={optFiles}
                    attachmentTimingValue=""
                    notesValue={getNotesText(contentRequest.general_notes, contentRequest.content_officer_notes)}
                    contentOfficerNotes={
                      showContentOfficerNotes ? (contentRequest.content_officer_notes ?? null) : null
                    }
                    readOnly
                    formatDate={formatDateArabic}
                    compareEnabledForPresentation={(file) => {
                      const att = presAttachments.find((a: Attachment) => a.id === file.id);
                      return att?.replaces_attachment_id != null;
                    }}
                    compareDisabledReason={(file, _, total) => {
                      if (total < 2) return "يجب وجود عرضين تقديميين على الأقل للمقارنة";
                      return "المقارنة متاحة فقط عند رفع نسخة جديدة تحل محل عرض سابق";
                    }}
                    onComparePresentation={(file) => {
                      setCompareResult(null);
                      setCompareErrorDetail(null);
                      setIsCompareModalOpen(true);
                      compareByAttachmentMutation.mutate(file.id);
                    }}
                    onView={(file) => {
                      if (!file.blob_url) return;
                      setPreviewAttachment({
                        blob_url: file.blob_url,
                        file_name: file.file_name,
                        file_type: file.file_type,
                      });
                    }}
                    onDownload={(file) => file.blob_url && window.open(file.blob_url, "_blank")}
                    onAiNotesPresentation={(file) => {
                      insightsAbortControllerRef.current?.abort();
                      insightsAbortControllerRef.current = new AbortController();
                      setInsightsModalAttachment({ id: file.id, file_name: file.file_name });
                      insightsMutation.reset();
                      insightsMutation.mutate({
                        attachmentId: file.id,
                        signal: insightsAbortControllerRef.current.signal,
                      });
                    }}
                    aiNotesPending={insightsMutation.isPending}
                  />
                </div>
                </TooltipProvider>
              );
            })()}

          {activeTab === "notes" && (
            <div className="flex flex-col gap-5 w-full max-w-[900px] mx-auto" dir="rtl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-gray-800">الملاحظات</h2>
              </div>

              {schedulingContentNote ? (
                <article className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-4 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600">
                        <CalendarClock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                        ملاحظات مسؤول الجدولة على المحتوى
                      </span>
                    </div>
                    <div className="min-h-[3rem] rounded-lg bg-gray-50/80 px-4 py-3 sm:px-5 sm:py-4">
                      <p className="text-[15px] leading-[1.7] text-gray-800 whitespace-pre-wrap">
                        {schedulingContentNote}
                      </p>
                    </div>
                  </div>
                </article>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                    <StickyNote className="h-7 w-7" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-medium text-gray-600">لا توجد ملاحظات على المحتوى</p>
                    <p className="text-sm text-gray-500">لم يتم إضافة ملاحظات من مسؤول الجدولة على المحتوى بعد</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "invitees" && (
              <InviteesTableForm initialInvitees={contentRequest.invitees} mode='view' />
          )}

          {activeTab === "directives-log" && (
            <div className="flex flex-col h-full w-full bg-white min-h-0" dir="rtl">
              {/* Chat messages area – scrollable */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {isLoadingConsultationRecords ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-gray-600">جاري التحميل...</div>
                  </div>
                ) : consultationRecords && consultationRecords.items.length > 0 ? (
                  (() => {
                    const filteredConsultationItems = consultationRecords.items.filter((row: ConsultationRecord) => {
                      // Content consultations (type CONTENT) are never filtered.
                      const recordType = row.type || row.consultation_type || "";
                      if (recordType === "CONTENT") return true;
                      // Only filter SCHEDULING records whose question matches the scheduling officer note
                      // (shown in الملاحظات → ملاحظات مسؤول الجدولة على المحتوى).
                      const question = (row.question || row.consultation_question || "").toString().trim().replace(/\s+/g, " ");
                      const schedulingNote = schedulingContentNote.trim().replace(/\s+/g, " ");
                      if (recordType === "SCHEDULING" && schedulingNote && question === schedulingNote) return false;
                      return true;
                    });
                    if (filteredConsultationItems.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-[#F2F4F7] flex items-center justify-center">
                            <ClipboardCheck className="w-6 h-6 text-[#98A2B3]" />
                          </div>
                          <p className="text-[15px] font-semibold text-[#344054]">سجل الاستشارات</p>
                          <p className="text-[13px] text-[#667085]">لا توجد استشارات بعد</p>
                        </div>
                      );
                    }
                    return (
                  <div className="flex flex-col pb-4">
                    {filteredConsultationItems.map((row: ConsultationRecord, index: number) => {
                      const recordId = row.id || row.consultation_id || `${index}`;
                      const recordType = row.type || row.consultation_type || "";
                      const recordQuestion = row.question || row.consultation_question || "";
                      const requestDate = row.requested_at ? formatTimeAgoArabic(row.requested_at) : "-";
                      const typeLabel =  recordType === "SCHEDULING" ? "السؤال" : recordType === "CONTENT" ? "محتوى" : recordType;
                      const rawRequester =
                        row.consultant_name ||
                        contentRequest?.submitter_name ||
                        user?.username ||
                        user?.name ||
                        "-";
                      const requesterName =
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(rawRequester))
                          ? (contentRequest?.submitter_name || "مقدم الطلب")
                          : rawRequester;
                      const consultationStatusLabels: Record<string, string> = {
                        PENDING: "قيد الانتظار",
                        RESPONDED: "تم الرد",
                        CANCELLED: "ملغاة",
                        COMPLETED: "مكتمل",
                        DRAFT: "مسودة",
                        SUPERSEDED: "معلق",
                      };

                      const flatItems: Array<{
                        id: string;
                        text: string;
                        status: string;
                        name: string;
                        respondedAt: string | null;
                        requestNumber: string | null;
                      }> = [];
                      if (row.assignees?.length) {
                        row.assignees.forEach((a) => {
                          if (a.answers?.length) {
                            a.answers.forEach((ans, ai) => {
                              const ansId =
                                (ans as { answer_id?: string }).answer_id ??
                                (ans as { id?: string }).id ??
                                `ans-${recordId}-${index}-${flatItems.length}`;
                              const ansText =
                                (ans as { text?: string }).text ?? (ans as { answer?: string }).answer ?? "";
                              flatItems.push({
                                id: ansId,
                                text: ansText,
                                status: a.status,
                                name: getAssigneeDisplayName(a),
                                respondedAt: (ans as { responded_at?: string | null }).responded_at ?? null,
                                requestNumber: a.request_number,
                              });
                            });
                          } else {
                            flatItems.push({
                              id: a.user_id,
                              text: "",
                              status: a.status,
                              name: getAssigneeDisplayName(a),
                              respondedAt: a.responded_at,
                              requestNumber: a.request_number,
                            });
                          }
                        });
                      } else if (row.consultation_answers?.length) {
                        row.consultation_answers.forEach((a, ai) =>
                          flatItems.push({
                            id:
                              (a as { consultation_id?: string }).consultation_id ||
                              (a as { external_id?: string }).external_id ||
                              `ans-${index}-${ai}`,
                            text: (a as { consultation_answer?: string }).consultation_answer ?? "",
                            status: a.status,
                            name: row.consultant_name || "",
                            respondedAt: (a as { responded_at?: string }).responded_at ?? null,
                            requestNumber: row.consultation_request_number || null,
                          }),
                        );
                      } else if (row.assignee_sections?.length) {
                        row.assignee_sections.forEach((a) =>
                          flatItems.push({
                            id: a.user_id,
                            text: a.answers?.join(" | ") || "",
                            status: a.status,
                            name: getAssigneeDisplayName({ assignee_name: a.assignee_name }),
                            respondedAt: a.responded_at,
                            requestNumber: a.consultation_record_number || null,
                          }),
                        );
                      }

                      return (
                        <div key={`consultation-${recordId}-${index}`} className="flex flex-col gap-0">
                          {/* Question bubble (sent – right-aligned teal) */}
                          <div className="px-5 pt-5 pb-3">
                            <div className="flex items-start gap-3" dir="rtl">
                              <div className="flex-shrink-0">
                                <div className="w-9 h-9 rounded-full bg-[#048F86]/10 border border-[#048F86]/20 flex items-center justify-center">
                                  <span className="text-xs font-bold text-[#048F86]">
                                    {requesterName?.charAt(0)?.toUpperCase() || "?"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-[#1F2937]">{requesterName}</span>
                                  <span className="text-[11px] text-[#9CA3AF]">{requestDate}</span>
                                  {row.round_number != null && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700 font-medium">
                                      الجولة {row.round_number}
                                    </span>
                                  )}
                                  {row.status && (
                                    <StatusBadge
                                      status={row.status}
                                      label={consultationStatusLabels[row.status] || row.status}
                                    />
                                  )}
                                </div>
                                <div className="bg-[#048F86]/5 border border-[#048F86]/10 rounded-2xl rounded-tr-sm px-4 py-3 inline-block max-w-[85%]">
                                  <p className="text-[14px] text-[#1F2937] leading-relaxed whitespace-pre-wrap">
                                    {recordQuestion || "-"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Response bubbles (received – left-aligned gray) */}
                          <div className="px-5 pb-5 pt-1">
                            {flatItems.length > 0 ? (
                              <div className="flex flex-col gap-3">
                                {flatItems.map((item) => (
                                  <div key={item.id} className="flex items-start gap-3" dir="ltr">
                                    <div className="flex-shrink-0">
                                      <div className="w-9 h-9 rounded-full bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center">
                                        <span className="text-xs font-bold text-[#92400E]">
                                          {item.name?.charAt(0)?.toUpperCase() || "?"}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-semibold text-[#1F2937]">{item.name || "-"}</span>
                                        {item.respondedAt && (
                                          <span className="text-[11px] text-[#9CA3AF]">
                                            {formatTimeAgoArabic(item.respondedAt)}
                                          </span>
                                        )}
                                        <StatusBadge
                                          status={item.status}
                                          label={consultationStatusLabels[item.status] || item.status}
                                        />
                                      </div>
                                      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl rounded-tl-sm px-4 py-3 inline-block max-w-[85%]">
                                        <p className="text-[14px] text-[#374151] leading-relaxed whitespace-pre-wrap">
                                          {item.text?.trim() || "—"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {/* Analyze contradictions button (when multiple responses) */}
                                {flatItems.length > 1 && (
                                  <div className="flex justify-end mt-2" dir="rtl">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const sentences = flatItems.map((r) => r.text).filter(Boolean);
                                        if (sentences.length > 0) {
                                          setAnalyzingRecordId(recordId);
                                          analyzeContradictionsMutation.mutate(sentences);
                                        }
                                      }}
                                      disabled={
                                        analyzeContradictionsMutation.isPending && analyzingRecordId === recordId
                                      }
                                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-xs transition-colors bg-[#048F86]/10 text-[#048F86] hover:bg-[#048F86]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {analyzeContradictionsMutation.isPending && analyzingRecordId === recordId
                                        ? "جاري التحليل..."
                                        : "تقييم التعارض بين افادات المستشارين"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-xl w-fit"
                                dir="ltr"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]" />
                                <p className="text-sm text-[#9CA3AF]">لا يوجد رد بعد</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                    );
                  })()
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#F2F4F7] flex items-center justify-center">
                      <ClipboardCheck className="w-6 h-6 text-[#98A2B3]" />
                    </div>
                    <p className="text-[15px] font-semibold text-[#344054]">سجل الاستشارات</p>
                    <p className="text-[13px] text-[#667085]">لا توجد استشارات بعد</p>
                  </div>
                )}
              </div>

              {/* Inline chat input – consultant picker + question (fixed at bottom) */}
              {meetingStatus !== MeetingStatus.RETURNED_FROM_CONTENT &&
                meetingStatus !== MeetingStatus.SCHEDULED_ADDITIONAL_INFO && (
                  <div className="flex-shrink-0 border-t border-[#F3F4F6] bg-[#FAFAFA] rounded-b-2xl px-6 pb-6 pt-4">
                    {/* Consultant picker (expandable) */}
                    {showConsultantPicker && (
                      <div className="px-5 pt-4 pb-2 border-b border-[#F3F4F6]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-[#344054]">اختر المستشار</span>
                          {selectedConsultantId && (
                            <span className="text-xs text-[#048F86] font-medium bg-[#048F86]/10 px-2 py-0.5 rounded-full">
                              1 مستشار
                            </span>
                          )}
                        </div>
                        <div className="relative mb-2">
                          <Input
                            type="text"
                            value={consultantSearch}
                            onChange={(e) => setConsultantSearch(e.target.value)}
                            placeholder="ابحث بالاسم أو البريد..."
                            className="h-9 text-right text-sm rounded-lg border-[#E5E7EB] bg-white pr-3 pl-8"
                          />
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                        </div>
                        <div className="max-h-[160px] overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white">
                          {isLoadingConsultants ? (
                            <div className="py-4 text-center">
                              <Loader2 className="w-4 h-4 animate-spin text-[#048F86] mx-auto" />
                            </div>
                          ) : consultants.length === 0 ? (
                            <div className="py-4 text-center text-sm text-[#9CA3AF]">لا توجد نتائج</div>
                          ) : (
                            <div className="py-1">
                              {consultants.map((c) => {
                                const isSelected = selectedConsultantId === c.id;
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setSelectedConsultantId(isSelected ? "" : c.id)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-right transition-colors hover:bg-[#F9FAFB] ${isSelected ? "bg-[#048F86]/5" : ""}`}
                                  >
                                    <div
                                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-[#048F86] border-[#048F86]" : "border-[#D1D5DB] bg-white"}`}
                                    >
                                      {isSelected && (
                                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                          <path
                                            d="M10 3L4.5 8.5L2 6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                    <div className="flex-shrink-0">
                                      <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${isSelected ? "bg-[#048F86]/15 text-[#048F86]" : "bg-[#F3F4F6] text-[#6B7280]"}`}
                                      >
                                        {c.first_name?.charAt(0)?.toUpperCase() || "?"}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0 text-right">
                                      <span className="text-sm text-[#1F2937]">
                                        {c.first_name} {c.last_name}
                                      </span>
                                      <span className="text-[11px] text-[#9CA3AF] mr-1.5">{c.email}</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {/* Selected consultant chip */}
                        {selectedConsultantId &&
                          (() => {
                            const selected = consultants.find((c) => c.id === selectedConsultantId);
                            return selected ? (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                <span className="inline-flex items-center gap-1 bg-[#048F86]/10 text-[#048F86] text-xs font-medium px-2 py-1 rounded-full">
                                  {selected.first_name} {selected.last_name}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedConsultantId("")}
                                    className="hover:text-[#037A72]"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              </div>
                            ) : null;
                          })()}
                      </div>
                    )}

                    {/* Input row */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!selectedConsultantId || !consultationNotes.trim()) return;
                        handleSubmitConsultation("submit");
                      }}
                      className="flex items-end gap-3 px-5 py-4"
                    >
                      {/* Toggle consultant picker */}
                      <button
                        type="button"
                        onClick={() => setShowConsultantPicker((v) => !v)}
                        className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors border relative ${showConsultantPicker ? "bg-[#048F86]/10 border-[#048F86]/30 text-[#048F86]" : "bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#048F86]/40 hover:text-[#048F86]"}`}
                        title="اختيار المستشار"
                      >
                        <Users className="w-5 h-5" />
                        {selectedConsultantId && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#048F86] text-white text-[9px] font-bold flex items-center justify-center">
                            1
                          </span>
                        )}
                      </button>
                      <div className="flex-1 relative">
                        <Textarea
                          value={consultationNotes}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConsultationNotes(e.target.value)}
                          placeholder={
                            !selectedConsultantId ? "اختر المستشار أولاً ثم اكتب سؤالك..." : "اكتب سؤال الاستشارة..."
                          }
                          className="w-full min-h-[44px] max-h-[120px] text-right text-sm rounded-xl border-[#E5E7EB] bg-white resize-none focus:border-[#048F86] focus:ring-[#048F86]/20"
                          rows={1}
                          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (selectedConsultantId && consultationNotes.trim()) {
                                handleSubmitConsultation("submit");
                              }
                            }
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={
                          !selectedConsultantId || !consultationNotes.trim() || submitConsultationMutation.isPending
                        }
                        className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#048F86] hover:bg-[#037A72] text-white"
                      >
                        {submitConsultationMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5 rotate-180"
                          >
                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                          </svg>
                        )}
                      </button>
                    </form>
                  </div>
                )}
            </div>
          )}

          {/* Compare presentations result modal (تقييم الاختلاف بين العروض) – same as meeting detail */}
          <Dialog open={isCompareModalOpen} onOpenChange={setIsCompareModalOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                  تقييم الاختلاف بين العروض
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                {compareByAttachmentMutation.isPending ? (
                  <p className="text-center text-gray-500 py-6">جاري تقييم الاختلاف بين العروض...</p>
                ) : compareByAttachmentMutation.isError ? (
                  <div className="text-center py-4">
                    <p className="text-red-600 font-medium mb-1">حدث خطأ أثناء تقييم الاختلاف</p>
                    {compareErrorDetail ? (
                      <p className="text-gray-700 text-sm mt-2 text-right">
                        {translateCompareErrorDetail(compareErrorDetail) ?? compareErrorDetail}
                      </p>
                    ) : (
                      <p className="text-gray-600 text-sm mt-2">يرجى المحاولة لاحقاً.</p>
                    )}
                  </div>
                ) : compareResult ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500">معرف التقييم</span>
                        <span className="font-medium text-gray-900">{compareResult.comparison_id || "—"}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500">الدرجة الإجمالية</span>
                        <span className="font-medium text-gray-900">{compareResult.overall_score ?? "—"}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500">مستوى الاختلاف</span>
                        <span className="font-medium text-gray-900">
                          {translateCompareValue(compareResult.difference_level, COMPARE_LEVEL)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500">الحالة</span>
                        <span className="font-medium text-gray-900">
                          {translateCompareValue(compareResult.status, COMPARE_STATUS)}
                        </span>
                      </div>
                    </div>
                    {compareResult.regeneration_recommendation ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500 text-sm">توصية إعادة التوليد</span>
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {translateCompareValue(compareResult.regeneration_recommendation, COMPARE_RECOMMENDATION)}
                        </p>
                      </div>
                    ) : null}
                    {compareResult.summary ? (
                      <div className="flex flex-col gap-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <span className="text-gray-700 font-medium">ملخص الشرائح</span>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span>الشرائح الأصلية: {compareResult.summary.total_slides_original ?? "—"}</span>
                          <span>الشرائح الجديدة: {compareResult.summary.total_slides_new ?? "—"}</span>
                          <span>فرق العدد: {compareResult.summary.slide_count_difference ?? "—"}</span>
                          <span>بدون تغيير: {compareResult.summary.unchanged_slides ?? "—"}</span>
                          <span>تغييرات طفيفة: {compareResult.summary.minor_changes ?? "—"}</span>
                          <span>تغييرات متوسطة: {compareResult.summary.moderate_changes ?? "—"}</span>
                          <span>تغييرات كبيرة: {compareResult.summary.major_changes ?? "—"}</span>
                          <span>شرائح جديدة: {compareResult.summary.new_slides ?? "—"}</span>
                        </div>
                      </div>
                    ) : null}
                    {compareResult.ai_insights && Object.keys(compareResult.ai_insights).length > 0 ? (
                      <div className="flex flex-col gap-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <span className="text-gray-700 font-medium">رؤى الذكاء الاصطناعي</span>
                        {(() => {
                          const ai = compareResult.ai_insights as {
                            main_topics?: string[];
                            business_impact?: string;
                            risk_assessment?: string;
                            presentation_coherence?: string;
                            slide_count_comparison?: {
                              original_count?: number;
                              new_count?: number;
                              difference?: number;
                            };
                          };
                          return (
                            <div className="flex flex-col gap-2 text-sm text-right">
                              {ai.main_topics && Array.isArray(ai.main_topics) && ai.main_topics.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  <span className="text-gray-500">المواضيع الرئيسية</span>
                                  <ul className="list-disc list-inside text-gray-900">
                                    {ai.main_topics.map((t, i) => (
                                      <li key={i}>{t}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                              {ai.business_impact != null && ai.business_impact !== "" ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-gray-500">الأثر على الأعمال</span>
                                  <span className="text-gray-900">{String(ai.business_impact)}</span>
                                </div>
                              ) : null}
                              {ai.risk_assessment != null && ai.risk_assessment !== "" ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-gray-500">تقييم المخاطر</span>
                                  <span className="text-gray-900">{String(ai.risk_assessment)}</span>
                                </div>
                              ) : null}
                              {ai.presentation_coherence != null && ai.presentation_coherence !== "" ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-gray-500">تماسك العرض</span>
                                  <span className="text-gray-900">{String(ai.presentation_coherence)}</span>
                                </div>
                              ) : null}
                              {ai.slide_count_comparison && typeof ai.slide_count_comparison === "object" ? (
                                <div className="flex flex-col gap-1">
                                  <span className="text-gray-500">مقارنة عدد الشرائح</span>
                                  <div className="grid grid-cols-2 gap-2 text-gray-900">
                                    <span>الأصلي: {ai.slide_count_comparison.original_count ?? "—"}</span>
                                    <span>الجديد: {ai.slide_count_comparison.new_count ?? "—"}</span>
                                    <span>
                                      الفرق:{" "}
                                      {ai.slide_count_comparison.difference != null
                                        ? ai.slide_count_comparison.difference
                                        : "—"}
                                    </span>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })()}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="text-gray-500">لا توجد نتيجة لعرضها.</p>
                )}
              </div>
              <DialogFooter className="flex-row-reverse gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  إغلاق
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AttachmentPreviewDrawer
            open={!!previewAttachment}
            onOpenChange={(open) => {
              if (!open) setPreviewAttachment(null);
            }}
            attachment={previewAttachment}
          />

          {/* Analyze contradictions result modal */}
          <Dialog open={isAnalyzeModalOpen} onOpenChange={setIsAnalyzeModalOpen}>
            <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-hidden flex flex-col" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                  تقييم التعارض بين افادات المستشارين
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1 space-y-6">
                {(() => {
                  const categoriesWithContradictions = (analyzeResult?.categories ?? []).filter(
                    (c) => c.contradictions && c.contradictions.length > 0,
                  );
                  return categoriesWithContradictions.length > 0 ? (
                    categoriesWithContradictions.map((category, idx) => (
                      <div key={idx} className="rounded-xl border border-amber-200 bg-amber-50/30 overflow-hidden">
                        <div className="px-4 py-3 bg-amber-100/80 border-b border-amber-200">
                          <h4
                            className="text-base font-semibold text-amber-900 text-right"
                            style={{ fontFamily: "'Almarai', sans-serif" }}
                          >
                            يوجد تعارض في: {category.category_name || `الفئة ${idx + 1}`}
                          </h4>
                        </div>
                        <div className="p-4">
                          <ul className="space-y-3 list-none">
                            {category.contradictions.map((item, i) => {
                              if (typeof item === "string") {
                                return (
                                  <li
                                    key={i}
                                    className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-gray-800 text-right"
                                    style={{ fontFamily: "'Almarai', sans-serif" }}
                                  >
                                    {item}
                                  </li>
                                );
                              }
                              const obj = item as { statements?: string[]; severity?: string; comment?: string };
                              const statementsText = obj.statements?.length ? obj.statements.join(" ← → ") : "";
                              const hasContent = statementsText || obj.severity || obj.comment;
                              if (!hasContent) return null;
                              return (
                                <li
                                  key={i}
                                  className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-right space-y-2"
                                  style={{ fontFamily: "'Almarai', sans-serif" }}
                                >
                                  {statementsText && <p className="text-sm text-gray-800">{statementsText}</p>}
                                  {obj.severity && (
                                    <p className="text-xs font-medium text-amber-800">درجة التعارض: {obj.severity}</p>
                                  )}
                                  {obj.comment && <p className="text-sm text-gray-600">{obj.comment}</p>}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    ))
                  ) : analyzeContradictionsMutation.isError ? (
                    <p className="text-center text-red-600 py-4" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      حدث خطأ أثناء تحليل التعارضات. يرجى المحاولة لاحقاً.
                    </p>
                  ) : (
                    <p className="text-center text-gray-500 py-4" style={{ fontFamily: "'Almarai', sans-serif" }}>
                      لا توجد تعارضات في النتيجة.
                    </p>
                  );
                })()}
              </div>
              <DialogFooter className="border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsAnalyzeModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  إغلاق
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Action Content (Directives + Executive Summary – Content tab only, not Request Information) */}
          {activeTab === "content" && (
            <div className="flex flex-col gap-6">
              {/* إضافة التوجيهات – table like meeting details */}
              <div className="flex flex-col gap-4 w-full mx-auto " dir="rtl">
                <div className="flex items-center justify-between gap-4">
                  <h3
                    className="text-lg font-semibold text-gray-900 text-right"
                    style={{ fontFamily: "'Almarai', sans-serif" }}
                  >
                    إضافة التوجيهات
                  </h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowAddDirectiveRow(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#008774] hover:bg-[#006d5f] text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>إضافة توجيه</span>
                    </button>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={contentRequest?.ext_id == null ? "inline-flex" : undefined}>
                            <button
                              type="button"
                              onClick={handleRequestAiDirectives}
                              // disabled={isLoadingAiSuggestions || hasSuggestedActions || contentRequest?.ext_id == null}
                              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D0D5DD] hover:bg-gray-50 text-gray-700 rounded-lg transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                              style={{ fontFamily: "'Almarai', sans-serif" }}
                            >
                              {isLoadingAiSuggestions ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-[#008774]" />
                                  <span>جاري التحميل...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 text-[#008774]" />
                                  <span>اقتراح بالذكاء الاصطناعي</span>
                                </>
                              )}
                            </button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[260px] text-right">
                          {contentRequest?.ext_id == null ? "لا يوجد اجتماع سابق" : "اقتراح بالذكاء الاصطناعي"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {(() => {
                  const directives = (contentRequest as ContentRequestDetailResponse).related_directives ?? [];
                  const directivesFiltered = directives.filter((d) => !deletedExistingDirectiveIds.has(String(d.id)));
                  const suggestedActionsFiltered = suggestedActionsItems.filter(
                    (s) => !deletedSuggestedActionIds.has(String(s.id)),
                  );
                  const hasDirectives = directivesFiltered.length > 0;
                  const hasOnlyIds = !hasDirectives && (contentRequest.related_directive_ids?.length ?? 0) > 0;
                  const hasAiSuggestions = aiDirectivesSuggestions.length > 0;
                  const hasSuggestedActionsFromApi = suggestedActionsFiltered.length > 0;
                  const hasManualActions = manualAddedActions.length > 0;

                  // Combine existing directives + AI suggestions + suggested-actions + manual-added (from list actions)
                  const allDirectives: Array<{
                    id: string;
                    isAi: boolean;
                    isSuggestedAction?: boolean;
                    isManualAction?: boolean;
                    directive_text?: string;
                    directive?: string;
                    entity?: string;
                    responsible_entity?: string;
                    deadline?: string | null;
                    due_date?: string;
                    status?: string;
                    directive_number?: string;
                    directive_date?: string;
                    related_meeting?: string | null;
                    responsible_persons?: Array<{ id: string | null; name: string; position: string | null }>;
                    directive_status?: string;
                    notes?: string;
                    related_meeting_request?: string | null;
                    /** For isManualAction: the full ActionItem. */
                    manualAction?: ActionItem;
                  }> = [
                    ...directivesFiltered.map((d) => ({ ...d, isAi: false, isSuggestedAction: false })),
                    ...aiDirectivesSuggestions.map((d) => ({
                      ...d,
                      isAi: true,
                      isSuggestedAction: false,
                      directive: editableAiDirectives[d.id]?.directive_text || d.directive_text,
                      entity: editableAiDirectives[d.id]?.responsible_entity || d.responsible_entity,
                      deadline: editableAiDirectives[d.id]?.due_date || d.due_date,
                      status: editableAiDirectives[d.id]?.status || d.status,
                    })),
                    ...suggestedActionsFiltered.map((s) => ({
                      id: `suggested-${s.id}`,
                      isAi: false,
                      isSuggestedAction: true,
                      directive: s.title ?? "-",
                      due_date: s.due_date ?? undefined,
                      status: s.status ?? undefined,
                    })),
                    ...manualAddedActions.map((a) => ({
                      id: `manual-${a.id}`,
                      isAi: false,
                      isSuggestedAction: false,
                      isManualAction: true,
                      directive: a.title ?? "-",
                      due_date: a.due_date ?? undefined,
                      status: a.status ?? undefined,
                      manualAction: a,
                    })),
                  ];

                  /** Normalize assignees to string[] (API may return JSON array or string). */
                  const assigneesList = (a: unknown): string[] => {
                    if (Array.isArray(a)) return a.filter((x): x is string => typeof x === "string");
                    if (typeof a === "string") {
                      try {
                        const parsed = JSON.parse(a) as unknown;
                        return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
                      } catch {
                        return [];
                      }
                    }
                    return [];
                  };

                  if (
                    hasDirectives ||
                    hasAiSuggestions ||
                    hasSuggestedActionsFromApi ||
                    hasManualActions ||
                    showAddDirectiveRow
                  ) {
                    return (
                      <div className="w-full overflow-x-auto border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full" style={{ fontFamily: "'Almarai', sans-serif" }}>
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-16">#</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">التوجيه</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-32">
                                الموعد النهائي
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-28">الحالة</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 min-w-[120px]">
                                المعينون
                              </th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-24">
                                الإجراءات
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {allDirectives.map((directive, index) => {
                              const isAi = "isAi" in directive && directive.isAi;
                              const isSuggestedAction = "isSuggestedAction" in directive && directive.isSuggestedAction;
                              const isManualAction = "isManualAction" in directive && directive.isManualAction;
                              const directiveId = directive.id;

                              // Row from "إضافة توجيه" async select (list actions) – editable due_date, status, assignees
                              if (isManualAction && directive.manualAction) {
                                const a = directive.manualAction;
                                const dueDate =
                                  manualActionEdits[a.id]?.due_date !== undefined
                                    ? manualActionEdits[a.id].due_date
                                    : a.due_date;
                                const status = manualActionEdits[a.id]?.status ?? a.status ?? "PENDING";
                                const assignees = getManualActionAssignees(a.id, a.assignees ?? []);
                                const assigneeInput = assigneeInputByActionId[a.id] ?? "";
                                return (
                                  <tr key={directiveId} className="hover:bg-gray-50 transition-colors bg-[#F0FDF4]/50">
                                    <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700" dir="rtl">
                                      {a.title ?? "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                      <FormDatePicker
                                        value={dueDate ?? ""}
                                        onChange={(v) => {
                                          if (v && startOfLocalDay(new Date(v + "T12:00:00")) < startOfLocalDay(new Date())) {
                                            return;
                                          }
                                          updateManualActionDueDate(a.id, v || null);
                                        }}
                                        placeholder="dd/mm/yyyy"
                                        className="min-w-[120px] text-right"
                                        fromDate={directiveDueDateFromDate}
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Select
                                        value={status}
                                        onValueChange={(v) => updateManualActionStatus(a.id, v)}
                                        dir="rtl"
                                      >
                                        <SelectTrigger className="min-w-[140px] text-right" dir="rtl">
                                          <SelectValue placeholder="الحالة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {ACTION_STATUS_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-right">
                                              {opt.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </td>
                                    <td className="px-4 py-3" dir="rtl">
                                      <div className="flex flex-wrap gap-1.5 items-center">
                                        {assignees.map((email, i) => (
                                          <span
                                            key={`${email}-${i}`}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#008774]/15 text-[#008774] text-xs"
                                          >
                                            {email}
                                            <button
                                              type="button"
                                              onClick={() => removeManualActionAssignee(a.id, i, assignees)}
                                              className="p-0.5 rounded hover:bg-[#008774]/20"
                                              aria-label="حذف"
                                            >
                                              <span className="sr-only">حذف</span>
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </span>
                                        ))}
                                        <Input
                                          value={assigneeInput}
                                          onChange={(e) =>
                                            setAssigneeInputByActionId((p) => ({ ...p, [a.id]: e.target.value }))
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();
                                              addManualActionAssignee(a.id, assigneeInput, assignees);
                                              setAssigneeInputByActionId((p) => ({ ...p, [a.id]: "" }));
                                            }
                                          }}
                                          placeholder="إضافة معين..."
                                          className="h-8 min-w-[80px] max-w-[120px] text-xs text-right"
                                          dir="rtl"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            addManualActionAssignee(a.id, assigneeInput, assignees);
                                            setAssigneeInputByActionId((p) => ({ ...p, [a.id]: "" }));
                                          }}
                                          className="p-1 rounded border border-[#D0D5DD] hover:bg-gray-100 text-gray-600"
                                          title="إضافة"
                                        >
                                          <svg
                                            className="w-3.5 h-3.5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M12 4v16m8-8H4"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex justify-center">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteManualAction(a.id)}
                                          className="flex items-center justify-center gap-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="حذف"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }

                              // Read-only row from GET .../suggested-actions API – deletable
                              if (isSuggestedAction) {
                                const rawId = String(directiveId).replace(/^suggested-/, "");
                                const suggestedItem = suggestedActionsFiltered.find((s) => String(s.id) === rawId);
                                const assignees = suggestedItem ? assigneesList(suggestedItem.assignees) : [];
                                return (
                                  <tr key={directiveId} className="hover:bg-gray-50 transition-colors bg-[#F9FAFB]/50">
                                    <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700" dir="rtl">
                                      {directive.directive ?? "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{directive.due_date ?? "—"}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{directive.status ?? "—"}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700" dir="rtl">
                                      {assignees.length ? assignees.join("، ") : "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex justify-center">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteSuggestedAction(directiveId)}
                                          className="flex items-center justify-center gap-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="حذف"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }

                              if (isAi && editableAiDirectives[directiveId]) {
                                const editable = editableAiDirectives[directiveId];
                                const action = aiDirectiveActions[directiveId];
                                return (
                                  <tr
                                    key={directiveId}
                                    className="bg-purple-50/20 hover:bg-purple-50/40 transition-colors"
                                  >
                                    <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                                    <td className="px-4 py-3">
                                      <Textarea
                                        value={editable.directive_text}
                                        onChange={(e) =>
                                          handleUpdateAiDirective(directiveId, "directive_text", e.target.value)
                                        }
                                        className="w-full text-sm min-h-[60px] resize-none"
                                        placeholder="أدخل نص التوجيه..."
                                        dir="rtl"
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{action?.due_date ?? "—"}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{action?.status ?? "—"}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700" dir="rtl">
                                      {action?.assignees?.length ? action.assignees.join("، ") : "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex justify-center">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteAiDirective(directiveId)}
                                          className="flex items-center justify-center gap-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          title="حذف"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }

                              // Regular directive row (from API – deletable from list)
                              return (
                                <tr key={directiveId} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {directive.directive || directive.directive_text || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {(directive as { deadline?: string | null }).deadline ?? "—"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {(directive as { directive_status?: string }).directive_status ?? "—"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700" dir="rtl">
                                    {(
                                      (directive as { responsible_persons?: Array<{ name?: string }> })
                                        .responsible_persons ?? []
                                    )
                                      .map((p) => p.name)
                                      .filter(Boolean)
                                      .join("، ") || "—"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex justify-center">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteExistingDirective(directiveId)}
                                        className="flex items-center justify-center gap-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="حذف"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {showAddDirectiveRow && (
                              <tr
                                key="add-directive-row"
                                className="bg-[#F0FDF4]/30 border-t-2 border-dashed border-[#008774]/30"
                              >
                                <td className="px-4 py-3 text-sm text-gray-700">{allDirectives.length + 1}</td>
                                <td className="px-4 py-3" dir="rtl">
                                  <div className="min-w-[200px] max-w-full">
                                    <FormAsyncSelectV2
                                      value={addDirectiveSelectValue}
                                      onValueChange={handleAddDirectiveSelectChange}
                                      loadOptions={loadActionsForAddDirective}
                                      placeholder="ابحث واختر التوجيه..."
                                      searchPlaceholder="ابحث في التوجيهات..."
                                      emptyMessage="لا توجد نتائج"
                                      fullWidth
                                      limit={20}
                                      defaultOptions={false}
                                      className="text-right"
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">—</td>
                                <td className="px-4 py-3 text-sm text-gray-500">—</td>
                                <td className="px-4 py-3 text-sm text-gray-500">—</td>
                                <td className="px-4 py-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowAddDirectiveRow(false);
                                      setAddDirectiveSelectValue(null);
                                    }}
                                    className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100"
                                    style={{ fontFamily: "'Almarai', sans-serif" }}
                                  >
                                    إلغاء
                                  </button>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  if (hasOnlyIds) {
                    return (
                      <div className="w-full overflow-x-auto border border-gray-200 rounded-xl overflow-hidden">
                        <DataTable
                          columns={[
                            {
                              id: "index",
                              header: "#",
                              width: "w-28",
                              align: "center",
                              render: (_: { id: string }, i: number) => (
                                <span
                                  className="text-sm text-[#475467]"
                                  style={{ fontFamily: "'Almarai', sans-serif" }}
                                >
                                  {i + 1}
                                </span>
                              ),
                            },
                            {
                              id: "directive_id",
                              header: "التوجيه",
                              width: "flex-1",
                              align: "end",
                              render: (row: { id: string }) => (
                                <span
                                  className="text-sm text-[#475467]"
                                  style={{ fontFamily: "'Almarai', sans-serif" }}
                                >
                                  {row.id}
                                </span>
                              ),
                            },
                          ]}
                          data={((contentRequest.related_guidance as unknown as any[]) || []).map((guidance: any) => ({
                            id: guidance?.directive_text,
                          }))}
                          rowPadding="py-3"
                          variant="default"
                        />
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center justify-center py-12 rounded-xl border border-gray-200 bg-[#F9FAFB]">
                      <div className="text-center">
                        <p className="text-gray-600 text-lg mb-2" style={{ fontFamily: "'Almarai', sans-serif" }}>
                          إضافة التوجيهات
                        </p>
                        <p className="text-gray-500 text-sm" style={{ fontFamily: "'Almarai', sans-serif" }}>
                          لا توجد توجيهات مرتبطة.
                        </p>
                      </div>
                    </div>
                  );
                })()}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-gray-700 text-right"
                    style={{ fontFamily: "'Almarai', sans-serif" }}
                  >
                    إضافة ملاحظات
                  </label>
                  <Textarea
                    value={guidanceNotes}
                    onChange={(e) => setGuidanceNotes(e.target.value)}
                    placeholder="أدخل محتوى التوجيهات...."
                    className="min-h-[120px] resize-none"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Executive Summary Upload Section */}
              <div className="flex flex-col gap-4 w-full mx-auto ">
                <h3
                  className="text-lg font-semibold text-gray-900 text-right"
                  style={{ fontFamily: "'Almarai', sans-serif" }}
                >
                  الملخص التنفيذي
                </h3>

                {/* File Upload Area */}
                <div
                  onDragOver={!sendToSchedulingMutation.isPending ? handleDragOver : undefined}
                  onDragLeave={!sendToSchedulingMutation.isPending ? handleDragLeave : undefined}
                  onDrop={!sendToSchedulingMutation.isPending ? handleDrop : undefined}
                  onClick={
                    !sendToSchedulingMutation.isPending && !executiveSummaryFile
                      ? () => fileInputRef.current?.click()
                      : undefined
                  }
                  className={`
                  relative border-2 border-dashed rounded-[12px] p-12 text-center transition-colors
                  ${isDragging && !sendToSchedulingMutation.isPending ? "border-[#048F86] bg-[#048F86]/5" : "border-[#D1D5DB] bg-[#F9FAFB]"}
                  ${executiveSummaryFile ? "border-[#048F86] bg-[#048F86]/5" : ""}
                  ${sendToSchedulingMutation.isPending ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"}
                `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileSelect}
                    disabled={sendToSchedulingMutation.isPending}
                    className="hidden"
                  />

                  {executiveSummaryFile ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-3 px-4 py-2 bg-white border border-[#009883] rounded-[12px]">
                        {executiveSummaryFile.type === "application/pdf" ? (
                          <img src={pdfIcon} alt="pdf" className="w-10 h-10 object-contain" />
                        ) : (
                          <div className="flex items-center justify-center w-10 h-10 bg-[#E2E5E7] rounded-md text-xs font-semibold text-[#B04135]">
                            {executiveSummaryFile.name.split(".").pop()?.toUpperCase() || "FILE"}
                          </div>
                        )}
                        <div className="flex flex-col items-end">
                          <span
                            className="text-sm font-medium text-[#344054] text-right"
                            style={{ fontFamily: "'Almarai', sans-serif" }}
                          >
                            {executiveSummaryFile.name}
                          </span>
                          <span
                            className="text-xs text-[#475467] text-right"
                            style={{ fontFamily: "'Almarai', sans-serif" }}
                          >
                            {formatFileSize(executiveSummaryFile.size)}
                          </span>
                        </div>
                        <button
                          onClick={handleRemoveFile}
                          disabled={sendToSchedulingMutation.isPending}
                          className="ml-4 p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center mb-4">
                        <Upload className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-base text-[#1A1A1A] mb-2" style={{ fontFamily: "'Almarai', sans-serif" }}>
                        اضغط للرفع أو اسحب الملف هنا
                      </p>
                      <p className="text-sm text-[#666666]" style={{ fontFamily: "'Almarai', sans-serif" }}>
                        PDF, WORD, EXCEL (max. 20MB)
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div>
        {/* Actions bar – same FAB + arc as meeting detail (hidden when scheduled for content update) */}
        {meetingStatus !== MeetingStatus.RETURNED_FROM_CONTENT &&
          meetingStatus !== MeetingStatus.SCHEDULED_ADDITIONAL_INFO && (
            <MeetingActionsBar
              meetingStatus={MeetingStatus.UNDER_REVIEW}
              open={actionsBarOpen}
              onOpenChange={setActionsBarOpen}
              onOpenSchedule={() => {}}
              onOpenReject={() => {}}
              onOpenEditConfirm={() => {}}
              onOpenReturnForInfo={() => {}}
              onOpenSendToContent={() => {}}
              onAddToWaitingList={() => {}}
              isAddToWaitingListPending={false}
              hasChanges={false}
              hasContent={false}
              customActions={[
                {
                  icon: sendToSchedulingMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.26} />
                  ) : (
                    <Send className="w-5 h-5" strokeWidth={1.26} />
                  ),
                  label: sendToSchedulingMutation.isPending ? "جاري الإرسال..." : "إرسال إلى مسؤول الجدولة",
                  onClick: handleSendToScheduling,
                  disabled: sendToSchedulingMutation.isPending || !executiveSummaryFile,
                  disabledReason: !executiveSummaryFile ? "يرجى إرفاق الملخص التنفيذي أولاً" : undefined,
                },
                {
                  icon: <RotateCcw className="w-5 h-5" strokeWidth={1.26} />,
                  label: "إعادة للطلب",
                  onClick: handleReturnRequest,
                  disabled: submitReturnMutation.isPending,
                },
                ...(draftsRecords && draftsRecords.length > 0
                  ? [
                      {
                        icon: <MessageSquare className="w-5 h-5" strokeWidth={1.26} />,
                        label: `مسودات (${draftsRecords.length})`,
                        onClick: () => setIsDraftsModalOpen(true),
                      },
                    ]
                  : []),
              ]}
            />
          )}
      </div>

      {/* Attachment LLM notes/insights modal (ملاحظات على العرض) – same as meeting detail */}
      <Dialog
        open={!!insightsModalAttachment}
        onOpenChange={(open) => {
          if (!open) {
            insightsAbortControllerRef.current?.abort();
            insightsAbortControllerRef.current = null;
            setInsightsModalAttachment(null);
            insightsMutation.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-hidden p-0" dir="rtl">
          <div className="relative px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-[#048F86] via-[#06B6A4] to-[#A6D8C1]" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#048F86] to-[#06B6A4]">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <DialogHeader className="p-0">
                  <DialogTitle
                    className="text-right text-[16px] font-bold text-[#101828]"
                    style={{ fontFamily: "'Almarai', sans-serif" }}
                  >
                    تحليل العرض التقديمي
                  </DialogTitle>
                </DialogHeader>
                {insightsModalAttachment?.file_name && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <FileText className="h-3.5 w-3.5 text-[#667085] flex-shrink-0" />
                    <span
                      className="text-[13px] text-[#667085] truncate"
                      style={{ fontFamily: "'Almarai', sans-serif" }}
                    >
                      {insightsModalAttachment.file_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className="px-6 py-5 overflow-y-auto"
            style={{ maxHeight: "calc(85vh - 160px)", fontFamily: "'Almarai', sans-serif" }}
          >
            {insightsMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="relative">
                  <div className="h-14 w-14 rounded-full bg-[#E6F9F8] flex items-center justify-center">
                    <Loader2 className="h-7 w-7 text-[#048F86] animate-spin" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[15px] font-semibold text-[#101828]">جاري التحليل...</span>
                  <span className="text-[13px] text-[#667085]">يتم تحليل العرض التقديمي بواسطة الذكاء الاصطناعي</span>
                </div>
              </div>
            ) : insightsMutation.isError ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[15px] font-semibold text-[#101828]">تعذّر إتمام التحليل</span>
                  <span className="text-[13px] text-[#667085]">حدث خطأ أثناء جلب الملاحظات. يرجى المحاولة لاحقاً.</span>
                </div>
              </div>
            ) : insightsMutation.data != null &&
              insightsModalAttachment?.id === insightsMutation.variables?.attachmentId ? (
              (() => {
                const d = insightsMutation.data as Record<string, unknown> & AttachmentInsightsResponse;
                const notes: string[] = Array.isArray(d.llm_notes)
                  ? d.llm_notes
                  : d.llm_notes != null
                    ? [].concat(d.llm_notes as any)
                    : [];
                const rawSuggestions =
                  d.llm_suggestions ??
                  (d as Record<string, unknown>).suggestions ??
                  (d.data && typeof d.data === "object" && "llm_suggestions" in d.data
                    ? (d.data as { llm_suggestions: unknown }).llm_suggestions
                    : undefined) ??
                  (d.data && typeof d.data === "object" && "suggestions" in d.data
                    ? (d.data as { suggestions: unknown }).suggestions
                    : undefined);
                const suggestions: string[] = Array.isArray(rawSuggestions)
                  ? rawSuggestions.map((x) =>
                      typeof x === "string"
                        ? x
                        : x && typeof x === "object" && "text" in x
                          ? (x as { text: string }).text
                          : String(x ?? ""),
                    )
                  : rawSuggestions != null
                    ? []
                        .concat(rawSuggestions as any)
                        .map((x: unknown) => (typeof x === "string" ? x : String(x ?? "")))
                    : [];
                if (notes.length === 0 && suggestions.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <div className="h-12 w-12 rounded-full bg-[#F2F4F7] flex items-center justify-center">
                        <ClipboardCheck className="h-6 w-6 text-[#667085]" />
                      </div>
                      <span className="text-[14px] text-[#667085]">لا توجد ملاحظات أو اقتراحات على هذا العرض.</span>
                    </div>
                  );
                }
                return (
                  <div className="flex flex-col gap-5">
                    {notes.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                            <FileText className="h-4 w-4 text-amber-600" />
                          </div>
                          <span className="text-[14px] font-bold text-[#101828]">الملاحظات</span>
                          <span className="text-[12px] text-[#667085] bg-[#F2F4F7] rounded-full px-2 py-0.5">
                            {notes.length}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 mr-1">
                          {notes.map((note, idx) => (
                            <div
                              key={idx}
                              className="flex gap-3 items-start p-3 rounded-xl bg-[#FFFBF5] border border-amber-100"
                            >
                              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold mt-0.5">
                                {idx + 1}
                              </span>
                              <p className="text-[13px] text-[#344054] leading-[22px] whitespace-pre-wrap flex-1">
                                {note}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {suggestions.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F9F8]">
                            <FileText className="h-4 w-4 text-[#048F86]" />
                          </div>
                          <span className="text-[14px] font-bold text-[#101828]">الاقتراحات</span>
                          <span className="text-[12px] text-[#667085] bg-[#F2F4F7] rounded-full px-2 py-0.5">
                            {suggestions.length}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 mr-1">
                          {suggestions.map((s, idx) => (
                            <div
                              key={idx}
                              className="flex gap-3 items-start p-3 rounded-xl bg-[#F6FFFE] border border-[#D0F0ED]"
                            >
                              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#D0F0ED] text-[#048F86] text-[11px] font-bold mt-0.5">
                                {idx + 1}
                              </span>
                              <p className="text-[13px] text-[#344054] leading-[22px] whitespace-pre-wrap flex-1">
                                {typeof s === "string"
                                  ? s
                                  : s && typeof s === "object" && "text" in s
                                    ? (s as { text: string }).text
                                    : String(s ?? "")}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : !insightsMutation.isPending && !insightsMutation.isError ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="h-12 w-12 rounded-full bg-[#F2F4F7] flex items-center justify-center">
                  <FileText className="h-6 w-6 text-[#98A2B3]" />
                </div>
                <span className="text-[14px] text-[#667085]">لا توجد ملاحظات.</span>
              </div>
            ) : null}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={() => {
                insightsAbortControllerRef.current?.abort();
                insightsAbortControllerRef.current = null;
                setInsightsModalAttachment(null);
                insightsMutation.reset();
              }}
              className="px-5 py-2.5 rounded-lg border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB] transition-colors text-[14px] font-semibold shadow-sm"
              style={{ fontFamily: "'Almarai', sans-serif" }}
            >
              إغلاق
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Request Modal */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
              إعادة الطلب لمقدم الطلب
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-gray-700 text-right"
                style={{ fontFamily: "'Almarai', sans-serif" }}
              >
                الملاحظات *
              </label>
              <Textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="أدخل الملاحظات...."
                className="min-h-[150px] resize-none"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <button
              onClick={handleSubmitReturn}
              disabled={submitReturnMutation.isPending || !returnNotes.trim()}
              className="px-4 py-2 bg-[#29615C] hover:bg-[#1f4a45] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Almarai', sans-serif" }}
            >
              {submitReturnMutation.isPending ? "جاري الإرسال..." : "إرسال"}
            </button>
            <button
              onClick={() => setIsReturnModalOpen(false)}
              disabled={submitReturnMutation.isPending}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Almarai', sans-serif" }}
            >
              إلغاء
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consultation Request Modal – removed, now inline in chat */}

      {/* Drafts Modal */}
      <Dialog open={isDraftsModalOpen} onOpenChange={setIsDraftsModalOpen}>
        <DialogContent className="sm:max-w-[700px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
              مسودات الاستشارات
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto">
            {isLoadingConsultationRecordsWithDrafts ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-600">جاري التحميل...</div>
              </div>
            ) : consultationRecordsWithDrafts && draftsRecords.length > 0 ? (
              draftsRecords.map((draft) => {
                const draftAnswer =
                  draft.consultation_answers?.find((a) => a.is_draft) ?? draft.consultation_answers?.[0];
                const answerText = draftAnswer?.consultation_answer ?? draft.consultation_answer ?? "";
                const draftId = draft.id || draft.consultation_id;
                const draftQuestion = draft.question || draft.consultation_question;
                return (
                  <div key={draftId} className="flex flex-col gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row items-center justify-between">
                        <span
                          className="text-sm font-medium text-gray-700 text-right"
                          style={{ fontFamily: "'Almarai', sans-serif" }}
                        >
                          سؤال الاستشارة:
                        </span>
                        <span className="text-xs text-gray-500" style={{ fontFamily: "'Almarai', sans-serif" }}>
                          {formatDateArabic(draft.requested_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                        {draftQuestion}
                      </p>
                    </div>

                    {answerText && (
                      <div className="flex flex-col gap-2">
                        <span
                          className="text-sm font-medium text-gray-700 text-right"
                          style={{ fontFamily: "'Almarai', sans-serif" }}
                        >
                          الإجابة:
                        </span>
                        <p
                          className="text-sm text-gray-900 text-right whitespace-pre-wrap bg-white p-3 rounded border border-gray-200"
                          style={{ fontFamily: "'Almarai', sans-serif" }}
                        >
                          {answerText}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-row justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handlePublishDraft(draftId!)}
                        disabled={publishDraftMutation.isPending}
                        className="flex flex-row justify-center items-center px-4 py-2 gap-2 h-9 bg-gradient-to-b from-[#3C6FD1] via-[#048F86] to-[#6DCDCD] text-white rounded-lg shadow-[0px_1px_2px_rgba(16,24,40,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontFamily: "'Almarai', sans-serif" }}
                      >
                        {publishDraftMutation.isPending ? "جاري النشر..." : "نشر"}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                  لا توجد مسودات
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row justify-start gap-2 sm:justify-start">
            <button
              type="button"
              onClick={() => setIsDraftsModalOpen(false)}
              className="flex flex-row justify-center items-center px-[18px] py-[10px] gap-2 h-11 bg-white text-[#344054] rounded-lg border border-[#D0D5DD] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] hover:bg-gray-50 transition-colors"
              style={{ fontFamily: "'Almarai', sans-serif" }}
            >
              إغلاق
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentRequestDetail;
