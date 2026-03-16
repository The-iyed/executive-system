/// <reference types="vite/client" />

// Asset modules
declare module "*.svg" {
  const src: string;
  export default src;
}
declare module "*.jpg" {
  const src: string;
  export default src;
}
declare module "*.png" {
  const src: string;
  export default src;
}
declare module "*.gif" {
  const src: string;
  export default src;
}
declare module "*.webp" {
  const src: string;
  export default src;
}

// Libraries missing type declarations
declare module "react-markdown";
declare module "remark-gfm";
declare module "highcharts" {
  namespace Highcharts {
    type Options = any;
    type Chart = any;
    type Point = any;
    type SeriesPieOptions = any;
    type SeriesOptionsType = any;
    type AxisLabelsFormatterContextObject = any;
    type ExportingMimeTypeValue = any;
  }
  const Highcharts: any;
  export = Highcharts;
}
declare module "highcharts-react-official" {
  namespace HighchartsReact {
    type RefObject = any;
  }
  const HighchartsReact: any;
  export = HighchartsReact;
}
declare module "highcharts/modules/exporting";
declare module "highcharts/modules/export-data";
declare module "html2canvas";
declare module "jspdf";
declare module "radix-ui";
declare module "yup" {
  export function object(shape?: any): any;
  export function string(): any;
  export type InferType<T> = any;
}
declare module "xlsx";
declare module "zustand" {
  export function create<T>(initializer: any): any;
}
declare module "@vitejs/plugin-react";
declare module "@tailwindcss/vite";



