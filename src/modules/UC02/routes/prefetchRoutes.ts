const chunks = [
  () => import('../pages/dashboard'),
  () => import('../pages/directives'),
  () => import('../pages/calendar'),
  () => import('../pages/workBasket'),
  () => import('../pages/meetingDetail'),
  () => import('../pages/waitingList'),
  () => import('../pages/scheduledMeetings'),
];

let prefetched = false;

export function prefetchUC02Routes() {
  if (prefetched) return;
  prefetched = true;
  const load = () => chunks.forEach((fn) => fn().catch(() => {}));
  if ('requestIdleCallback' in window) {
    requestIdleCallback(load);
  } else {
    setTimeout(load, 2000);
  }
}
