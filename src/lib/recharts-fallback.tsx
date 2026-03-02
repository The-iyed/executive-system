/**
 * Fallback when recharts is not installed (e.g. in Docker with frozen lockfile).
 * Install recharts (pnpm add recharts) for full dashboard charts.
 */
import React from 'react';

const Empty = () => null;
const EmptyProps = (_: any) => null;

export const BarChart = EmptyProps;
export const Bar = EmptyProps;
export const XAxis = EmptyProps;
export const YAxis = EmptyProps;
export const Tooltip = EmptyProps;
export const ResponsiveContainer = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const PieChart = EmptyProps;
export const Pie = EmptyProps;
export const Cell = EmptyProps;
export const AreaChart = EmptyProps;
export const Area = EmptyProps;
export const RadialBarChart = EmptyProps;
export const RadialBar = EmptyProps;
