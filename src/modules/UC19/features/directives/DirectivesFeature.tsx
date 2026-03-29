import { useState } from 'react';
import { CheckSquare } from 'lucide-react';
import {
  DirectivesList,
  type DirectiveCardAction,
} from '@/modules/shared/features/directives-list';
import { useDirectivesList } from '@/modules/shared/hooks/useDirectivesList';
import {
  DIRECTIVE_TYPE_OPTIONS,
} from '@/modules/shared/types/minister-directive-enums';
import type { MinisterDirective } from '@/modules/shared/api/directives';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/lib/ui/components/alert-dialog';

export const DirectivesFeature = () => {
  const [confirmDirective, setConfirmDirective] = useState<MinisterDirective | null>(null);

  const list = useDirectivesList({
    queryKeyPrefix: 'uc19-directives',
    tabMode: 'type',
    defaultTypeTab: 'GENERAL',
  });

  const actions: DirectiveCardAction[] = [
    {
      id: 'take',
      label: 'الأخذ بالتوجيه',
      icon: <CheckSquare className="w-3.5 h-3.5" />,
      className: 'border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 hover:shadow-sm',
      hidden: (d: MinisterDirective) => d.status === 'ADOPTED',
      onClick: (d: MinisterDirective) => setConfirmDirective(d),
    },
  ];

  const handleConfirmTake = async () => {
    if (confirmDirective) {
      await list.handleTakeDirective(confirmDirective);
      setConfirmDirective(null);
    }
  };

  return (
    <>
      <AlertDialog open={!!confirmDirective} onOpenChange={(open) => !open && setConfirmDirective(null)}>
        <AlertDialogContent dir="rtl" className="max-w-sm rounded-2xl p-6">
          <AlertDialogHeader className="gap-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
              <CheckSquare className="size-5 text-primary" />
            </div>
            <AlertDialogTitle className="text-center text-base">تأكيد الأخذ بالتوجيه</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[13px] leading-relaxed">
              هل أنت متأكد من الأخذ بهذا التوجيه؟
              {confirmDirective?.title && (
                <span className="font-medium text-foreground mt-2 block line-clamp-2 text-[12px]">
                  {confirmDirective.title}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:flex-row mt-2">
            <AlertDialogAction onClick={handleConfirmTake} className="flex-1 rounded-xl h-10">تأكيد</AlertDialogAction>
            <AlertDialogCancel className="flex-1 rounded-xl h-10">إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
        actions={actions}
      />
    </>
  );
};

export default DirectivesFeature;
