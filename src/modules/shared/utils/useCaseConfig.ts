import { NavItem } from '../components/navigation-actions';
import { PATH as UC01_PATH } from '../../UC01/routes/paths';

/** Path for guiding-light (minister role). */
export const PATH_GUIDING_LIGHT = '/guiding-light';

/** Check if user has MINISTER role. */
export function isMinisterUser(roles?: Array<{ code: string }>): boolean {
  return roles?.some((r) => r.code === 'MINISTER') ?? false;
}
import { PATH as UC02_PATH } from '../../UC02/routes/paths';
import { PATH as UC03_PATH } from '../../UC03/routes/paths';
import { PATH as UC04_PATH } from '../../UC04/routes/paths';
import { PATH as UC05_PATH } from '../../UC05/routes/paths';
import { PATH as UC06_PATH } from '../../UC06/routes/paths';
import { PATH as UC09_PATH } from '../../UC09/routes/paths';
import { PATH as uc13_PATH } from '../../UC-13/routes/paths';
import { PATH as UC19_PATH } from '../../UC19/routes/paths';
import { PATH as ADMIN_PATH } from '../../admin/routes/paths';

export interface UseCaseConfig {
  code: string;
  defaultRoute: string;
  navigationItems: NavItem[];
}

export const USE_CASE_CONFIGS: Record<string, UseCaseConfig> = {
  'UC-01': {
    code: 'UC-01',
    defaultRoute: UC01_PATH.MEETINGS,
    navigationItems: [
      {
        id: 'calendar',
        icon: 'solar:calendar-outline',
        label: 'الطلبات الحالية',
        path: UC01_PATH.MEETINGS,
      },
      {
        id: 'previous-meetings',
        icon: 'solar:calendar-mark-outline',
        label: 'الاجتماعات السابقة',
        path: UC01_PATH.PREVIOUS_MEETINGS,
      },
    ],
  },
  'UC-02': {
    code: 'UC-02',
    defaultRoute: UC02_PATH.DASHBOARD,
    navigationItems: [
      {
        id: 'dashboard',
        icon: 'solar:home-2-bold',
        label: 'الرئيسية',
        path: UC02_PATH.DASHBOARD,
      },
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
        // Minister / scheduling calendar — not for executive office manager
        excludeRoleCodes: ['EXECUTIVE_OFFICE_MANAGER'],
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
        label: ' طلبات استشارات',
        path: UC04_PATH.GUIDANCE_REQUESTS,
      },
      {
        id: 'exception-request',
        icon: 'solar:hand-stars-outline',
        label: 'طلبات الاستثناء',
        path: UC04_PATH.EXCEPTION_REQUEST,
      },
      {
        id: 'evaluation',
        icon: 'solar:hand-stars-outline',
        label: 'تقويم',
        path: UC04_PATH.EVALUATION,
        excludeRoleCodes: ['EXECUTIVE_OFFICE_MANAGER'],
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
  'UC-09': {
    code: 'UC-09',
    defaultRoute: UC09_PATH.HOME,
    navigationItems: [
      {
        id: 'uc09',
        icon: 'solar:widget-2-outline',
        label: 'الهيكل التنظيمي',
        path: UC09_PATH.HOME,
      },
    ],
  },
  'UC-13': {
    code: 'UC-13',
    defaultRoute: uc13_PATH.BUSINESS_CARDS,
    navigationItems: [
      {
        id: 'uc13',
        icon: 'solar:card-outline',
        label: 'البطاقات الوظيفية',
        path: uc13_PATH.BUSINESS_CARDS,
      },
      {
        id: 'uc13-directives',
        icon: 'solar:document-text-outline',
        label: 'التوجيهات',
        path: uc13_PATH.DIRECTIVES,
      },
    ],
  },
  'UC-19': {
    code: 'UC-19',
    defaultRoute: UC19_PATH.DIRECTIVES,
    navigationItems: [
      {
        id: 'minister-directives',
        icon: 'solar:document-text-outline',
        label: 'التوجيهات',
        path: UC19_PATH.DIRECTIVES,
      },
    ],
  },
  'ADMIN': {
    code: 'ADMIN',
    defaultRoute: ADMIN_PATH.NOTIFICATIONS,
    navigationItems: [
      {
        id: 'notifications',
        icon: 'solar:bell-outline',
        label: 'الإشعارات',
        path: ADMIN_PATH.NOTIFICATIONS,
      },
    ],
  },
};

/**
 * Normalize use case code from API (e.g. "UC01", "UC02", "uc-01") to config key ("UC-01", "UC-02").
 */
export function normalizeUseCaseCode(raw: string): string {
  const s = String(raw || '').trim().toUpperCase();
  if (!s) return '';
  if (USE_CASE_CONFIGS[s]) return s;
  const withHyphen = s.replace(/^UC-?(\d+)$/, 'UC-$1');
  return USE_CASE_CONFIGS[withHyphen] ? withHyphen : s;
}

/**
 * Get the default route for a user based on their use cases and roles.
 * When user has MINISTER role, returns /guiding-light.
 * Otherwise returns the first use case's default route, or falls back to UC-01 meetings.
 */
export const getDefaultRouteForUser = (
  useCases?: string[],
  roles?: Array<{ code: string }>
): string => {
  if (isMinisterUser(roles)) {
    return PATH_GUIDING_LIGHT;
  }

  if (roles?.some((r) => r.code === 'ADMIN')) {
    return ADMIN_PATH.NOTIFICATIONS;
  }

  if (!useCases || useCases.length === 0) {
    return UC01_PATH.MEETINGS;
  }

  for (const raw of useCases) {
    const useCase = normalizeUseCaseCode(raw);
    if (!useCase) continue;
    const config = USE_CASE_CONFIGS[useCase];
    if (config) {
      return config.defaultRoute;
    }
  }

  return UC01_PATH.MEETINGS;
};

/**
 * Get all navigation items for a user based on their use cases
 * Merges navigation items from all allowed use cases
 * Filters items that require specific use case access
 */
export const getNavigationItemsForUser = (
  useCases?: string[],
  userRoles?: Array<{ code: string }>
): NavItem[] => {
  if (!useCases || useCases.length === 0) {
    return USE_CASE_CONFIGS['UC-01'].navigationItems;
  }

  const roleCodes = new Set(userRoles?.map((r) => r.code) ?? []);

  const navItems: NavItem[] = [];
  const seenIds = new Set<string>();

  // Collect navigation items from all allowed use cases
  for (const useCase of useCases) {
    const normalized = normalizeUseCaseCode(useCase);
    if (!normalized) continue;
    const config = USE_CASE_CONFIGS[normalized];
    if (config) {
      for (const item of config.navigationItems) {
        if (item.excludeRoleCodes?.some((c) => roleCodes.has(c))) {
          continue;
        }
        // Check if item requires a specific use case
        if (item.requiresUseCase) {
          const requiredUseCase = item.requiresUseCase;
          if (!useCases.some((uc) => normalizeUseCaseCode(uc) === requiredUseCase)) {
            continue; // Skip this item if user doesn't have required use case
          }
        }

        // Avoid duplicates by checking id
        if (!seenIds.has(item.id)) {
          const { requiresUseCase, excludeRoleCodes, ...cleanItem } = item;
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
  const normalizedRequired = normalizeUseCaseCode(useCaseCode);
  if (!normalizedRequired) return false;
  return useCases.some((uc) => normalizeUseCaseCode(uc) === normalizedRequired);
};

/**
 * Get all use case codes that a user has access to
 */
export const getUserUseCaseCodes = (useCases?: string[]): string[] => {
  if (!useCases || useCases.length === 0) {
    return [];
  }
  const normalized = useCases.map(normalizeUseCaseCode).filter((uc) => USE_CASE_CONFIGS[uc]);
  return [...new Set(normalized)];
};

