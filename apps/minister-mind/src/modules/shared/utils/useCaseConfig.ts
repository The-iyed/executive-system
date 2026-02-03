import { NavItem } from '../components/navigation-actions';
import { PATH as UC01_PATH } from '../../UC01/routes/paths';
import { PATH as UC02_PATH } from '../../UC02/routes/paths';
import { PATH as UC03_PATH } from '../../UC03/routes/paths';
import { PATH as UC04_PATH } from '../../UC04/routes/paths';
import { PATH as UC05_PATH } from '../../UC05/routes/paths';
import { PATH as UC06_PATH } from '../../UC06/routes/paths';
import { PATH as UC08_PATH } from '../../UC08/routes/paths';

export interface UseCaseConfig {
  code: string;
  defaultRoute: string;
  navigationItems: NavItem[];
}

export const USE_CASE_CONFIGS: Record<string, UseCaseConfig> = {
  'UC-01': {
    code: 'UC-01',
    defaultRoute: UC01_PATH.HOME,
    navigationItems: [
      {
        id: 'home',
        icon: 'solar:home-2-outline',
        label: 'الصفحة الرئيسية',
        path: UC01_PATH.HOME,
      },
      {
        id: 'calendar',
        icon: 'solar:calendar-outline',
        label: 'الاجتماعات',
        path: UC01_PATH.MEETINGS,
      },
    ],
  },
  'UC-02': {
    code: 'UC-02',
    defaultRoute: UC02_PATH.DIRECTIVES,
    navigationItems: [
      {
        id: 'directives',
        icon: 'solar:document-text-outline',
        label: 'توجيهات الجدولة',
        path: UC02_PATH.DIRECTIVES,
        requiresUseCase: 'UC-07', // Only show if user has UC-07 access
      },
      {
        id: 'scheduled-meetings',
        icon: 'solar:calendar-mark-outline',
        label: 'الاجتماعات السابقة',
        path: UC02_PATH.SCHEDULED_MEETINGS,
      },
      {
        id: 'work-basket',
        icon: 'solar:folder-with-files-outline',
        label: 'الطلبات الحالية',
        path: UC02_PATH.WORK_BASKET,
      },
      {
        id: 'waiting-list',
        icon: 'solar:clock-circle-outline',
        label: 'قائمة الانتظار',
        path: UC02_PATH.WAITING_LIST,
      },
      {
        id: 'calendar',
        icon: 'solar:calendar-outline',
        label: 'التقويم',
        path: UC02_PATH.CALENDAR,
      },
    ],
  },
  'UC-03': {
    code: 'UC-03',
    defaultRoute: UC03_PATH.CONSULTATION_REQUESTS,
    navigationItems: [
      {
        id: 'consultation-requests',
        icon: 'solar:question-circle-outline',
        label: 'طلبات الاستشارات',
        path: UC03_PATH.CONSULTATION_REQUESTS,
      },
    ],
  },
  'UC-04': {
    code: 'UC-04',
    defaultRoute: UC04_PATH.GUIDANCE_REQUESTS,
    navigationItems: [
      {
        id: 'guidance-requests',
        icon: 'solar:hand-stars-outline',
        label: 'طلبات تقديم توجيه',
        path: UC04_PATH.GUIDANCE_REQUESTS,
      },
    ],
  },
  'UC-05': {
    code: 'UC-05',
    defaultRoute: UC05_PATH.CONTENT_REQUESTS,
    navigationItems: [
      {
        id: 'content-requests',
        icon: 'solar:document-text-outline',
        label: 'تقييم المحتوى وإضافة التوجيهات',
        path: UC05_PATH.CONTENT_REQUESTS,
      },
    ],
  },
  'UC-06': {
    code: 'UC-06',
    defaultRoute: UC06_PATH.CONTENT_CONSULTATION_REQUESTS,
    navigationItems: [
      {
        id: 'content-consultation-requests',
        icon: 'solar:notes-outline',
        label: 'تقديم استشارة المحتوى',
        path: UC06_PATH.CONTENT_CONSULTATION_REQUESTS,
      },
    ],
  },
  'UC-08': {
    code: 'UC-08',
    defaultRoute: UC08_PATH.NEW_MEETING,
    navigationItems: [],
  },
};

/**
 * Get the default route for a user based on their use cases
 * Returns the first use case's default route, or falls back to UC-01 home
 */
export const getDefaultRouteForUser = (useCases?: string[]): string => {
  if (!useCases || useCases.length === 0) {
    return UC01_PATH.HOME;
  }

  // Find the first valid use case and return its default route
  for (const useCase of useCases) {
    const config = USE_CASE_CONFIGS[useCase];
    if (config) {
      return config.defaultRoute;
    }
  }

  return UC01_PATH.HOME;
};

/**
 * Get all navigation items for a user based on their use cases
 * Merges navigation items from all allowed use cases
 * Filters items that require specific use case access
 */
export const getNavigationItemsForUser = (useCases?: string[]): NavItem[] => {
  if (!useCases || useCases.length === 0) {
    return USE_CASE_CONFIGS['UC-01'].navigationItems;
  }

  const navItems: NavItem[] = [];
  const seenIds = new Set<string>();

  // Collect navigation items from all allowed use cases
  for (const useCase of useCases) {
    const config = USE_CASE_CONFIGS[useCase];
    if (config) {
      for (const item of config.navigationItems) {
        // Check if item requires a specific use case
        if (item.requiresUseCase) {
          const requiredUseCase = item.requiresUseCase;
          if (!useCases.includes(requiredUseCase)) {
            continue; // Skip this item if user doesn't have required use case
          }
        }
        
        // Avoid duplicates by checking id
        if (!seenIds.has(item.id)) {
          // Remove the requiresUseCase property before adding to navItems
          const { requiresUseCase, ...cleanItem } = item;
          navItems.push(cleanItem);
          seenIds.add(item.id);
        }
      }
    }
  }

  return navItems.length > 0 ? navItems : USE_CASE_CONFIGS['UC-01'].navigationItems;
};

/**
 * Check if a user has access to a specific use case
 */
export const hasUseCaseAccess = (useCases: string[] | undefined, useCaseCode: string): boolean => {
  if (!useCases || useCases.length === 0) {
    return false;
  }
  return useCases.includes(useCaseCode);
};

/**
 * Get all use case codes that a user has access to
 */
export const getUserUseCaseCodes = (useCases?: string[]): string[] => {
  if (!useCases || useCases.length === 0) {
    return [];
  }
  return useCases.filter((uc) => USE_CASE_CONFIGS[uc] !== undefined);
};

