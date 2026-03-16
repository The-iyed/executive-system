import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@gl/components/ui/button";

interface RegenerateConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function RegenerateConfirmDialog({ open, onClose, onConfirm }: RegenerateConfirmDialogProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none" dir="rtl">
        <div
          className={`pointer-events-auto w-full max-w-sm rounded-2xl bg-card shadow-2xl border border-border/50 p-8 text-center transition-all duration-200 ${
            visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
          }`}
        >
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <RefreshCw className="size-6 text-primary" />
          </div>

          <h2 className="text-lg font-bold text-foreground mb-2">إعادة توليد الاستجابة</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-1">
            سيؤدي هذا إلى حذف هذه الاستجابة وجميع الرسائل التالية، ثم توليد استجابة جديدة.
          </p>
          <p className="text-xs text-muted-foreground/70 mb-6">لا يمكن التراجع عن هذا الإجراء.</p>

          <div className="flex items-center gap-3 justify-center">
            <Button onClick={() => { setVisible(false); setTimeout(onConfirm, 200); }} className="rounded-xl px-5 gap-2">
              <RefreshCw className="size-4" />
              إعادة التوليد
            </Button>
            <Button variant="outline" onClick={handleClose} className="rounded-xl px-5 gap-2">
              <X className="size-4" />
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export { RegenerateConfirmDialog };
