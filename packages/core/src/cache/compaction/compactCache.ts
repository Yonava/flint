import type { CacheStorage } from "../../types/cache.ts";
import type { FileReport, ReportMessageData } from "../../types/reports.ts";
import type {
	CompactCacheStorage,
	CompactFileReport,
	CompactReportMessageData,
} from "./types.ts";

export function compactCache(cache: CacheStorage): CompactCacheStorage {
	const { messageStrings, stringIndex } = buildMessageStrings(cache);

	return {
		...cache,
		files: Object.fromEntries(
			Object.entries(cache.files).map(([filePath, file]) => [
				filePath,
				{
					...file,
					reports: compactReports(file.reports, stringIndex),
				},
			]),
		),
		messageStrings,
	};
}

function buildMessageStrings(cache: CacheStorage): {
	messageStrings: string[];
	stringIndex: Map<string, number>;
} {
	const allStrings = new Set<string>();

	const collectFromReports = (reports: FileReport[]) => {
		for (const report of reports) {
			allStrings.add(report.message.primary);
			for (const s of report.message.secondary) {
				allStrings.add(s);
			}
			for (const s of report.message.suggestions) {
				allStrings.add(s);
			}
		}
	};

	for (const file of Object.values(cache.files)) {
		if (!file.reports) {
			continue;
		}
		collectFromReports(file.reports);
	}

	// deterministic ordering so the same violations produce an identical cache file across runs
	const messageStrings = [...allStrings].toSorted();
	const stringIndex = new Map(messageStrings.map((s, i) => [s, i]));
	return { messageStrings, stringIndex };
}

function compactMessage(
	message: ReportMessageData,
	stringIndex: Map<string, number>,
): CompactReportMessageData {
	// stringIndex is built from the same messages so -1 should never occur, but if it does an
	// out-of-bounds index guarantees a cache bust on read
	return {
		primary: stringIndex.get(message.primary) ?? -1,
		secondary: message.secondary.map((s) => stringIndex.get(s) ?? -1),
		suggestions: message.suggestions.map((s) => stringIndex.get(s) ?? -1),
	};
}

function compactReports(
	reports: FileReport[] | undefined,
	stringIndex: Map<string, number>,
): CompactFileReport[] | undefined {
	if (!reports?.length) {
		return undefined;
	}
	return reports.map((report) => ({
		...report,
		message: compactMessage(report.message, stringIndex),
	}));
}
