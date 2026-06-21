import { describe, expect, it } from "vitest";

import { expandCache } from "./expandCache.ts";
import type { CompactCacheStorage } from "./types.ts";

const baseCompact: CompactCacheStorage = {
	configs: { "package.json": 123 },
	files: {},
	globalInvalidations: [],
	messageStrings: ["Error message", "More info"],
};

describe(expandCache, () => {
	it("returns undefined when primary index is out of bounds", () => {
		const compact: CompactCacheStorage = {
			...baseCompact,
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: { primary: 99, secondary: [], suggestions: [] },
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
						},
					],
					timestamp: 123,
				},
			},
		};

		expect(expandCache(compact)).toBeUndefined();
	});

	it("returns undefined when a secondary index is out of bounds", () => {
		const compact: CompactCacheStorage = {
			...baseCompact,
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: { primary: 0, secondary: [99], suggestions: [] },
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
						},
					],
					timestamp: 123,
				},
			},
		};

		expect(expandCache(compact)).toBeUndefined();
	});

	it("returns undefined when a suggestions index is out of bounds", () => {
		const compact: CompactCacheStorage = {
			...baseCompact,
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: { primary: 0, secondary: [], suggestions: [99] },
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
						},
					],
					timestamp: 123,
				},
			},
		};

		expect(expandCache(compact)).toBeUndefined();
	});

	it("expands valid compact cache to string messages", () => {
		const compact: CompactCacheStorage = {
			...baseCompact,
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: { primary: 0, secondary: [1], suggestions: [] },
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
						},
					],
					timestamp: 123,
				},
			},
		};

		const result = expandCache(compact);

		expect(result).toBeDefined();
		expect(result?.files["src/index.ts"]?.reports?.[0]?.message).toEqual({
			primary: "Error message",
			secondary: ["More info"],
			suggestions: [],
		});
	});

	it("returns undefined when any file has an out-of-bounds index, not just the first", () => {
		const compact: CompactCacheStorage = {
			...baseCompact,
			files: {
				"src/a.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: { primary: 0, secondary: [], suggestions: [] },
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
						},
					],
					timestamp: 123,
				},
				"src/b.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: { primary: 99, secondary: [], suggestions: [] },
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
						},
					],
					timestamp: 123,
				},
			},
		};

		expect(expandCache(compact)).toBeUndefined();
	});
});
