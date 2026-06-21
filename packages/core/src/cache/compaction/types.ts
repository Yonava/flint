import type { GlobalInvalidation } from "../../types/cache.ts";
import type { LanguageReport } from "../../types/languages.ts";
import type { FileReport } from "../../types/reports.ts";

export interface CompactCacheStorage {
	configs: Record<string, number>;
	files: Record<string, CompactFileCacheStorage>;
	globalInvalidations: GlobalInvalidation[];
	messageStrings: string[];
}

export interface CompactFileCacheStorage {
	dependencies?: string[] | undefined;
	languageReports?: LanguageReport[] | undefined;
	reports?: CompactFileReport[] | undefined;
	timestamp: number;
}

export interface CompactFileReport extends Omit<FileReport, "message"> {
	message: CompactReportMessageData;
}

export interface CompactReportMessageData {
	primary: number;
	secondary: number[];
	suggestions: number[];
}
