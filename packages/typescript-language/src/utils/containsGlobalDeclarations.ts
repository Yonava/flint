import ts from "typescript";

/**
 * Inspects top-level statements of a TS source file to determine
 * if it introduces or modifies entities in the global scope.
 * @param rawFileContent The raw source code of the file to analyze.
 * @returns `true` if the file contains explicit global augmentations
 * (e.g., `declare global {}`) or top-level ambient declarations (e.g., `declare const`),
 * otherwise `false`.
 */
export function containsGlobalDeclarations(rawFileContent: string) {
	const sourceFileNode = ts.createSourceFile(
		"mayContainGlobals.ts",
		rawFileContent,
		ts.ScriptTarget.ESNext,
		true,
	);

	const isModule = ts.isExternalModule(sourceFileNode);

	return sourceFileNode.statements.some((statement) => {
		// checks for 'declare global {}'
		if (ts.isModuleDeclaration(statement) && statement.name.text === "global") {
			return true;
		}

		// In a module file, bare `declare` statements are local to the module
		if (isModule) {
			return false;
		}

		// In a script file, top-level `declare` statements affect the global scope
		const canHaveModifiers = ts.canHaveModifiers(statement);
		if (!canHaveModifiers) {
			return false;
		}

		const modifiers = ts.getModifiers(statement);
		return modifiers?.some((mod) => mod.kind === ts.SyntaxKind.DeclareKeyword);
	});
}
