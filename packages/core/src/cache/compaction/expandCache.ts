import type { CacheStorage, FileCacheStorage } from "../../types/cache.ts";
import type { ReportMessageData } from "../../types/reports.ts";
import type {
	CompactCacheStorage,
	CompactFileCacheStorage,
	CompactReportMessageData,
} from "./types.ts";

export function expandCache(
	compact: CompactCacheStorage,
): CacheStorage | undefined {
	const { messageStrings } = compact;
	const files: Record<string, FileCacheStorage> = {};

	for (const [filePath, file] of Object.entries(compact.files)) {
		const expanded = expandFileCacheStorage(file, messageStrings);
		if (!expanded) {
			return undefined;
		}
		files[filePath] = expanded;
	}

	return {
		configs: compact.configs,
		files,
		globalInvalidations: compact.globalInvalidations,
	};
}

function expandFileCacheStorage(
	stored: CompactFileCacheStorage,
	messageStrings: string[],
): FileCacheStorage | undefined {
	const base: FileCacheStorage = {
		timestamp: stored.timestamp,
		...(stored.dependencies && { dependencies: stored.dependencies }),
		...(stored.languageReports && { languageReports: stored.languageReports }),
	};

	if (!stored.reports) {
		return base;
	}

	const expandedReports = [];
	for (const report of stored.reports) {
		const message = expandMessage(report.message, messageStrings);
		if (!message) {
			return undefined;
		}
		expandedReports.push({ ...report, message });
	}

	return { ...base, reports: expandedReports };
}

function expandMessage(
	message: CompactReportMessageData,
	messageStrings: string[],
): ReportMessageData | undefined {
	const primary = messageStrings[message.primary];
	if (primary === undefined) {
		return undefined;
	}

	const secondary: string[] = [];
	for (const i of message.secondary) {
		const s = messageStrings[i];
		if (s === undefined) {
			return undefined;
		}
		secondary.push(s);
	}

	const suggestions: string[] = [];
	for (const i of message.suggestions) {
		const s = messageStrings[i];
		if (s === undefined) {
			return undefined;
		}
		suggestions.push(s);
	}

	return { primary, secondary, suggestions };
}
