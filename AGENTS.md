# JYXR Editor Development Rules

## Supported Platform

- This editor is a PC-only authoring tool. Its supported UI targets are desktop browsers on Windows and macOS.
- Do not spend implementation or verification effort on mobile layouts, mobile navigation, touch-only interactions, or phone/tablet viewport adaptation unless the user explicitly requests it.
- Mobile viewport regressions are outside the acceptance criteria and must not block delivery of editor features.
- Keep ordinary desktop window resizing usable, but do not introduce mobile breakpoints or mobile-specific component variants for that purpose.
- Default frontend visual verification should cover representative desktop viewports only.
