import React, { useEffect, useMemo } from 'react';
import { CardsGrid } from '@/modules/shared/components/cards-grid';
import { Pagination } from '@/modules/shared/components/pagination';
import { MeetingListHeader } from './MeetingListHeader';
import { MeetingListFilters } from './MeetingListFilters';
import { MeetingListSkeleton } from './MeetingListSkeleton';
import { MeetingListEmpty } from './MeetingListEmpty';
import { MeetingListError } from './MeetingListError';
import { useMeetingList } from '../hooks/useMeetingList';
import type { MeetingListLayoutProps, MeetingCardAction } from '../types';
import type { MeetingCardData } from '@/modules/shared/components/meeting-card';

function MeetingListLayoutInner<T extends { id: string }>({
  title,
  description,
  headerIcon,
  headerRight,
  queryKey,
  queryFn,
  fixedParams,
  mapToCard,
  cardActions,
  filtersConfig,
  pageSize = 10,
  searchPlaceholder,
  emptyMessage,
  errorMessage,
  onCardClick,
  onMount,
  children,
}: MeetingListLayoutProps<T>) {
  const {
    items,
    page,
    totalPages,
    search,
    filters,
    isLoading,
    isError,
    setSearch,
    setPage,
    setFilter,
    resetFilters,
    refetch,
  } = useMeetingList<T>({ queryKey, queryFn, fixedParams, pageSize });

  useEffect(() => {
    onMount?.();
  }, []);

  // Map items to card data
  const meetings: MeetingCardData[] = useMemo(
    () => items.map(mapToCard),
    [items, mapToCard]
  );

  // Resolve card action props
  const getActionLabel = cardActions?.find((a) => a.variant !== 'danger')
    ? (card: MeetingCardData) => {
        const item = items.find((i) => i.id === card.id);
        if (!item) return undefined;
        const action = cardActions?.find(
          (a) => a.variant !== 'danger' && !(a.hidden?.(item))
        );
        if (!action) return undefined;
        return typeof action.label === 'function' ? action.label(item) : action.label;
      }
    : undefined;

  const getActionLoading = cardActions?.find((a) => a.variant !== 'danger')
    ? (card: MeetingCardData) => {
        const item = items.find((i) => i.id === card.id);
        if (!item) return false;
        const action = cardActions?.find(
          (a) => a.variant !== 'danger' && !(a.hidden?.(item))
        );
        return action?.loading?.(item) ?? false;
      }
    : undefined;

  const onAction = cardActions?.find((a) => a.variant !== 'danger')
    ? (card: MeetingCardData) => {
        const item = items.find((i) => i.id === card.id);
        if (!item) return;
        const action = cardActions?.find(
          (a) => a.variant !== 'danger' && !(a.hidden?.(item))
        );
        action?.onClick(item);
      }
    : undefined;

  // Secondary (danger) action
  const dangerAction = cardActions?.find((a) => a.variant === 'danger');

  const getSecondaryActionLabel = dangerAction
    ? (card: MeetingCardData) => {
        const item = items.find((i) => i.id === card.id);
        if (!item || dangerAction.hidden?.(item)) return undefined;
        return typeof dangerAction.label === 'function'
          ? dangerAction.label(item)
          : dangerAction.label;
      }
    : undefined;

  const getSecondaryActionLoading = dangerAction
    ? (card: MeetingCardData) => {
        const item = items.find((i) => i.id === card.id);
        if (!item) return false;
        return dangerAction.loading?.(item) ?? false;
      }
    : undefined;

  const onSecondaryAction = dangerAction
    ? (card: MeetingCardData) => {
        const item = items.find((i) => i.id === card.id);
        if (!item) return;
        dangerAction.onClick(item);
      }
    : undefined;

  return (
    <div className="flex flex-col w-full min-h-0" dir="rtl">
      <MeetingListHeader
        title={title}
        description={description}
        headerIcon={headerIcon}
        headerRight={headerRight}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
      />

      {/* Filters */}
      {filtersConfig && filtersConfig.length > 0 && (
        <div className="px-6 pb-3">
          <MeetingListFilters
            filtersConfig={filtersConfig}
            filters={filters}
            onFilterChange={setFilter}
            onReset={resetFilters}
          />
        </div>
      )}

      {/* Extra children */}
      {children}

      {/* Content */}
      <div className="flex-1 px-6 pb-6">
        {isLoading ? (
          <MeetingListSkeleton count={pageSize > 6 ? 6 : pageSize} />
        ) : isError ? (
          <MeetingListError message={errorMessage} onRetry={refetch} />
        ) : items.length === 0 ? (
          <MeetingListEmpty message={emptyMessage} />
        ) : (
          <>
            <CardsGrid
              meetings={meetings}
              onView={
                onCardClick
                  ? (card) => {
                      const item = items.find((i) => i.id === card.id);
                      if (item) onCardClick(item);
                    }
                  : undefined
              }
              onDetails={
                onCardClick
                  ? (card) => {
                      const item = items.find((i) => i.id === card.id);
                      if (item) onCardClick(item);
                    }
                  : undefined
              }
              onAction={onAction}
              getActionLabel={getActionLabel}
              getActionLoading={getActionLoading}
              onSecondaryAction={onSecondaryAction}
              getSecondaryActionLabel={getSecondaryActionLabel}
              getSecondaryActionLoading={getSecondaryActionLoading}
            />

            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export const MeetingListLayout = React.memo(MeetingListLayoutInner) as typeof MeetingListLayoutInner;
