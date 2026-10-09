---
"@flint.fyi/vitest": patch
---

Stop recognizing uninvoked Vitest factories, such as `test.runIf(true)`, and unknown invoked members, such as `test.nonsense([1])()`, as Vitest functions in Vitest rules.
