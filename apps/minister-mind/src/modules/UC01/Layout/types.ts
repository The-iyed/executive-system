import type { ActionButton, BreadcrumbItem } from '@shared/components/welcome-section';

export interface LayoutProps {
  children: React.ReactNode;
}

export type WelcomeConfig = {
  title: string;
  description: string;
  actions?: ActionButton[];
  breadcrumbs?: BreadcrumbItem[];
};