import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/lib/ui/components/dialog';
import { Button } from '@/lib/ui/components/button';
import { StatusBadge } from '@/modules/shared/components/status-badge';
import { RefreshCw, Clock, Mail, Phone, FileText, AlertTriangle, Copy } from 'lucide-react';
import { useNotificationDetail, useRetryNotification } from '../hooks/useNotifications';
import { NotificationStatus } from '../types';
import { cn } from '@/lib/ui/lib/utils';
import { formatDateTimeArabic } from '@/modules/shared/utils/format';
import { toast } from 'sonner';

interface NotificationDetailModalProps {
  notificationId: string | null;
  open: boolean;
  onClose: () => void;
}

const statusLabelMap: Record<NotificationStatus, string> = {
  [NotificationStatus.PENDING]: 'قيد الإرسال',
  [NotificationStatus.SENT]: 'مرسل',
  [NotificationStatus.FAILED]: 'فشل',
};

const variableLabelMap: Record<string, string> = {
  request_number: 'رقم الطلب',
  meeting_title: 'عنوان الاجتماع',
  date_and_time: 'التاريخ والوقت',
  meeting_location: 'موقع الاجتماع',
  name: 'الاسم',
  card_name: 'اسم البطاقة',
  assistant_name: 'اسم المساعد',
  consultant_name: 'اسم المستشار',
  delegation_directives: 'توجيهات التفويض',
  meeting_agenda: 'جدول الأعمال',
  circulation_notes: 'ملاحظات التعميم',
  link: 'الرابط',
  is_preliminary_booking: 'حجز مبدئي',
  has_presentation: 'يوجد عرض تقديمي',
  online_meeting_link: 'رابط الاجتماع الإلكتروني',
  webex_meeting_join_link: 'رابط Webex للانضمام',
  meeting_number: 'رقم الاجتماع',
  webex_meeting_number: 'رقم اجتماع Webex',
  password: 'كلمة المرور',
  webex_password: 'كلمة مرور Webex',
  sip_address: 'عنوان SIP',
  webex_sip_address: 'عنوان SIP Webex',
  video_system: 'نظام الفيديو',
  host_key: 'مفتاح المضيف',
  webex_host_key: 'مفتاح مضيف Webex',
};

function formatVariableValue(value: unknown): { type: 'boolean'; label: string; positive: boolean } | { type: 'url'; value: string } | { type: 'text'; value: string } {
  const str = String(value);
  if (str === 'true') return { type: 'boolean', label: 'نعم', positive: true };
  if (str === 'false') return { type: 'boolean', label: 'لا', positive: false };
  if (isUrl(value)) return { type: 'url', value: str };
  return { type: 'text', value: str };
}

function isUrl(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith('http');
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notificationId,
  open,
  onClose,
}) => {
  const { data: notification, isLoading } = useNotificationDetail(notificationId);
  const retryMutation = useRetryNotification();

  const parsedServiceBody = useMemo(() => {
    if (!notification?.service_request_body) return null;
    try {
      return JSON.parse(notification.service_request_body);
    } catch {
      return null;
    }
  }, [notification?.service_request_body]);

  const templateCode = parsedServiceBody?.code ?? null;
  const variables = parsedServiceBody?.variables ?? null;
  const variableEntries = useMemo(() => {
    if (!variables || typeof variables !== 'object') return [];
    return Object.entries(variables).filter(([, v]) => v && v !== '—' && v !== '');
  }, [variables]);

  const handleCopyLink = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success('تم نسخ الرابط');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" dir="rtl">
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4 py-8">
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
              <div className="h-20 w-full bg-muted animate-pulse rounded" />
            </div>
          ) : notification ? (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-3">
                  <DialogTitle className="text-base font-bold">
                    {notification.subject}
                  </DialogTitle>
                  <StatusBadge
                    status={notification.status}
                    label={statusLabelMap[notification.status] ?? notification.status}
                  />
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Type & Template */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    <FileText className="w-3.5 h-3.5" />
                    {notification.notification_type === 'SMS' ? 'رسالة نصية' : 'بريد إلكتروني'}
                  </span>
                  {templateCode && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary font-medium">
                      قالب: {templateCode}
                    </span>
                  )}
                </div>

                <div className="border-t border-border/30" />

                {/* Recipient */}
                <div className="space-y-1.5">
                  {notification.recipient_email && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{notification.recipient_email}</span>
                    </div>
                  )}
                  {notification.recipient_phone && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{notification.recipient_phone}</span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-[11px] font-medium text-muted-foreground mb-1.5">محتوى الإشعار</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {notification.body}
                  </p>
                </div>

                {/* Dynamic template variables */}
                {variableEntries.length > 0 && (
                  <div className="rounded-xl border border-border/40 overflow-hidden">
                    <div className="px-4 py-2.5 bg-muted/30 border-b border-border/30">
                      <p className="text-xs font-semibold text-muted-foreground">بيانات القالب</p>
                    </div>
                    <div className="divide-y divide-border/20">
                      {variableEntries.map(([key, value], idx) => (
                        <div
                          key={key}
                          className={cn(
                            'flex items-center justify-between px-4 py-2.5 text-xs',
                            idx % 2 === 1 && 'bg-muted/10'
                          )}
                        >
                          <span className="text-muted-foreground">
                            {variableLabelMap[key] ?? key}
                          </span>
                          {isUrl(value) ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2.5 text-xs gap-1.5 text-primary hover:text-primary"
                              onClick={() => handleCopyLink(String(value))}
                            >
                              <Copy className="w-3 h-3" />
                              نسخ الرابط
                            </Button>
                          ) : (
                            <span className="text-foreground font-medium max-w-[60%] text-left truncate">
                              {String(value)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  تاريخ الإنشاء: {formatDateTimeArabic(notification.created_at)}
                </div>

                {/* Error */}
                {notification.status === NotificationStatus.FAILED && notification.failure_reason && (
                  <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    <p className="text-sm text-destructive">{notification.failure_reason}</p>
                  </div>
                )}

                {/* Retry */}
                {notification.status === NotificationStatus.FAILED && (
                  <Button
                    onClick={() => retryMutation.mutate(notification.id)}
                    disabled={retryMutation.isPending}
                    className="w-full bg-gradient-to-l from-[#048F86] via-[#069E95] to-[#0BB5AA] text-white border-0 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <RefreshCw className={cn('w-4 h-4', retryMutation.isPending && 'animate-spin')} />
                    {retryMutation.isPending ? 'جاري إعادة الإرسال...' : 'إعادة الإرسال'}
                  </Button>
                )}
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
