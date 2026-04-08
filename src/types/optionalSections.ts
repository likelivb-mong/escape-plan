export type OptionalSectionKey =
  | 'schedule'
  | 'budget'
  | 'operations'
  | 'executiveReport'
  | 'externalReview';

export interface OptionalSectionData {
  key: OptionalSectionKey;
  title: string;
  summary: string;
  content: string;
  sourceHeadings: string[];
}

export type OptionalSectionsMap = Partial<Record<OptionalSectionKey, OptionalSectionData>>;

export interface MarkdownImportMeta {
  sourceType: 'markdown';
  fileName: string;
  importedAt: string;
  inferredFields: string[];
  detectedSections: OptionalSectionKey[];
}
