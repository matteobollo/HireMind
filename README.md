# HireMind

HireMind is a web application that analyzes a CV against a target job description and generates a structured match report. It helps users understand how well their resume aligns with a role, which strengths are already visible, which signals are missing, and how to rewrite parts of the CV more effectively.

## Overview

The application is designed around a simple workflow:

1. Upload a CV in PDF format.
2. Paste a target job description.
3. Generate a structured analysis report.
4. Review current fit, strengths, missing signals, gaps, and rewrite suggestions.
5. Reopen previous analyses from the history panel.

The current UI is built with a premium dashboard-like layout:
- interactive hero section;
- PDF upload area with drag and drop;
- job description form;
- latest analysis report;
- previous analyses history;
- detailed report panel with score visualization and grouped insights.

## Features

- PDF-only CV upload
- Resume-to-job matching
- Overall match score normalization
- Highlighted strengths
- Signals not explicitly shown
- Potential gaps
- CV rewrite suggestions
- Analysis history browsing
- Premium responsive UI with glassmorphism-style panels
- Interactive score orb and progress bar for fit visualization

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- CSS

### Backend
The frontend expects a backend running locally on:

```txt
http://localhost:8000
```

Expected backend capabilities:
- upload and parse PDF documents;
- store uploaded documents;
- run CV/job analysis;
- return previous analyses history.

## Expected API Endpoints

The frontend currently uses these endpoints:

### Upload CV
```http
POST /api/documents/upload
```

Expected behavior:
- accepts `multipart/form-data`;
- expects a `file` field containing a PDF;
- returns a JSON payload with at least:

```json
{
  "id": 1,
  "text": "Extracted CV text..."
}
```

### Run analysis
```http
POST /api/analysis
```

Expected JSON body:

```json
{
  "document_id": 1,
  "job_title": "Machine Learning Engineer",
  "company": "Example Company",
  "job_description": "Full job description..."
}
```

Expected response shape:

```json
{
  "overall_match": "72%",
  "strengths": ["Python", "SQL"],
  "not_explicitly_shown": ["LLM experience"],
  "missing_or_weak_areas": ["Production ML systems"],
  "cv_rewrite_suggestions": ["Rewrite bullet X to highlight impact"]
}
```

### Analysis history
```http
GET /api/analysis/history
```

Expected response shape:

```json
[
  {
    "analysis_id": 2,
    "document_id": 1,
    "filename": "CV Matteo.pdf",
    "job_title": "AI / Machine Learning Specialist",
    "company": "Centrico",
    "job_description": "We are looking for...",
    "result": {
      "overall_match": "72%",
      "strengths": ["Python", "SQL"],
      "not_explicitly_shown": ["Generative AI experience"],
      "missing_or_weak_areas": ["Big Data tools"],
      "cv_rewrite_suggestions": ["Emphasize project outcomes"]
    }
  }
]
```

## Project Structure

A simplified structure of the frontend looks like this:

```txt
src/
├── App.tsx
├── main.tsx
├── index.css
└── components/
    └── InteractiveHeroCanvas.tsx
```

### Main responsibilities

- `App.tsx`
  - manages application state;
  - handles file selection and drag-and-drop;
  - uploads CVs;
  - sends analysis requests;
  - loads and displays history;
  - renders latest report and report detail panels.

- `InteractiveHeroCanvas.tsx`
  - renders the animated hero background.

- `index.css`
  - contains the full visual system, layout, panels, score orb styling, responsive behavior, and dashboard presentation.

## UI Structure

The interface is split into these main sections:

### 1. Hero
A landing section with animated visual background, headline, and primary navigation.

### 2. Analysis form
The user can:
- upload a PDF CV;
- enter target role;
- enter company;
- paste the job description;
- run the analysis.

### 3. Latest report
Shows the most recent analysis result returned by the backend:
- overall match;
- strengths;
- not explicitly shown signals;
- potential gaps;
- rewrite suggestions.

### 4. Previous analyses
Shows saved reports in compact preview cards:
- role title;
- company;
- score orb;
- file metadata;
- top strengths;
- short role preview.

### 5. Report details
Displays the selected historical analysis in a more detailed dashboard:
- selected role;
- overall match block;
- grouped insight cards;
- role snapshot.

## Match Score Logic

The UI converts qualitative or percentage-based responses into a numeric score using `normalizeMatchScore()`.

Supported patterns:
- direct percentages like `72%`;
- qualitative values like:
  - `excellent`
  - `very strong`
  - `strong`
  - `good`
  - `moderate`
  - `fair`
  - `weak`
  - `low`

This numeric score is then used to:
- render the score orb;
- decide score color tone;
- drive the progress bar fill width.

## Responsive Layout Decisions

The report area follows a master-detail layout:
- left side: history cards;
- right side: selected report details.

The detail panel uses more width than the history column so that:
- the score section can breathe;
- paired insight cards are easier to scan;
- the role snapshot can span full width below the summary cards.

The current detail layout groups content as:
- selected role header;
- overall match full-width block;
- `Strong matches` and `Signals not clearly shown` side by side;
- `Potential gaps` and `Rewrite suggestions` side by side;
- `Role snapshot` full width.

## Local Development

### Prerequisites

Make sure you have:
- Node.js 18+ installed;
- npm installed;
- the backend running on `http://localhost:8000`.

### Install dependencies

```bash
npm install
```

### Start the frontend

```bash
npm run dev
```

This usually starts the app on:

```txt
http://localhost:5173
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## How to Use

1. Start the backend.
2. Start the frontend with `npm run dev`.
3. Open the app in the browser.
4. Upload a PDF resume.
5. Fill in:
   - target role;
   - company;
   - full job description.
6. Click **Generate match report**.
7. Review the generated report.
8. Open previous analyses from the left-hand panel.

## Validation Rules

The frontend currently enforces:
- PDF uploads only;
- a job description must be provided before analysis starts.

If validation fails, the UI shows an error message.

## Current State

This project currently includes:
- polished UI structure;
- history/detail dashboard layout;
- score visualization system;
- backend integration logic.

It assumes the backend already handles:
- PDF parsing;
- persistence;
- analysis generation;
- history storage.

## Known Notes

- `cvText` is stored after upload but is not currently rendered in the UI.
- The frontend is tightly coupled to the expected backend response shape.
- If backend responses differ from the expected schema, the analysis view may fail or render incomplete data.
- The app currently uses hardcoded backend URLs pointing to `localhost:8000`.

## Possible Improvements

### Frontend
- add loading skeletons for the detail cards only;
- improve empty states for each report section;
- add deletion or pinning for previous analyses;
- add export to PDF;
- improve keyboard interaction for selectable history cards;
- add toast notifications for success/error flows.

### Backend integration
- move API base URL to environment variables;
- add stronger response validation;
- support authentication;
- support multiple uploaded CV versions.

### Product
- compare one CV against multiple job descriptions;
- compare multiple CVs against one role;
- add AI-generated tailored resume summary;
- add cover letter generation.

## Suggested Environment Variable

A better version of the app should use an environment variable like:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Then replace hardcoded fetch URLs with:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
```

Example:

```ts
fetch(`${API_BASE_URL}/api/analysis/history`)
```

## Troubleshooting

### The upload fails
Check:
- the backend is running;
- the endpoint is reachable;
- the file is a valid PDF.

### The report does not render
Check:
- the backend response matches the expected JSON shape;
- `result` includes all required arrays;
- the browser console for fetch or parsing errors.

### History does not load
Check:
- `GET /api/analysis/history` returns valid JSON;
- CORS is configured correctly on the backend;
- the backend server is reachable from the frontend.

## Intended Audience

This README is useful for:
- developers working on the frontend;
- developers integrating the backend;
- reviewers evaluating the project structure;
- recruiters or stakeholders who want to understand what the app does.

## Author

Project by Matteo Bollo.