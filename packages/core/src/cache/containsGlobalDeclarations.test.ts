import { describe, expect, it } from "vitest";

import { containsGlobalDeclarations } from "./containsGlobalDeclarations.ts";

describe("containsGlobalDeclarations", () => {
	it('should return true for "declare global" blocks', () => {
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

	it("should return true for top-level ambient functions", () => {
		const code = `
      declare function initializeAnalytics(): void;
    `;
		expect(containsGlobalDeclarations(code)).toBe(true);
	});

	it("should return false for standard module code without global modifications", () => {
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

	it("should return false for empty source files", () => {
		expect(containsGlobalDeclarations("")).toBe(false);
		expect(containsGlobalDeclarations("\n  \n")).toBe(false);
	});

	it('should return false for inline type annotations that use the word "global"', () => {
		const code = `
      import { globalState } from './store';
      const myVar: typeof globalState = { active: true };
    `;
		expect(containsGlobalDeclarations(code)).toBe(false);
	});
});
