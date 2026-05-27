import type { LanguageReport } from "./languages.ts";
import type { FileReport } from "./reports.ts";

export interface CacheStorage {
	configs: Record<string, number>;
	files: Record<string, FileCacheStorage>;
	filesWithGlobalDeclarations: FileWithGlobalDeclarations[];
}

export interface FileCacheImpacts {
	dependencies?: string[];
}

export interface FileCacheStorage extends FileCacheImpacts {
	languageReports?: LanguageReport[];

	/**
	 * Reports from the last time the file was linted.
	 */
	reports?: FileReport[];

	/**
	 * Unix milliseconds (`Date.now()`) of the last time the file was linted.
	 */
	timestamp: number;
}

export interface FileWithGlobalDeclarations {
	filePath: string;
	touchTime: number;
}
