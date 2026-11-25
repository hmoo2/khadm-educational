# Gemini Worker

The site uses the fixed Worker URL `https://frosty-hall-b193.hmoobaha8.workers.dev`. Keep `GEMINI_API_KEY` in Cloudflare Worker secrets only; never put it in frontend files.

## API

- `GET /` or `GET /api/subjects` returns the subject registry:

  ```json
  { "subjects": [{ "id": "biology", "label": "Biology — الأحياء" }] }
  ```

- `POST /api/chat` accepts `{ "message": "سؤال الطالب", "mode": "biology", "history": [] }` and returns `{ "text": "..." }`. `mode` must be a subject id from the registry. Optional `image` uses `{ "mimeType": "image/jpeg", "data": "BASE64" }`. Supported formats are JPEG, PNG, and WEBP; the site limits images to 5 MiB. The older `messages` request shape remains supported.

- `POST /api/exams/generate` requires a verified Supabase session and accepts the selected `mode`, `grade`, `examSystem`, `scope`, optional `scopeTopic`, `questionCount` (1–20), `durationMinutes` (5–180), `difficulty`, `questionTypes`, and optional `excludeQuestions` or source `image`. The Worker asks Gemini for structured JSON, validates every question and answer key, stores the private answer key, and returns `{ "attemptId": "...", "exam": { "title": "...", "questions": [...] } }` without correct answers, explanations, or rubrics. It returns an error instead of substituting fixed or sample questions if the generated response is invalid.

- `POST /api/exams/grade` requires the owning verified session, `attemptId`, `mode`, and an `answers` array with one `{ "id": "...", "text": "..." }` entry per question. An answer may also contain an `image`. The Worker ignores client-supplied answer keys and grades against the private server-stored exam; the response contains the score, per-question partial credit, feedback, strengths, weaknesses, and the answer key only after submission.

- Authenticated exam generation returns an `attemptId` and stores the exam server-side. `POST /api/exams/save` saves that user's answers, and grading uses the server-stored exam and writes the result. Exam attempts are private to the owning user; guest exam generation remains available but is saved only in the browser.
- Account routes require a verified Supabase session. `DELETE /api/account` deletes the signed-in user's account and private image files. Admin routes under `/api/admin` additionally require the user's server-side `admin` role; the Worker is the only code that uses the service-role key.
- `GET /api/admin/me`, `/api/admin/overview`, and `/api/admin/students?q=...` provide administrator status, platform statistics, and student search. `PATCH /api/admin/students/{userId}` activates or disables an account.

AI routes share the Worker rate limit of 20 requests per minute per client IP. Account and exam-answer persistence routes do not consume the AI quota. Errors use JSON `{ "error": "..." }`; Gemini or malformed-model responses return an error rather than a success-shaped fallback.

## Adding a subject

Add a stable id, display label, and teaching instruction to `SUBJECTS` in `src/index.js`, then deploy the Worker. The frontend loads this registry dynamically, so adding a subject does not require changing its API connection code.

## Local development and tests

1. From this directory run `npm install`.
2. Copy `.dev.vars.example` to `.dev.vars` and set a local Gemini secret there only if you need live Gemini requests. Do not send the secret in chat or commit the local file.
3. For account-route testing, also configure local `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` values in `.dev.vars`. Never commit these values or put the service-role key in the site.
4. Run `npm run dev` to start Wrangler.
5. Run `npm test` for Worker tests. The website continues to use the fixed production URL; use direct requests to the local Wrangler address when testing local Worker changes.

## Deploying

Deployment requires authentication to the Cloudflare account that owns `hmoobaha8`:

1. Run `npx wrangler login`.
2. Confirm that the Worker has a secret named `GEMINI_API_KEY`; its value does not need to be displayed.
3. Configure secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`; never expose the service-role key to the browser or repository.
4. Configure `ALLOWED_ORIGINS` to the production site origin instead of `*` before public use.
5. Run `npm run deploy`.

The configured Worker name matches the site's fixed URL.
