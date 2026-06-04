import { describe, expect, it } from "vitest";

import { containsGlobalDeclarations } from "./containsGlobalDeclarations.ts";

describe("containsGlobalDeclarations", () => {
	it("returns true for declare global blocks", () => {
		const code = `
      import { Something } from 'some-module';
      declare global {
        interface Window {
          customProperty: string;
        }
      }
    `;
		expect(containsGlobalDeclarations(code)).toBe(true);
	});

	it("returns true for top-level ambient declarations in script files", () => {
		const code = `
      declare function initializeAnalytics(): void;
    `;
		expect(containsGlobalDeclarations(code)).toBe(true);
	});

	it("returns false for standard module code", () => {
		const code = `
      import axios from 'axios';

      export const fetchData = async () => {
        return axios.get('/api/data');
      };

      interface LocalUser {
        id: string;
      }
    `;
		expect(containsGlobalDeclarations(code)).toBe(false);
	});

	it("returns false for empty source files", () => {
		expect(containsGlobalDeclarations("")).toBe(false);
		expect(containsGlobalDeclarations("\n  \n")).toBe(false);
	});

	it("returns false for module files with top-level declare outside declare global", () => {
		const code = `
      import { foo } from './foo';
      declare function localHelper(): void;
      declare const config: { debug: boolean };
    `;
		expect(containsGlobalDeclarations(code)).toBe(false);
	});

	it('returns false for inline type annotations that reference "global" by name', () => {
		const code = `
      import { globalState } from './store';
      const myVar: typeof globalState = { active: true };
    `;
		expect(containsGlobalDeclarations(code)).toBe(false);
	});
});
