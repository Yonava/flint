import * as fs from "node:fs/promises";
import { dirname } from "node:path";

import { CachedFactory } from "cached-factory";
import { debugForFile } from "debug-for-file";
import omitEmpty from "omit-empty";
import ts from "typescript";

import type {
	CacheStorage,
	FileWithGlobalDeclarations,
} from "../types/cache.ts";
import type { LinterHost } from "../types/host.ts";
import type { LintResults } from "../types/linting.ts";
import { cacheStorageSchema } from "./cacheSchema.ts";
import { getCacheFilePath } from "./getCacheFilePath.ts";

const log = debugForFile(import.meta.filename);

export async function writeToCache(
	host: LinterHost,
	configFileName: string,
	lintResults: LintResults,
	cacheLocation: string | undefined,
) {
	const fileDependents = new CachedFactory(() => new Set<string>());
	const timestamp = Date.now();
	const filesWithGlobalDeclarations: FileWithGlobalDeclarations[] = [];

	for (const [filePath, fileResult] of lintResults.filesResults) {
		const rawFileContent = await host.readFile(filePath);
		if (rawFileContent === undefined) {
			log("Failed to resolve file path for file in lint results: %s", filePath);
			continue;
		}
		const hasGlobals = containsGlobalDeclarations(rawFileContent);
		if (hasGlobals) {
			filesWithGlobalDeclarations.push({
				filePath,
				touchTime: await host.getFileTouchTime(filePath),
			});
		}
		for (const dependency of fileResult.dependencies) {
			fileDependents.get(dependency).add(filePath);
		}
	}

	const storage: CacheStorage = {
		configs: {
			[configFileName]: await host.getFileTouchTime(configFileName),
			"package.json": await host.getFileTouchTime("package.json"),
		},
		files: {
			...Object.fromEntries(
				Array.from(lintResults.filesResults).map(([filePath, fileResults]) => [
					filePath,
					{
						...omitEmpty({
							dependencies: Array.from(fileResults.dependencies).sort(),
							languageReports: fileResults.languageReports,
							reports: fileResults.reports,
						}),
						timestamp,
					},
				]),
			),
			...(lintResults.cached &&
				Object.fromEntries(
					Array.from(lintResults.cached).filter(([filePath]) =>
						lintResults.allFilePaths.has(filePath),
					),
				)),
		},
		filesWithGlobalDeclarations,
	};

	const cacheFilePath = getCacheFilePath(cacheLocation);
	const cacheFileDirectory = dirname(cacheFilePath);

	await fs.mkdir(cacheFileDirectory, { recursive: true });

	const encoded = cacheStorageSchema.safeEncode(storage);
	if (!encoded.success) {
		log("Failed to encode cache data: %s", encoded.error.message);
		return;
	}

	await fs.writeFile(cacheFilePath, encoded.data);
}

function containsGlobalDeclarations(rawFileContent: string) {
	const sourceFileNode = ts.createSourceFile(
		"mayContainGlobals.ts",
		rawFileContent,
		ts.ScriptTarget.ESNext,
		true,
	);

	return sourceFileNode.statements.some((statement) => {
		// checks for 'declare global {}'
		if (ts.isModuleDeclaration(statement) && statement.name.text === "global") {
			return true;
		}

		// checks for 'declare' keyword
		const canHaveModifiers = ts.canHaveModifiers(statement);
		if (!canHaveModifiers) {
			return false;
		}

		const modifiers = ts.getModifiers(statement);
		const hasDeclareKeyword = modifiers?.some(
			(mod) => mod.kind === ts.SyntaxKind.DeclareKeyword,
		);

		return hasDeclareKeyword;
	});
}
