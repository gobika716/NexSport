# Implementation Spec — Client-Side OCR Sport-Certificate Verification
**Repo:** `gobika716/NexSport` · **Branch:** `map-venue` · **Target agent:** Antigravity
**Status:** Ready for implementation · **Cost target:** ₹0 (no paid OCR API)

> This spec was written **after cloning and reading the actual `map-venue` branch**, not from the PRD in isolation. Every file path, type name, and field below matches what's already in the repo. The goal is a pure **addition**: one new pre-check screen inside the existing signup certificate-upload step. Nothing about login, existing signup fields, the admin dashboard, matchmaking, or venues should change.

---

## 0. Ground truth from the current codebase (read this before coding)

| Thing | Reality in `map-venue` (not the generic PRD assumption) |
|---|---|
| Stack | TanStack Start (React 19, SSR via Nitro/Vercel adapter), Vite, Tailwind, Drizzle ORM + `better-sqlite3`, managed by `@lovable.dev/vite-tanstack-config` |
| Signup UI | `src/components/modals/AuthModal.tsx` — a 5-step wizard: `account → sport → experience → assessment → verification` |
| "Choose your game" step | Already implemented at `step === "sport"` (line ~284). Sport list comes from `gameNames` / `GameId` in `src/data/gameQuestions.ts` |
| **Actual supported sports** | `badminton, cricket, football, basketball, volleyball, tennis, table-tennis, kabaddi` — **no chess, no hockey**. Do NOT reuse the PRD's example keyword dictionary verbatim; it invents two sports that don't exist in this app. |
| Certificate upload | Already implemented at `step === "verification"` (line ~376–438). It's a "Do you have a high-level sports certificate?" Yes/No radio, then a raw `<input type="file">` |
| Current file rules | `accept="image/jpeg,image/png,.jpg,.jpeg,.png"`, **max 5 MB** (not 10 MB — PRD's number is wrong for this repo), converted to a base64 data URL via `FileReader`, stored in local state `certificateData` |
| Server-side re-validation | `src/server/auth.ts` (`signupFn`, ~line 95–217) independently re-checks the mime type via regex `^data:(image\/(?:jpeg|png));base64,...` and the 5 MB size limit. **This is the real gate that blocks bad uploads today.** |
| What happens after upload | Certificate is stored as-is (`certificateImage`) in `player_assessments` with `certificateStatus: "pending"`; the **user account itself** goes to `accountStatus: "pending"`. An admin manually reviews and approves/rejects it later (see `src/server/admin.ts`, `src/routes/dashboard.tsx` `DetailField`). |
| DB schema | `src/db/schema.ts` — `users` and `playerAssessments` tables. Migrations are Drizzle-generated (`drizzle/0000..0008`), run via `npm run db:generate` / `npm run db:migrate`. |
| Package manager | `npm` (see `RUNNING.txt`) — even though `bun.lock` exists, treat `npm` as canonical since that's the documented workflow. |
| Deployment | Vite build → Nitro → deployed on Vercel (`nex-sport-chi.vercel.app`). No `vercel.json` present; framework auto-detected. |

**Implication:** The OCR feature is a **client-side pre-check bolted onto the existing "verification" step**, not a new signup step, not a new page, and not a replacement for the existing admin review pipeline. Admin review stays exactly as it is — OCR just stops obviously-wrong certificates from ever reaching that pipeline, and stores extra metadata for the admin's benefit.

---

## 1. Objective (scoped to this repo)

When a user is on the `verification` step of `AuthModal` and chooses **"Yes"** (has a certificate):

1. They upload an image, exactly like today.
2. Before it's accepted into `certificateData`, run OCR **in the browser** (Tesseract.js/WASM).
3. Extract text, detect which sport it's about, compare against `selectedGame` (chosen back in the `sport` step).
4. If it's a confident match → accept, keep existing flow (preview image, enable "Complete signup").
5. If it's a mismatch, unreadable, or low-confidence → block, show a clear reason, let the user re-upload **without leaving the modal or losing their progress** (account info, sport, experience, assessment answers must all be preserved — they already are, since this is all local component state).

No server calls to any third-party OCR API. No API key. No cost.

---

## 2. New files to create

```
src/data/sportKeywords.ts              # keyword dictionary, keyed by existing GameId
src/lib/certificate/imagePreprocess.ts # canvas resize/grayscale/contrast before OCR
src/lib/certificate/ocr.ts             # Tesseract.js worker lifecycle + text extraction
src/lib/certificate/sportValidation.ts # keyword+context matching, confidence scoring
src/components/certificate/CertificateUpload.tsx  # replaces the raw <input> block in AuthModal
public/tesseract/                      # self-hosted worker/core/lang files (see §6)
```

No existing file should be deleted. `AuthModal.tsx` is **edited**, not rewritten.

---

## 3. `src/data/sportKeywords.ts`

Build the dictionary from the **real** `GameId` union, not a hardcoded new list:

```ts
import type { GameId } from "@/data/gameQuestions";

export const sportKeywords: Record<GameId, string[]> = {
  badminton: ["badminton", "shuttle", "shuttlecock", "baf"],
  cricket: ["cricket", "bcci", "wicket", "batting", "bowling", "tcaa"],
  football: ["football", "soccer", "fifa", "aiff"],
  basketball: ["basketball", "nba", "fiba", "baf i"],
  volleyball: ["volleyball", "vfi"],
  tennis: ["tennis", "atp", "wta", "aita"],
  "table-tennis": ["table tennis", "ping pong", "ttfi"],
  kabaddi: ["kabaddi", "raider", "raid", "akfi"],
};

export const certificateContextKeywords = [
  "certificate", "championship", "tournament", "competition",
  "participated", "participation", "player", "winner",
  "runner-up", "runner up", "medal", "achievement", "sports",
];
```

Keep this exported and typed by `GameId` so if a sport is ever added to `gameQuestions.ts`, TypeScript forces the keyword map to be updated too — this is the main "extensibility" requirement from the PRD, done via the type system instead of a loose object.

---

## 4. `src/lib/certificate/imagePreprocess.ts`

Pure canvas work, no dependencies:
- Load the uploaded `File`/`Blob` into an `<img>` / `createImageBitmap`.
- Downscale if the longer edge is above ~1600px (keeps OCR fast; Tesseract doesn't need more).
- Draw to an off-screen `<canvas>`, convert to grayscale, apply a simple contrast stretch.
- Return a `Blob` or data URL ready for Tesseract.
- Must be guarded so it never throws on unsupported/corrupt images — return `null` and let the caller fall back to the original file so OCR still gets a shot at it.

---

## 5. `src/lib/certificate/ocr.ts`

Wraps `tesseract.js`:
- `recognizeCertificateText(image: Blob | string, onProgress?: (status: string, pct: number) => void): Promise<string>`
- Creates a worker with `createWorker`, loads the `eng` language, runs `recognize`, **always terminates the worker in a `finally`** (Tesseract workers leak memory/CPU if left running — important since this runs inside a modal a user may open/close repeatedly).
- Wrap in try/catch and rethrow a typed `OcrError` so the UI layer can distinguish "OCR failed to read anything" from "text extracted but sport not found."
- **Must be dynamically imported** (`await import("tesseract.js")`) and only ever called from inside a `useEffect`/event handler that already checked `typeof window !== "undefined"`. TanStack Start SSRs this modal's parent tree; a top-level `import "tesseract.js"` at module scope risks breaking the server build. Dynamic import inside `CertificateUpload.tsx`'s handler avoids this entirely.

---

## 6. Self-hosting Tesseract's WASM/lang assets (Vercel reliability)

Tesseract.js by default fetches `tesseract-core.wasm.js`, the worker script, and `eng.traineddata.gz` from a CDN (`cdn.jsdelivr.net` / `tessdata.projectnaptha.com`) at runtime. **Don't rely on that** for a production Vercel deployment — it's an unnecessary external dependency for a feature whose whole point is "no third-party service," and it can be slow or blocked by network policy for some users.

Instead:
1. After `npm install tesseract.js`, copy the needed static assets into `public/tesseract/`:
   - `node_modules/tesseract.js-core/tesseract-core-simd.wasm.js` (+ `.wasm`)
   - `node_modules/tesseract.js/dist/worker.min.js`
   - An `eng.traineddata.gz` (download once at build time / commit it — it's ~4–11MB depending on the variant; use the fast/integer variant to keep it small)
2. Point `createWorker` at these local paths explicitly:
   ```ts
   createWorker("eng", 1, {
     workerPath: "/tesseract/worker.min.js",
     corePath: "/tesseract/tesseract-core-simd.wasm.js",
     langPath: "/tesseract/",
   });
   ```
3. Verify these are served correctly from `public/` in both `npm run dev` and `npm run build && npm run preview` before considering this done — Vite serves `public/` as-is, and Vercel's static asset handling should mirror that, but confirm on a preview deployment since this repo's Nitro/Vercel wiring isn't visible from source alone.

This is the single most likely place for "works locally, breaks on Vercel" — call it out explicitly in the PR description and test it against a real Vercel preview URL, not just `localhost`.

---

## 7. `src/lib/certificate/sportValidation.ts`

```ts
export interface SportValidationResult {
  detectedSport: GameId | null;
  confidence: number;        // 0-100
  matchesSelected: boolean;
  reason: "strong_match" | "possible_match" | "mismatch" | "no_sport_detected" | "insufficient_text";
}

export function validateCertificate(
  extractedText: string,
  selectedGame: GameId,
): SportValidationResult
```

Scoring (from PRD §10, unchanged — it's sound):
- Selected sport's name/alias explicitly appears → +40
- Any other sport-specific keyword for the selected sport appears → +20
- Certificate terminology present (`certificateContextKeywords`) → +20
- Participation/achievement context present → +20
- **≥80 → strong_match → pass.** 60–79 → possible_match → **treat as failure for V1** (matches PRD §10 decision — don't auto-pass ambiguous certificates). <60 → mismatch or no_sport_detected.
- Also independently score every *other* sport's keywords; if another sport scores higher than the selected one, that's a `mismatch` with `detectedSport` set to the higher-scoring sport — this drives the "Detected sport: Badminton, please upload a Cricket certificate" message.
- All matching must be case-insensitive and tolerant of OCR noise (e.g. normalize whitespace, strip non-alphanumeric before substring checks).

Keep this function pure (text in, result out) — no DOM, no React — so it's trivially unit-testable.

---

## 8. `src/components/certificate/CertificateUpload.tsx`

New component, props:
```ts
{
  selectedGame: GameId;
  value: string;              // current certificateData (data URL), "" if none
  onChange: (dataUrl: string) => void;
  onError: (message: string) => void;
}
```

Internally owns the OCR pipeline and a local `status: "idle" | "reading" | "detecting" | "matched" | "failed"` state machine mirroring PRD §6 states 1–5. Behavior:

1. User picks a file → run the **existing** client-side validation first (jpeg/png/webp, size ≤ 5 MB — keep the current 5 MB limit; do not silently change it to 10 MB, that's a behavior change beyond this feature's scope and would also need the server-side check in `auth.ts` updated in lockstep. If WEBP support is wanted, that's a deliberate, separate decision — see §11).
2. If it passes those checks, preprocess (§4) → OCR (§5) → validate (§7).
3. Show the matching PRD-shaped states inline (reuse existing Tailwind classes/patterns already in `AuthModal.tsx`, don't introduce a new design system).
4. Only call `onChange(dataUrl)` (i.e., only make the certificate "accepted" into the parent's `certificateData` state) when `matchesSelected === true`. On mismatch/failure, call `onError(message)` and do **not** call `onChange` — leave `certificateData` empty so the existing "Complete signup" validation (`if (verificationType === "Yes" && !certificateData)`) continues to correctly block submission until a valid certificate is provided. This means the existing guard in `submitSignup` needs **zero changes** — it already does the right thing once this component only ever emits verified certificates.
5. Always show "Upload another certificate" affordance on failure (just clears local OCR state and re-shows the file input — no full remount needed).
6. Also propagate `detectedSport` and `confidence` upward (extend `onChange` to `onChange: (dataUrl: string, meta: { detectedSport: GameId; confidence: number }) => void`) so `AuthModal` can pass them through to `auth.signup(...)`.

---

## 9. `AuthModal.tsx` — exact, minimal edit

Replace the block at `step === "verification"` → `verificationType === "Yes"` (currently the raw `<input type="file">` at line ~403–437) with:

```tsx
<CertificateUpload
  selectedGame={selectedGame!}
  value={certificateData}
  onChange={(dataUrl, meta) => {
    setCertificateData(dataUrl);
    setDetectedSport(meta.detectedSport);
    setCertificateConfidence(meta.confidence);
    setCertificateError("");
  }}
  onError={(message) => {
    setCertificateData("");
    setCertificateError(message);
  }}
/>
```

Add two new pieces of local state next to the existing `certificateData`/`certificateError`:
```ts
const [detectedSport, setDetectedSport] = useState<GameId | null>(null);
const [certificateConfidence, setCertificateConfidence] = useState<number | null>(null);
```
Reset them in the existing `useEffect` that resets modal state on close (the one at line ~89–100), alongside `certificateData`.

Pass them through in `submitSignup`'s call to `auth.signup(...)`:
```ts
...(certificateData ? { certificateData, detectedSport, certificateConfidence } : {}),
```

**Everything else in `AuthModal.tsx` — the step machine, `goNext`, the account/sport/experience/assessment steps, login — is untouched.**

---

## 10. Plumbing the new fields through (additive only)

Extend, don't modify, the existing shapes:

- `src/lib/auth.tsx` — `signup(values: {...})`: add optional `detectedSport?: string; certificateConfidence?: number;` to the parameter type and forward them in the fetch/server-fn call, same pattern as the existing `certificateData?`.
- `src/server/auth.ts` — `signupFn` validator: add `detectedSport?: string; certificateConfidence?: number;` to the input type. Insert them into the `playerAssessments` row (two new columns — see below). **Do not remove or repurpose the existing mime/size re-validation** (lines ~121–136); it stays as the server-side source of truth regardless of what the client's OCR concluded, since OCR result is a UX gate, not a security boundary.
- `src/db/schema.ts` — add two nullable columns to `playerAssessments`:
  ```ts
  detectedSport: text("detected_sport"),
  certificateConfidence: integer("certificate_confidence"),
  ```
  Then run `npm run db:generate` to produce a new Drizzle migration file (it will be `drizzle/0009_*.sql`, following the existing numbering) and `npm run db:migrate` to apply it locally. **Do not hand-edit any of the existing `drizzle/000*.sql` files.**
- `src/server/admin.ts` / `src/routes/dashboard.tsx` (optional, nice-to-have, not required for V1 acceptance): surface `detectedSport` / `certificateConfidence` next to the existing `DetailField label="Verification Type"` so admins can see the OCR's read alongside their own manual review. Purely additive UI — do not change the existing admin approve/reject logic or `certificateStatus` state machine.

---

## 11. Explicit deviations from the raw PRD, and why

| PRD says | This repo does instead | Why |
|---|---|---|
| Sport list includes Chess, Hockey | Use the 8 real `GameId`s only | Those sports don't exist anywhere else in the app (no assessment questions, no images) — adding OCR keywords for sports the rest of the app doesn't support would be dead code and a confusing mismatch |
| Max file size 10 MB | Keep existing 5 MB | Changing this means also editing the server-side check in `auth.ts` and is an unrelated scope increase; flag as a follow-up if actually wanted |
| Formats: JPG/JPEG/PNG/WEBP | Keep JPG/JPEG/PNG for V1; WEBP only if explicitly requested | Current server-side regex only allows `image/jpeg|image/png`. Adding WEBP requires updating that regex too (`auth.ts` line ~124) — doable, but is a second, coordinated change, not a silent side effect of this feature |
| New signup step in the flow diagram | No new step | The repo already has certificate upload living inside the existing `verification` step; OCR is a gate *within* that step's file input, not a new step in the `steps` array |

If any of these are actually wanted, call them out as separate follow-up tasks so they get their own review — don't bundle a max-file-size or format-support change into this PR.

---

## 12. Non-regression checklist (must all still pass after this change)

- [ ] Login flow (`mode === "login"`) completely unaffected.
- [ ] Signup with `verificationType = "No"` (no certificate) works exactly as before — `CertificateUpload` is never even rendered in this path.
- [ ] `account`, `sport`, `experience`, `assessment` steps — no visual or behavioral change.
- [ ] Existing "Previous"/"Next"/"Complete signup" button logic in the shared footer (line ~441–460) untouched.
- [ ] Server-side mime/size re-validation in `signupFn` still rejects a hand-crafted request with a bad `certificateData` payload, independent of what the client claims.
- [ ] `player_assessments` rows for existing users (created before this migration) still read correctly — new columns must be nullable with no default-value assumptions elsewhere in the codebase.
- [ ] Admin dashboard (`src/routes/dashboard.tsx`, `src/server/admin.ts`) — certificate review/approve/reject flow for pending accounts is unchanged; OCR fields are additive display only.
- [ ] `npm run build` succeeds — specifically confirms `tesseract.js`'s dynamic import doesn't get pulled into the SSR bundle (check Nitro's server chunk output for `tesseract` — it shouldn't appear there).
- [ ] A full local run (`npm run db:setup && npm run dev`) still seeds and logs in with the existing demo account (`demo@nexsport.app` / `demo1234`).
- [ ] Manually verified on an actual Vercel preview deployment, not just local dev — per §6, this is the highest-risk part of the change.

---

## 13. Manual test matrix

1. Select **Badminton**, upload a genuine badminton certificate image → strong match → proceeds, `certificateData` set, signup completes.
2. Select **Cricket**, upload the same badminton certificate → mismatch shown with "Detected sport: Badminton", certificate rejected, user can re-upload without losing earlier steps' answers.
3. Select any sport, upload a blank/blurry/non-certificate image → "couldn't read this certificate clearly" state, re-upload available.
4. Select any sport, upload a >5 MB or non-image file → rejected by the **existing** pre-OCR validation (unchanged behavior), OCR never runs.
5. Choose "No" on the "do you have a certificate" question → certificate UI (and OCR) never appears; signup completes as it does today.
6. Close and reopen the signup modal mid-flow → all state (including OCR-related state) resets cleanly, no leaked Tesseract worker (check DevTools memory/worker panel doesn't accumulate on repeated open/close).
7. Throttle network to "Offline" after initial page load, then run OCR → should still work, since assets are self-hosted per §6, not CDN-fetched.

---

## 14. Suggested `package.json` addition

```
npm install tesseract.js
```
No other new runtime dependency is required — preprocessing uses the platform `Canvas`/`Image` APIs, and matching is plain TypeScript.