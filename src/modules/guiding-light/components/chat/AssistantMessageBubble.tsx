import { useMemo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, FileText, ExternalLink, HelpCircle, ChevronLeft, Eye, Check, Download, ThumbsUp, ThumbsDown, Bookmark, RefreshCw } from "lucide-react";
import aounLogo from "@gl/assets/icons/aoun-logo.svg";
import { MessageFeedbackModal } from "./MessageFeedbackModal";
import { RegenerateConfirmDialog } from "./RegenerateConfirmDialog";
import { Button } from "@gl/components/ui/button";
import { StatsBlock } from "./StatsBlock";
import { useDocumentViewer } from "@gl/contexts/DocumentViewerContext";
import { isViewableInIframe, getFileViewerUrl } from "@gl/api/pdf-viewer";
import { preprocessResponse } from "@gl/lib/responsePreprocessor";
import { jsPDF } from "jspdf";
import type { MessageResponse } from "@gl/api/types";

interface AssistantMessageBubbleProps {
  content: string;
  isStreaming?: boolean;
  isPendingRequest?: boolean;
  response?: MessageResponse | null;
  onRelatedQuestionClick?: (question: string) => void;
  onRegenerate?: () => void;
}

function isUrl(s: string): boolean {
  const t = s?.trim() ?? "";
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("//");
}

function normalizeRelatedQuestions(questions: string[]): string[] {
  const result: string[] = [];
  for (const q of questions ?? []) {
    if (typeof q !== "string") continue;
    const parts = q.replace(/\\n/g, "\n").split("\n").map((p) => p.trim()).filter((p) => p.length > 0 && p !== "N/A");
    result.push(...parts);
  }
  return Array.from(new Set(result));
}

function AssistantMessageBubble({ content, isStreaming, isPendingRequest, response, onRelatedQuestionClick, onRegenerate }: AssistantMessageBubbleProps) {
  const { openViewer, openViewerWithUrl } = useDocumentViewer();
  const preprocessed = useMemo(() => preprocessResponse(content ?? ""), [content]);
  const [copied, setCopied] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"like" | "dislike" | null>(null);
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<"like" | "dislike" | null>(null);

  const openDoc = (doc: { id?: string; url?: string; name?: string }) => {
    const name = doc.name ?? "المستند";
    const viewable = isViewableInIframe(doc.name ?? null);
    if (doc.url) { if (viewable) openViewerWithUrl(doc.url, name); else window.open(doc.url, "_blank"); }
    else if (doc.id) { if (viewable) openViewer(doc.id, name); else window.open(getFileViewerUrl(doc.id), "_blank"); }
  };

  const displayText = preprocessed.cleanText;
  const hasContent = (displayText ?? "").trim().length > 0;
  const displayContent = hasContent ? displayText : isPendingRequest ? "جاري التحليل..." : " ";

  const handleCopy = useCallback(() => {
    if (displayText) { navigator.clipboard.writeText(displayText); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }, [displayText]);

  const exportAsPdf = useCallback((text: string) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFont("Helvetica");
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 190, 20, { align: "right" });
    doc.save("response.pdf");
  }, []);

  const exportAsWord = useCallback((text: string) => {
    const html = `<html dir="rtl"><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;font-size:14px;line-height:1.8;direction:rtl;padding:40px;}</style></head><body>${text.replace(/\n/g, "<br/>")}</body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "response.doc";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const isLetterResponse = response?.tool_used === "letter_response";

  const documents = useMemo(() => response?.documents ?? [], [response?.documents]);
  const sources = useMemo(() => response?.sources_documents ?? [], [response?.sources_documents]);
  const relatedQuestions = useMemo(() => {
    const fromResponse = normalizeRelatedQuestions(response?.related_questions ?? []);
    const extracted = (preprocessed.extractedQuestions ?? []).filter((q): q is string => typeof q === "string").map((q) => q.trim()).filter((q) => q.length > 0 && q !== "N/A");
    return Array.from(new Set([...fromResponse, ...extracted]));
  }, [response?.related_questions, preprocessed.extractedQuestions]);

  const sourceToDocument = useMemo(() => {
    const map = new Map<string, (typeof documents)[number]>();
    for (const doc of documents) { const n = (doc.name ?? "").trim(); if (n) map.set(n, doc); }
    return map;
  }, [documents]);

  return (
    <div className="flex justify-end" dir="rtl">
      <div className="flex w-full items-start gap-3">
        {/* AI avatar */}
        <div className="mt-1 flex size-7 shrink-0 items-center justify-center">
          <img src={aounLogo} alt="عون" className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Documents for letter response */}
          {isLetterResponse && documents.length > 0 && (
            <div className="mb-4 rounded-2xl border border-border/40 bg-card p-4">
              <div className="mb-2.5 text-[11px] font-semibold text-muted-foreground">المستندات</div>
              <ul className="space-y-2">
                {documents.map((doc, i) => (
                  <li key={doc.id ?? doc.name ?? i} className="flex items-center gap-2.5 justify-end">
                    <span className="truncate text-sm text-foreground/80">{doc.name}</span>
                    {(doc.url || doc.id) && (
                      <button type="button" onClick={() => openDoc(doc)} className="inline-flex items-center gap-1 text-primary text-sm hover:underline">
                        <Eye className="size-3.5" /> معاينة
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Content — rich markdown */}
          <div className="assistant-markdown">
            {hasContent || !isPendingRequest ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-[22px] font-bold text-foreground mb-4 mt-5 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-[19px] font-bold text-foreground mb-3 mt-4 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-[17px] font-semibold text-foreground mb-2.5 mt-3.5 first:mt-0">{children}</h3>,
                  p: ({ children }) => <p className="text-[16px] leading-[1.9] text-foreground/90 mb-3 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-4 space-y-2 pr-1">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-4 space-y-2 pr-1 list-decimal list-inside">{children}</ol>,
                  li: ({ children }) => (
                    <li className="flex items-start gap-2.5 text-[16px] leading-[1.85] text-foreground/90">
                      <span className="mt-[12px] size-[6px] shrink-0 rounded-full bg-primary/50" />
                      <span className="flex-1">{children}</span>
                    </li>
                  ),
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  em: ({ children }) => <em className="text-foreground/70">{children}</em>,
                  blockquote: ({ children }) => (
                    <blockquote className="my-3 border-r-[3px] border-primary/30 pr-3.5 pl-0 text-foreground/70 italic">{children}</blockquote>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    if (isInline) {
                      return <code className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[13px] font-mono text-primary/90">{children}</code>;
                    }
                    return (
                      <pre className="my-3 overflow-x-auto rounded-xl bg-foreground/[0.03] border border-border/30 p-4">
                        <code className={`text-[13px] leading-relaxed font-mono ${className ?? ""}`} {...props}>{children}</code>
                      </pre>
                    );
                  },
                  table: ({ children }) => (
                    <div className="my-3 overflow-x-auto rounded-xl border border-border/40">
                      <table className="w-full text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-muted/30 border-b border-border/30">{children}</thead>,
                  th: ({ children }) => <th className="px-3 py-2 text-right text-[12px] font-semibold text-muted-foreground">{children}</th>,
                  td: ({ children }) => <td className="px-3 py-2 text-right text-[13px] text-foreground/80 border-t border-border/20">{children}</td>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/30">
                      {children}
                    </a>
                  ),
                  hr: () => <hr className="my-4 border-border/30" />,
                }}
              >
                {displayContent}
              </ReactMarkdown>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="size-1.5 rounded-full bg-primary/30 animate-bounce [animation-delay:-0.2s]" />
                  <span className="size-1.5 rounded-full bg-primary/30 animate-bounce [animation-delay:-0.1s]" />
                  <span className="size-1.5 rounded-full bg-primary/30 animate-bounce" />
                </span>
                <span className="text-muted-foreground text-sm">{displayContent}</span>
              </div>
            )}
          </div>

          {/* Action bar */}
          {hasContent && !isStreaming && (
            <div className="mt-3 flex items-center gap-1">
              <Button size="icon" variant="ghost" className="size-9 rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors" onClick={() => exportAsWord(displayText)} title="تصدير Word">
                <svg className="size-5" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M28.806 3H11.194A1.19 1.19 0 0010 4.198v23.604A1.19 1.19 0 0011.194 29h17.612A1.19 1.19 0 0030 27.802V4.198A1.19 1.19 0 0028.806 3z" fill="#41A5EE"/><path d="M30 4.198A1.19 1.19 0 0028.806 3H11.194A1.19 1.19 0 0010 4.198V16h20V4.198z" fill="#2B7CD3"/><path d="M20 16h10v11.802A1.19 1.19 0 0128.806 29H20V16z" fill="#185ABD"/><path d="M10 16h10v13H11.194A1.19 1.19 0 0110 27.802V16z" fill="#103F91"/><path opacity=".1" d="M16.92 7H10v19h6.92A1.2 1.2 0 0018.1 24.8V8.2A1.2 1.2 0 0016.92 7z"/><path d="M15.92 8H10v19h5.92A1.2 1.2 0 0017.1 25.8V9.2A1.2 1.2 0 0015.92 8z" fill="#185ABD"/><path d="M15.92 8H10v17h5.92A1.2 1.2 0 0017.1 23.8V9.2A1.2 1.2 0 0015.92 8z" fill="#2B7CD3"/><rect x="2" y="8" width="15" height="17" rx="1.2" fill="#185ABD"/><path d="M6.2 13.5l1.6 5.7 1.5-5.7h1.5l1.5 5.7 1.5-5.7H15L12.8 21h-1.6l-1.5-5.3L8.2 21H6.6L4.5 13.5h1.7z" fill="white"/></svg>
              </Button>
              <Button
                size="icon" variant="ghost"
                className={`size-9 rounded-xl transition-colors ${feedbackGiven === "like" ? "text-primary bg-primary/10" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/60"}`}
                onClick={() => setFeedbackType("like")}
                title="أعجبني"
              >
                <ThumbsUp className="size-5" />
              </Button>
              <Button
                size="icon" variant="ghost"
                className={`size-9 rounded-xl transition-colors ${feedbackGiven === "dislike" ? "text-destructive bg-destructive/10" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/60"}`}
                onClick={() => setFeedbackType("dislike")}
                title="لم يعجبني"
              >
                <ThumbsDown className="size-5" />
              </Button>
              <Button
                size="icon" variant="ghost"
                className={`size-9 rounded-xl transition-colors ${bookmarked ? "text-primary bg-primary/10" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/60"}`}
                onClick={() => setBookmarked((b) => !b)}
                title="حفظ"
              >
                <Bookmark className={`size-5 ${bookmarked ? "fill-primary" : ""}`} />
              </Button>
              <Button size="icon" variant="ghost" className="size-9 rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors" onClick={handleCopy} title="نسخ">
                {copied ? <Check className="size-5 text-primary" /> : <Copy className="size-5" />}
              </Button>
              <Button
                size="icon" variant="ghost"
                className="size-9 rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
                onClick={() => setShowRegenerate(true)}
                title="إعادة التوليد"
              >
                <RefreshCw className="size-5" />
              </Button>
            </div>
          )}

          {/* Feedback modal */}
          <MessageFeedbackModal
            type={feedbackType ?? "like"}
            open={!!feedbackType}
            onClose={() => setFeedbackType(null)}
            onSubmit={(fb) => { setFeedbackGiven(fb.type); setFeedbackType(null); }}
          />

          {/* Regenerate confirm */}
          <RegenerateConfirmDialog
            open={showRegenerate}
            onClose={() => setShowRegenerate(false)}
            onConfirm={() => { setShowRegenerate(false); onRegenerate?.(); }}
          />

          {/* Related questions */}
          {relatedQuestions.length > 0 && (
            <div className="mt-5 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground">أسئلة ذات صلة</span>
              <div className="flex flex-wrap gap-2">
                {relatedQuestions.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/80 px-3.5 py-2 text-right transition-all hover:border-primary/25 hover:bg-primary/[0.04] hover:shadow-sm group"
                    onClick={() => onRelatedQuestionClick?.(q)}
                  >
                    <HelpCircle className="size-3.5 shrink-0 text-muted-foreground/30 group-hover:text-primary/50" />
                    <span className="text-[13px] text-foreground/65 group-hover:text-foreground">{q}</span>
                    <ChevronLeft className="size-3 shrink-0 text-muted-foreground/15 group-hover:text-primary/40 transition-transform group-hover:-translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {!isLetterResponse && (sources.length > 0 || documents.some((d) => d.id || d.url)) && (
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground">المصادر</span>
              <div className="flex flex-wrap gap-1.5">
                {documents.filter((d) => d.id || d.url).map((doc, i) => (
                  <button key={`doc-${i}`} type="button" onClick={() => openDoc(doc)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-card border border-border/50 px-3 h-8 hover:border-primary/25 hover:bg-primary/[0.04] transition-all text-sm group">
                    <FileText className="size-3 text-muted-foreground/40" />
                    <span className="truncate max-w-[180px] text-[12px]">{doc.name}</span>
                    <Eye className="size-3 text-primary/30 group-hover:text-primary" />
                  </button>
                ))}
                {sources.map((s, i) => {
                  const t = (typeof s === "string" ? s : "").trim();
                  if (!t || /^\d+$/.test(t) || /^\d+\.(pdf|doc|docx|txt|xls|xlsx)$/i.test(t)) return null;
                  const link = isUrl(t);
                  if (!link && sourceToDocument.get(t)?.id) return null;
                  if (link) return (
                    <a key={`s-${i}`} href={t.startsWith("//") ? `https:${t}` : t} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-card border border-border/50 px-3 h-8 hover:border-primary/25 transition-all text-sm no-underline group">
                      <span className="truncate max-w-[180px] text-[12px]">{t.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}</span>
                      <ExternalLink className="size-3 text-primary/30 group-hover:text-primary" />
                    </a>
                  );
                  return (
                    <span key={`s-${i}`} className="inline-flex items-center gap-1.5 rounded-xl bg-card border border-border/50 px-3 h-8 text-sm">
                      <FileText className="size-3 text-muted-foreground/40" /><span className="truncate max-w-[180px] text-[12px]">{t}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {response && <StatsBlock response={response} isStreaming={isStreaming} />}
        </div>
      </div>
    </div>
  );
}

export { AssistantMessageBubble };
