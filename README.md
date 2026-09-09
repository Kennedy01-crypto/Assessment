# Clinic Stock Console

An internal stock management console for clinic supply teams working on ward tablets and unreliable Wi-Fi. The app uses React, TypeScript, Vite, React Router and TanStack Query against [DummyJSON](https://dummyjson.com/docs).

## Run locally

```bash
npm install
npm run dev
```

Demo credentials: `emilys` / `emilyspass`.

Quality commands: `npm run format:check`, `npm run lint`, `npm run test`, `npm run build`.

## Section 1: design

### Components and screen division

`LoginPage` owns sign-in and inline failure feedback. `Protected` gates the application from the stored session. The authenticated shell contains the persistent header, user action and footer. `ListPage` composes the URL-driven search, category filter, sort control, pagination and `StockTable`. Each stock row is a deep link to `DetailPage`, which combines item information with an inline stock correction experience.

Loading, empty and recoverable error states are shared through `Status`. The list is a semantic linked row layout on wide screens and becomes a stacked, readable card-like row at narrow widths. Native form controls and visible focus states support keyboard use.

### State ownership

- Server state lives in TanStack Query: products, categories and individual item data are cached by query keys.
- URL state lives in `useSearchParams`: `search`, `category`, `sort` and `page` are the source of truth for the list. Reloads and copied links restore the same view.
- Local UI state is limited to the raw search value during its 300ms debounce, unsaved stock input and transient feedback.
- The session is stored in `localStorage` so a refresh does not erase authentication. The API wrapper refreshes access tokens reactively after a `401`; concurrent refreshes share one promise.

### Fetching, caching and invalidation

List query keys include every URL parameter. TanStack Query keeps the previous list visible while a changed query loads. Search requests are debounced and each parameter combination has an isolated query key, so a slower old response cannot replace the active result. Stock correction updates the item cache optimistically, rolls back on failure and invalidates the item query after the request settles.

DummyJSON does not provide a combined category-and-search endpoint. When both are selected, the app fetches the category collection and applies the search, sort and pagination locally. This preserves the user outcome without pretending the API supports a query it does not.

### Visual design and accessibility

The interface uses a small token set in `App.css`: deep teal for the operational shell, chartreuse for action and status accents, pale green surfaces, and a restrained border system. Manrope is used for interface text and DM Mono for catalogue metadata. Layout uses responsive grid rules down to 320px; no horizontal table scrolling is required at 360px.

Controls use native semantic elements, labels, keyboard focus rings and 44px touch targets. Result changes are announced in a visually hidden polite live region. Errors expose a retry action and stock-save failures explain that rollback occurred.

### Decision log

1. **TanStack Query instead of hand-rolled fetch state.** I rejected scattered `fetch` plus component state because delayed search and mutation rollback require cancellation, cache isolation and consistent status handling.
2. **Reactive single-flight token refresh instead of a timer.** A timer is unreliable when a tablet sleeps or a tab is backgrounded. Retrying after the actual `401`, with one shared refresh promise, handles concurrent expired requests without duplicate refresh calls.
3. **Stacked narrow rows instead of horizontal table scrolling.** A full table is difficult to read at 360px and hides stock information off-screen. Rows preserve every important field while wide screens retain a fast scanning layout.
4. **Inline correction instead of a modal.** The inline form keeps context, avoids mobile keyboard/focus-trap problems and makes failure recovery visible beside the edited count.

## Section 3: deployment and CI/CD

The GitHub Actions workflow in `.github/workflows/ci.yml` runs format, lint, tests and build on pull requests. It also validates the latest commit message on pushes. A merge to `main` runs the same quality job and then deploys the Vite build through Vercel using `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` repository secrets. Add the final public Vercel URL here after deployment.

## Section 4: AI reflection

- **Section 1:** AI was used to pressure-test the initial design against the brief after the first draft, especially the category-plus-search API limitation. The decisions and wording remained mine.
- **Section 2:** AI helped scaffold Vite tooling, draft repetitive React markup and suggest focused tests. I reviewed each boundary and adjusted the refresh and optimistic-update behavior.
- **Section 3:** AI drafted the GitHub Actions structure and commit hook wiring; I chose Vercel and the required blocking checks.
- **Section 4:** This reflection is written from the actual implementation process, not generated as a generic answer.

**Tools and workflow:** I used GitHub Copilot in VS Code with a small inspect, implement, build, repair loop. I did not use a separate spec-driven framework.

**Suggestion that improved the work:** Asking for a failure-mode pass over delayed search led to keeping the query parameters in the query key and debouncing only the URL update rather than allowing an old request to own the screen.

**Output I caught:** An initial scaffold attempt placed the project in a nested Windows path and a generated stylesheet replacement left invalid CSS markers. The workspace listing and production build caught both before feature work continued.

**Two decisions made without AI:** I chose URL state as the source of truth because copied links are an explicit user outcome, and I chose inline correction because ward tablets make modal focus and virtual-keyboard behavior needlessly fragile.

**Hardest area to defend:** The custom `request` refresh path is the area I would spend the most live-session time explaining. Its promise mutex prevents duplicate refresh calls, but the underlying public API's refresh-token behavior is still a mock and would need integration tests against the real identity service in production.

## Time and AI declaration

Record actual time spent here before submission. AI was used for project scaffolding, implementation assistance, test scaffolding, documentation drafting and CI configuration. All submitted behavior was reviewed locally with build, lint, format and test commands.
