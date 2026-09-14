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

### Vercel deployment

- **Public URL:**
  https://assessment-rose-eight.vercel.app/
- **Production branch:** `master`

The Vercel project is connected directly to the GitHub repository. Vercel builds the Vite application and deploys a new production version automatically when a pull request is merged into `master`. Preview deployments can be enabled for pull requests in Vercel so a reviewer can inspect a change before it is merged.

### GitHub Actions quality gate

`.github/workflows/ci.yml` runs for every pull request targeting `master` branch. It runs `npm ci`, `npm run format:check`, `npm run lint`, `npm run test`, `npm run build`, and commitlint across the complete pull request commit range. A failed formatter check, lint check, test, build, or commit-message check fails the required GitHub check and should block merging through the branch protection settings.

The local `.husky/commit-msg` hook runs the same Conventional Commits rules before a commit is created. The deployment itself is intentionally not duplicated in GitHub Actions: Vercel's repository integration owns the merge-to-production deployment, so no Vercel token or project secrets are needed in GitHub Actions.

## Section 4: AI reflection

- **Section 1:** I used Gemini 3.1 Pro (because of its advanced reasoning) to pressure-test the initial design against the brief after the first draft, especially the category-plus-search API limitation. The decisions and wording remained mine.
- **Section 2:** AI helped scaffold Vite tooling, draft repetitive React markup and suggest focused tests. I reviewed each boundary and adjusted the refresh and optimistic-update behavior.
- **Section 3:** I used Github copilot locally on my laptop to draft the GitHub Actions structure for deployment.
- **Section 4:** This reflection is written from the actual implementation process.

**Tools and workflow:**

I used GitHub Copilot in VS Code with a small inspect, implement, build, repair loop. I also used AI conversationally (Gemini and Claude) as a sounding board, not as a workflow engine. I did not use a separate spec-driven framework.

**Suggestion that improved my work:**

I asked Google Gemini AI to explain why server data, URL state, and local UI state are not the same thing.

It broke down the three categories: server data as the database truth, URL state as query parameters for navigation, and local UI state as ephemeral component state.

I was able to connect this explanation directly to my endpoints e.g., /products/search?q=phone belongs in URL state, /auth/me is server data, and a dropdown toggle on the product page is local UI state.

**Output I caught:**

I realised that one generated change had introduced invalid CSS, and I caught it by running the production build before continuing with feature work. That reminded me to validate AI-assisted changes immediately rather than assuming the generated output was safe.

**Two decisions made without AI:**

1. I chose URL state as the source of truth because copied links are an explicit user outcome.
2. Decided to use PUT /products/:id for updates, I relied on my own REST knowledge rather than asking AI.

**Hardest area to defend:**

My token refresh logic:
It works, but I don’t have a deep understanding of all the edge cases (e.g., token revocation vs. blacklisting). If pressed, I’d admit it’s heuristic and could be improved with more security input.

## Time and AI declaration

TIME SPENT: 36 hours.

AI was used for:

1. Project Scaffolding
2. Implementation assistance
3. Test scaffolding
4. Documentation drafting, and
5. CI configuration.

All submitted behavior was reviewed locally with build, lint, format and test commands.
