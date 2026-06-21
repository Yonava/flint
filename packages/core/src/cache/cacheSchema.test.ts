import { describe, expect, it } from "vitest";
import z from "zod/v4";

import { cacheStorageSchema } from "./compaction/compactCacheSchema.ts";
import type { CompactCacheStorage } from "./compaction/types.ts";

describe("cacheStorageSchema decoding", () => {
	it("parses valid cache data", () => {
		const validCache: CompactCacheStorage = {
			configs: {
				"flint.config.ts": 1_234_567_890,
				"package.json": 1_234_567_890,
			},
			files: {
				"src/index.ts": {
					timestamp: 1_234_567_890,
				},
			},
			globalInvalidations: [],
			messageStrings: [],
		};

		const result = z.safeDecode(cacheStorageSchema, JSON.stringify(validCache));

		expect(result.success).toBe(true);
	});

	it("rejects cache missing configs", () => {
		const invalidCache = {
			files: {},
			messageStrings: [],
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidCache),
		);

		expect(result.success).toBe(false);
	});

	it("rejects cache missing files", () => {
		const invalidCache = {
			configs: {},
			messageStrings: [],
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidCache),
		);

		expect(result.success).toBe(false);
	});

	it("rejects cache missing messageStrings", () => {
		const invalidCache = {
			configs: {},
			files: {},
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidCache),
		);

		expect(result.success).toBe(false);
	});

	it("rejects cache with invalid timestamp type", () => {
		const invalidCache = {
			configs: {},
			files: {
				"src/index.ts": {
					timestamp: "not-a-number",
				},
			},
			messageStrings: [],
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidCache),
		);

		expect(result.success).toBe(false);
	});

	it("parses cache with optional file properties", () => {
		const validCache: CompactCacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					dependencies: ["src/utils.ts"],
					languageReports: [{ text: "Error" }],
					timestamp: 123,
				},
			},
			globalInvalidations: [],
			messageStrings: [],
		};

		const result = z.safeDecode(cacheStorageSchema, JSON.stringify(validCache));

		expect(result.success).toBe(true);
	});

	it("parses cache with full file data including reports", () => {
		const messageStrings = ["Test error", "More info", "Try this"];
		const validCache: CompactCacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					dependencies: ["src/utils.ts"],
					languageReports: [
						{ code: "TS1234", source: "typescript", text: "Error message" },
					],
					reports: [
						{
							about: { id: "test-rule" },
							message: {
								primary: 0,
								secondary: [1],
								suggestions: [2],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
						},
					],
					timestamp: 123,
				},
			},
			globalInvalidations: [],
			messageStrings,
		};

		const result = z.safeDecode(cacheStorageSchema, JSON.stringify(validCache));

		expect(result.success).toBe(true);
		expect(result).toEqual(
			expect.objectContaining({
				data: expect.objectContaining({
					files: {
						"src/index.ts": expect.objectContaining({
							languageReports: [
								expect.objectContaining({ source: "typescript" }),
							],
						}),
					},
				}),
			}),
		);
	});

	it("parses cache with report containing optional fields", () => {
		const messageStrings = ["Test error", "More info", "Try this"];
		const validCache: CompactCacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							data: { count: 5, enabled: true, name: "test" },
							dependencies: ["src/other.ts"],
							fix: [{ range: { begin: 0, end: 5 }, text: "fixed" }],
							message: {
								primary: 0,
								secondary: [1],
								suggestions: [2],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
							suggestions: [
								{
									id: "suggestion-1",
									range: { begin: 0, end: 5 },
									text: "fix",
								},
							],
						},
					],
					timestamp: 123,
				},
			},
			globalInvalidations: [],
			messageStrings,
		};

		const result = z.safeDecode(cacheStorageSchema, JSON.stringify(validCache));

		expect(result.success).toBe(true);
	});

	it("rejects report with string message (old format)", () => {
		const invalidCache = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: {
								primary: "Test error",
								secondary: [],
								suggestions: [],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
						},
					],
					timestamp: 123,
				},
			},
			messageStrings: [],
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidCache),
		);

		expect(result.success).toBe(false);
	});

	it("rejects null input", () => {
		const result = z.safeDecode(cacheStorageSchema, JSON.stringify(null));

		expect(result.success).toBe(false);
	});

	it("rejects undefined input", () => {
		const result = z.safeDecode(cacheStorageSchema, JSON.stringify(undefined));

		expect(result.success).toBe(false);
	});

	it("rejects config with non-number timestamp", () => {
		const invalidCache = {
			configs: { "package.json": "not-a-number" },
			files: {},
			messageStrings: [],
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidCache),
		);

		expect(result.success).toBe(false);
	});

	it("rejects report range missing raw field", () => {
		const invalidCache = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: {
								primary: 0,
								secondary: [],
								suggestions: [],
							},
							range: {
								begin: { column: 0, line: 0 },
								end: { column: 5, line: 0 },
							},
						},
					],
					timestamp: 123,
				},
			},
			messageStrings: ["Test error"],
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidCache),
		);

		expect(result.success).toBe(false);
	});

	it("rejects data with non-primitive values", () => {
		const invalidCache = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							data: { nested: { object: true } },
							message: {
								primary: 0,
								secondary: [],
								suggestions: [],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
						},
					],
					timestamp: 123,
				},
			},
			messageStrings: ["Test error"],
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidCache),
		);

		expect(result.success).toBe(false);
	});
});

describe("cacheStorageSchema", () => {
	it("encodes valid cache data to JSON string", () => {
		const validCache: CompactCacheStorage = {
			configs: {
				"flint.config.ts": 1_234_567_890,
				"package.json": 1_234_567_890,
			},
			files: {
				"src/index.ts": {
					timestamp: 1_234_567_890,
				},
			},
			globalInvalidations: [],
			messageStrings: [],
		};

		const encoded = z.encode(cacheStorageSchema, validCache);

		expect(typeof encoded).toBe("string");
		expect(JSON.parse(encoded)).toEqual(validCache);
	});

	it("decodes valid JSON string to cache data", () => {
		const validCache: CompactCacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					timestamp: 123,
				},
			},
			globalInvalidations: [],
			messageStrings: [],
		};
		const json = JSON.stringify(validCache);

		const decoded = z.decode(cacheStorageSchema, json);

		expect(decoded).toEqual(validCache);
	});

	it("fails to encode invalid cache data", () => {
		const invalidCache = {
			configs: "invalid",
			files: {},
			messageStrings: [],
		};

		const result = z.safeEncode(
			cacheStorageSchema,
			invalidCache as unknown as z.output<typeof cacheStorageSchema>,
		);

		expect(result.success).toBe(false);
	});

	it("fails to decode invalid JSON string", () => {
		const invalidJson = "{ invalid json }";

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidJson),
		);

		expect(result.success).toBe(false);
	});

	it("fails to decode valid JSON with invalid schema", () => {
		const validJsonInvalidSchema = JSON.stringify({
			configs: "not-a-record",
			files: {},
			messageStrings: [],
		});

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(validJsonInvalidSchema),
		);

		expect(result.success).toBe(false);
	});

	it("roundtrips cache data correctly", () => {
		const messageStrings = ["Error message", "More info", "Test error"];
		const original: CompactCacheStorage = {
			configs: {
				"flint.config.ts": 1_234_567_890,
				"package.json": 1_234_567_890,
			},
			files: {
				"src/index.ts": {
					dependencies: ["src/utils.ts"],
					languageReports: [
						{ code: "TS1234", source: "typescript", text: "Error message" },
					],
					reports: [
						{
							about: { id: "test-rule" },
							message: {
								primary: 2,
								secondary: [1],
								suggestions: [],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
						},
					],
					timestamp: 1_234_567_890,
				},
			},
			globalInvalidations: [],
			messageStrings,
		};

		const encoded = z.encode(cacheStorageSchema, original);
		const decoded = z.decode(cacheStorageSchema, encoded);

		expect(decoded).toEqual(original);
	});
});

describe("toSerializableCacheStorage encoding", () => {
	it("passes through cache with only SuggestionForFile suggestions", () => {
		const cache: CompactCacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: {
								primary: 0,
								secondary: [],
								suggestions: [],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
							suggestions: [
								{ id: "fix-1", range: { begin: 0, end: 5 }, text: "fixed" },
								{
									files: {
										"other.ts": [{ range: { begin: 0, end: 1 }, text: "x" }],
									},
									id: "multi-fix",
								},
							],
						},
					],
					timestamp: 123,
				},
			},
			globalInvalidations: [],
			messageStrings: ["Error"],
		};

		const result = z.decode(
			cacheStorageSchema,
			z.encode(cacheStorageSchema, cache),
		);

		expect(result.files["src/index.ts"]?.reports?.[0]?.suggestions).toEqual([
			{ id: "fix-1", range: { begin: 0, end: 5 }, text: "fixed" },
			{
				files: {
					"other.ts": [{ range: { begin: 0, end: 1 }, text: "x" }],
				},
				id: "multi-fix",
			},
		]);
	});

	it("handles cache with no suggestions", () => {
		const cache: CompactCacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: {
								primary: 0,
								secondary: [],
								suggestions: [],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
						},
					],
					timestamp: 123,
				},
			},
			globalInvalidations: [],
			messageStrings: ["Error"],
		};

		const result = z.decode(
			cacheStorageSchema,
			z.encode(cacheStorageSchema, cache),
		);

		expect(
			result.files["src/index.ts"]?.reports?.[0]?.suggestions,
		).toBeUndefined();
	});

	it("handles cache with no reports", () => {
		const cache: CompactCacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					timestamp: 123,
				},
			},
			globalInvalidations: [],
			messageStrings: [],
		};

		const result = z.decode(
			cacheStorageSchema,
			z.encode(cacheStorageSchema, cache),
		);

		expect(result.files["src/index.ts"]?.reports).toBeUndefined();
	});

	it("produces output that parses against the codec", () => {
		const cache: CompactCacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: {
								primary: 0,
								secondary: [],
								suggestions: [],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
							suggestions: [
								{ id: "fix-1", range: { begin: 0, end: 5 }, text: "fixed" },
								{
									files: { "other.ts": [] },
									id: "multi-fix",
								},
							],
						},
					],
					timestamp: 123,
				},
			},
			globalInvalidations: [],
			messageStrings: ["Error"],
		};

		const serializable = z.decode(
			cacheStorageSchema,
			z.encode(cacheStorageSchema, cache),
		);
		const encoded = z.safeEncode(cacheStorageSchema, serializable);

		expect(encoded.success).toBe(true);
	});
});
