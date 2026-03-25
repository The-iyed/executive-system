/**
 * Prefetch all non-UC02 lazy route chunks on browser idle
 * so navigation between modules feels instant.
 */
const chunks = [
  // UC-01
  () => import('../../UC01/features/Meeting'),
  () => import('../../UC01/features/PreviewMeeting'),
  () => import('../../UC01/pages/scheduledMeetings'),
  () => import('../../UC01/features/PreviousMeeting'),
  () => import('../../UC01/pages/workBasket'),
  // UC-03
  () => import('../../UC03/pages/consultationRequests'),
  () => import('../../UC03/pages/consultationRequestDetail'),
  // UC-04
  () => import('../../UC04/pages/guidanceRequests'),
  () => import('../../UC04/pages/guidanceRequestDetail'),
  () => import('../../UC04/pages/exceptionRequest'),
  () => import('../../UC04/pages/evaluation'),
  // UC-05
  () => import('../../UC05/pages/contentRequests'),
  () => import('../../UC05/pages/contentRequestDetail'),
  // UC-06
  () => import('../../UC06/pages/contentConsultationRequests'),
  () => import('../../UC06/pages/contentConsultationRequestDetail'),
  // UC-09
  () => import('../../UC09/pages'),
];

let prefetched = false;

export function prefetchSharedRoutes() {
  if (prefetched) return;
  prefetched = true;
  const load = () => chunks.forEach((fn) => fn().catch(() => {}));
  if ('requestIdleCallback' in window) {
    requestIdleCallback(load);
  } else {
    setTimeout(load, 2000);
  }
}
