---
applyTo: '**'
---

# 📝 Copilot Coding & Project Guidelines

## General Principles

- **Read before writing:** Review relevant docs, planning notes, and related files before editing or creating anything.
- **No build artifacts:** Never create or modify anything inside `/build/` or equivalent output directories.
- **Documentation required:** Update all relevant docs (`README.md`, feature docs, API docs, changelogs) after code changes. Update comments and `CONTRIBUTING.md` as needed.
- **No orphan files:** Register new files/components in the correct modules, routes, or parent components.

---

## File & Component Standards

- **Follow structure:** Use the existing folder structure and naming conventions. Organize by feature, not file type.
- **No unreferenced files:** All files must be imported and used somewhere.

---

## React-Specific Practices

- **Component design:** Use pure, focused, reusable functional components and Hooks. Prefer composition over prop bloat.
- **Performance:** Use `React.memo`, `useMemo`, and `useCallback` only after profiling. Code-split heavy components.
- **State management:** Prefer `useState` > `useReducer` > `Context` > external state managers.
- **UI/UX:** Always handle loading, error, and empty states. Use schema-based form validation. Ensure accessibility and theming via Tailwind or styled-components.

---

## Security

- **Sanitize input and escape output.**
- **No sensitive data in localStorage;** use HttpOnly cookies.
- **Strict CORS and CSP headers.**

---

## Mindset & Principles

- **Be intentional:** Every change should be justifiable.
- **DRY, but avoid premature abstraction.**
- **Refactor early and often.**
- **Clarity over cleverness.**
- **Stay informed:** Read RFCs, React updates, and changelogs.

---

## Anti-Patterns to Avoid

- Prop drilling across too many layers.
- `useEffect` without dependencies.
- Modifying props directly.
- Overusing Context.
- Leaving files unreferenced or undocumented.

---

## Final Checklist Before Push

- [ ] Code is clean, DRY, and self-explanatory.
- [ ] All files are created, imported, and registered.
- [ ] Docs updated.
- [ ] No build directory touched.
- [ ] Commit message follows repo rules.

---

## UI Design Instructions

### Design System

- Use consistent design tokens (spacing, font sizes, colors, etc.).
- typographic scale for font sizes.
- Minimal color palette; ensure WCAG contrast compliance.

### Responsive Design

- Mobile-first; use standard breakpoints.
- Use Flexbox/Grid; avoid fixed px widths.

### Component Guidelines

- Modular, reusable, responsive components.
- Handle empty, loading, and error states.
- Standardized spacing and sizing.

### UX Patterns

- All interactive elements have hover, active, and disabled states.
- Provide loading indicators for async actions.
- Use semantic HTML and ARIA labels.
- All components are keyboard navigable.

### Visual Hierarchy

- Use contrast, grouping, and whitespace for clarity.
- Avoid visual noise and excessive decoration.

### Tooling

- Use TailwindCSS for styling.
- Use shadcn/ui, Radix, or Headless UI for base components.
- Use Framer Motion or Tailwind transitions for animation.
- Use Lucide or Heroicons for icons.

---


## General Anti-Patterns

- Mixing HTML and logic in the same file.
- Catching exceptions without logging.
- Using global state unnecessarily.
- Not checking return values or error codes.

---
