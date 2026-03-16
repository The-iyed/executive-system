import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ThumbsUp, ThumbsDown, Upload } from "lucide-react";
import { Button } from "@gl/components/ui/button";

type FeedbackType = "like" | "dislike";

interface MessageFeedbackModalProps {
  type: FeedbackType;
  open: boolean;
  onClose: () => void;
  onSubmit: (feedback: { type: FeedbackType; category?: string; description: string }) => void;
}

const DISLIKE_CATEGORIES = [
  "إجابة غير دقيقة",
  "إجابة غير مكتملة",
  "إجابة غير مفهومة",
  "مشكلة تقنية",
  "أخرى",
];

function MessageFeedbackModal({ type, open, onClose, onSubmit }: MessageFeedbackModalProps) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [open]);

  if (!open) return null;

  const isLike = type === "like";
  const title = isLike ? "إرسال ملاحظة" : "إرسال بلاغ أو ملاحظة";
  const subtitle = isLike
    ? undefined
    : "ساعدنا في تحسين أداء عون من خلال الإبلاغ عن مشكلة واجهتك أو مشاركة ملاحظة حول تجربة الاستخدام.";
  const placeholder = isLike
    ? "ما الذي أعجبك في هذه الإجابة؟"
    : "ما الذي كان غير مرضي في هذه الإجابة؟";

  const canSubmit = isLike ? true : !!category;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const handleSubmit = () => {
    onSubmit({ type, category: isLike ? undefined : category, description });
    setCategory("");
    setDescription("");
    handleClose();
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none" dir="rtl">
        <div
          className={`pointer-events-auto w-full max-w-lg rounded-2xl bg-card shadow-2xl border border-border/50 overflow-hidden transition-all duration-200 ${
            visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {subtitle && (
            <p className="px-6 pb-2 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
          )}

          <div className="px-6 pb-6 pt-3 space-y-4">
            {/* Dislike: category selector */}
            {!isLike && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">نوع البلاغ</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                  >
                    <option value="" disabled>اختر نوع البلاغ</option>
                    {DISLIKE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                الوصف التفصيلي {isLike ? "(اختياري)" : ""}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={placeholder}
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Attach */}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              <Upload className="size-4" />
              إرفاق ملف أو لقطة شاشة
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-xl px-6 py-2.5 gap-2"
            >
              {isLike ? (
                <>
                  <ThumbsUp className="size-4" />
                  إرسال الملاحظة
                </>
              ) : (
                <>
                  إرسال البلاغ
                  <svg className="size-4 rtl:rotate-180" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export { MessageFeedbackModal };
