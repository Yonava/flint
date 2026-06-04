import type { LanguageReport } from "./languages.ts";
import type { FileReport } from "./reports.ts";

export interface CacheInvalidatingFile {
	filePath: string;
	touchTime: number;
}

export interface CacheStorage {
	cacheInvalidatingFiles: CacheInvalidatingFile[];
	configs: Record<string, number>;
	files: Record<string, FileCacheStorage>;
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
