// FIX: Added type definitions for Tool and SuiteApp to resolve module errors.
export interface Tool {
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  icon: string;
  href: string;
}

export interface SuiteApp {
  title: string;
  descriptionKey: string;
  href: string;
}
