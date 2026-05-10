import { useEffect, useMemo, useRef, useState } from 'react'
import InteractiveHeroCanvas from './components/InteractiveHeroCanvas'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

type AnalysisResponse = {
  overall_match: string
  strengths: string[]
  not_explicitly_shown: string[]
  missing_or_weak_areas: string[]
  cv_rewrite_suggestions: string[]
}

type HistoryItem = {
  analysis_id: number
  document_id: number
  filename: string
  job_title: string
  company: string
  job_description: string
  result: AnalysisResponse
}

const loadingMessages = [
  'Uploading and parsing your CV',
  'Matching experience against the role',
  'Generating rewrite suggestions',
]

function normalizeMatchScore(value?: string): number {
  if (!value) return 0

  const percentageMatch = value.match(/(\d{1,3})\s*%/)
  if (percentageMatch) {
    return Math.max(0, Math.min(100, Number(percentageMatch[1])))
  }

  const normalized = value.trim().toLowerCase()

  if (normalized.includes('excellent') || normalized.includes('very strong')) return 90
  if (normalized.includes('strong')) return 78
  if (normalized.includes('good')) return 72
  if (normalized.includes('moderate')) return 58
  if (normalized.includes('fair')) return 50
  if (normalized.includes('weak')) return 36
  if (normalized.includes('low')) return 28

  return 0
}

function getScoreTone(score: number) {
  if (score >= 80) {
    return {
      ring: 'linear-gradient(135deg, #67e8f9 0%, #34d399 55%, #22c55e 100%)',
      glow: 'rgba(52, 211, 153, 0.30)',
      shadow: 'rgba(52, 211, 153, 0.26)',
      bar: 'linear-gradient(90deg, #67e8f9 0%, #34d399 58%, #22c55e 100%)',
    }
  }

  if (score >= 60) {
    return {
      ring: 'linear-gradient(135deg, #7dd3fc 0%, #a78bfa 55%, #818cf8 100%)',
      glow: 'rgba(96, 165, 250, 0.28)',
      shadow: 'rgba(96, 165, 250, 0.24)',
      bar: 'linear-gradient(90deg, #7dd3fc 0%, #818cf8 55%, #a78bfa 100%)',
    }
  }

  return {
    ring: 'linear-gradient(135deg, #fda4af 0%, #fb7185 50%, #f59e0b 100%)',
    glow: 'rgba(244, 114, 182, 0.26)',
    shadow: 'rgba(244, 114, 182, 0.22)',
    bar: 'linear-gradient(90deg, #fb7185 0%, #f59e0b 100%)',
  }
}

function MatchOrb({
  value,
  size = 'md',
  showMeta = false,
}: {
  value?: string
  size?: 'sm' | 'md' | 'lg'
  showMeta?: boolean
}) {
  const score = normalizeMatchScore(value)
  const tone = getScoreTone(score)

  return (
    <div className={`match-orb match-orb-${size}`}>
      <div
        className="match-orb-shell"
        style={
          {
            '--score': score,
            '--ring-gradient': tone.ring,
            '--glow-color': tone.glow,
            '--shadow-color': tone.shadow,
          } as React.CSSProperties
        }
      >
        <div className="match-orb-glow" />
        <div className="match-orb-ring" />
        <div className="match-orb-core">
          <div className="match-orb-value">
            {score}
            <span>%</span>
          </div>
          {showMeta && <div className="match-orb-meta">overall match</div>}
        </div>
      </div>
    </div>
  )
}

function LoadingExperience({ step }: { step: string }) {
  return (
    <div className="loading-card" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-visual" aria-hidden="true">
        <div className="ring ring-a" />
        <div className="ring ring-b" />
        <div className="ring ring-c" />
        <div className="core-orb" />
      </div>

      <div className="loading-copy">
        <div className="loading-title">HireMind is building your match report</div>
        <div className="loading-subtitle">{step}</div>
      </div>

      <div className="loading-steps">
        {loadingMessages.map((message) => (
          <div className="step-pill" key={message}>
            {message}
          </div>
        ))}
      </div>

      <div className="skeleton-stack" aria-hidden="true">
        <div className="skeleton-line medium" />
        <div className="skeleton-line long" />
        <div className="skeleton-line long" />
        <div className="skeleton-line short" />
        <div className="skeleton-row">
          <div className="skeleton-chip" />
          <div className="skeleton-chip" />
          <div className="skeleton-chip" />
        </div>
        <div className="skeleton-block" />
        <div className="skeleton-block" />
      </div>
    </div>
  )
}

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [documentId, setDocumentId] = useState<number | null>(null)
  const [cvText, setCvText] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStepIndex, setLoadingStepIndex] = useState(0)

  const currentLoadingStep = useMemo(
    () => loadingMessages[loadingStepIndex % loadingMessages.length],
    [loadingStepIndex]
  )

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analysis/history`)
      if (!res.ok) {
        throw new Error('Failed to load history')
      }

      const data = await res.json()
      setHistory(data)

      if (data.length > 0 && !selectedHistoryItem) {
        setSelectedHistoryItem(data[0])
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    if (!loading) return

    const interval = setInterval(() => {
      setLoadingStepIndex((prev) => prev + 1)
    }, 1800)

    return () => clearInterval(interval)
  }, [loading])

  const handleFileSelection = (file: File | null) => {
    if (!file) return

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.')
      return
    }

    setError('')
    setSelectedFile(file)
    setDocumentId(null)
    setCvText('')
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0] || null
    handleFileSelection(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const uploadCvIfNeeded = async (): Promise<number> => {
    if (documentId) {
      return documentId
    }

    if (!selectedFile) {
      throw new Error('Select a PDF first.')
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    const res = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Upload failed')
    }

    const data = await res.json()
    setDocumentId(data.id)
    setCvText(data.text || '')
    return data.id
  }

  const runAnalysis = async () => {
    if (!selectedFile && !documentId) {
      setError('Select a CV PDF first.')
      return
    }

    if (!jobDescription.trim()) {
      setError('Paste a job description first.')
      return
    }

    setLoading(true)
    setLoadingStepIndex(0)
    setError('')
    setResult(null)

    try {
      const resolvedDocumentId = await uploadCvIfNeeded()

      const res = await fetch(`${API_BASE_URL}/api/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: resolvedDocumentId,
          job_title: jobTitle,
          company,
          job_description: jobDescription,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Request failed')
      }

      const data = await res.json()
      setResult(data)
      await loadHistory()
    } catch (err) {
      console.error(err)
      setError('Analysis failed. Check backend logs and response format.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <section className="interactive-home-hero">
        <InteractiveHeroCanvas />
        <div className="interactive-hero-overlay" />

        <nav className="top-nav">
          <div className="top-nav-inner">
            <a href="#" className="nav-brand" aria-label="HireMind home">
              <div className="nav-logo" aria-hidden="true">
                <div className="nav-logo-core">
                  <span className="nav-logo-bar left" />
                  <span className="nav-logo-bar bridge" />
                  <span className="nav-logo-bar right" />
                </div>
                <div className="nav-logo-glow" />
              </div>

              <div className="nav-brand-copy">
                <div className="nav-brand-name">HireMind</div>
                <div className="nav-brand-tagline">AI resume intelligence</div>
              </div>
            </a>

            <div className="nav-links">
              <a href="#how-it-works" className="nav-link">How it works</a>
              <a href="#reports" className="nav-link">Reports</a>
            </div>

            <div className="nav-actions">
              <a href="#run-analysis" className="nav-cta">Start analysis</a>
            </div>
          </div>
        </nav>

        <div className="interactive-hero-content">
          <h1 className="interactive-hero-title">
            Position your
            <span className="hero-title-gradient"> profile with clarity</span>
          </h1>

          <p className="interactive-hero-subtitle">
            Compare your resume against a target role and generate a structured report
            on fit, gaps, and stronger positioning.
          </p>

          <div className="hero-stats">
            <div className="stat-pill">Role fit</div>
            <div className="stat-pill">Gap visibility</div>
            <div className="stat-pill">Rewrite guidance</div>
          </div>
        </div>
      </section>

      <section className="form-section" id="run-analysis">
        <div className="panel premium-panel form-panel-centered">
          <div className="panel-header">
            <h2 className="section-title">Run a new analysis</h2>
            <p className="section-subtitle">
              Add your resume and the target role to generate a structured match report.
            </p>
          </div>

          <div
            className={`dropzone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            role="button"
            aria-label="Upload resume PDF"
            tabIndex={0}
          >
            <input
              ref={fileInputRef}
              id="resume-file"
              type="file"
              accept="application/pdf"
              className="hidden-file-input"
              onChange={(e) => handleFileSelection(e.target.files?.[0] || null)}
            />

            {!selectedFile && (
              <div className="dropzone-inner">
                <div className="dropzone-3d-stack" aria-hidden="true">
                  <div className="sheet sheet-back" />
                  <div className="sheet sheet-mid" />
                  <div className="sheet sheet-front">
                    <div className="sheet-lines" />
                  </div>
                </div>

                <div className="dropzone-copy">
                  <div className="dropzone-title">Drop your resume here</div>
                  <div className="dropzone-subtitle">PDF only · or click to browse</div>
                </div>
              </div>
            )}

            {selectedFile && (
              <div className="dropzone-inner uploaded-state">
                <div className="uploaded-3d-badge" aria-hidden="true">
                  <div className="uploaded-orb" />
                  <div className="uploaded-card">
                    <div className="uploaded-check">✓</div>
                    <div className="uploaded-lines" />
                  </div>
                  <div className="uploaded-glow" />
                </div>

                <div className="dropzone-copy">
                  <div className="dropzone-title">Resume uploaded</div>
                  <div className="dropzone-subtitle">
                    Your CV is ready for analysis. Click below to generate the match report.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-fields">
            <div className="field-group">
              <label htmlFor="job-title" className="field-label">Target role</label>
              <input
                id="job-title"
                type="text"
                placeholder="e.g. Machine Learning Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label htmlFor="company" className="field-label">Company</label>
              <input
                id="company"
                type="text"
                placeholder="e.g. Revolut"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label htmlFor="job-description" className="field-label">Job description</label>
              <textarea
                id="job-description"
                rows={10}
                placeholder="Paste the full job description here."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="action-row centered-action-row">
            <button
              className="primary-button"
              onClick={runAnalysis}
              disabled={loading || (!selectedFile && !documentId) || !jobDescription.trim()}
            >
              {loading ? 'Generating report...' : 'Generate match report'}
            </button>
          </div>
        </div>
      </section>

      <section className="how-it-works-section" id="how-it-works">
        <div className="how-it-works-shell">
          <div className="panel-header how-it-works-header">
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle">
              A simple flow to understand how your profile maps to a specific role.
            </p>
          </div>

          <div className="how-grid">
            <div className="how-card">
              <div className="how-step-number">01</div>
              <h3 className="how-card-title">Upload your resume</h3>
              <p className="how-card-text">
                Start with your current CV in PDF format and prepare it for analysis.
              </p>
            </div>

            <div className="how-card">
              <div className="how-step-number">02</div>
              <h3 className="how-card-title">Add the target role</h3>
              <p className="how-card-text">
                Paste the job description and define the role you want to benchmark against.
              </p>
            </div>

            <div className="how-card">
              <div className="how-step-number">03</div>
              <h3 className="how-card-title">Review the report</h3>
              <p className="how-card-text">
                Explore strengths, missing signals, potential gaps, and rewrite opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="content-shell" id="reports">
        <div className="side-column">
          {error && <div className="error-box">{error}</div>}
          {loading && <LoadingExperience step={currentLoadingStep} />}

          {!loading && result && (
            <div className="result-card">
              <div className="panel-header">
                <h2 className="section-title">Latest report</h2>
                <p className="section-subtitle">
                  A structured view of how the profile aligns with the selected role.
                </p>
              </div>

              <div className="report-score-hero">
                <MatchOrb value={result.overall_match} size="lg" />

                <div className="report-score-copy">
                  <div className="report-score-eyebrow">Overall match</div>
                  <div className="report-score-text">{result.overall_match}</div>
                  <p className="report-score-description">
                    A visual summary of how closely the current profile aligns with the selected role.
                  </p>
                </div>
              </div>

              <div className="grid">
                <div className="info-block">
                  <h4>Strong matches</h4>
                  <ul className="clean-list">
                    {result.strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="info-block">
                  <h4>Signals not clearly shown</h4>
                  <ul className="clean-list">
                    {result.not_explicitly_shown.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="info-block">
                  <h4>Potential gaps</h4>
                  <ul className="clean-list">
                    {result.missing_or_weak_areas.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="info-block">
                  <h4>Rewrite suggestions</h4>
                  <ul className="clean-list">
                    {result.cv_rewrite_suggestions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="two-col" style={{ marginTop: 18 }}>
          <div className="panel premium-panel">
            <div className="panel-header">
              <h2 className="section-title">Previous analyses</h2>
              <p className="section-subtitle">
                Reopen past reports and compare how different roles map to the same profile.
              </p>
            </div>

            <div className="history-list">
              {history.length === 0 && (
                <div className="history-card">No reports yet.</div>
              )}

              {history.map((item) => {
                const isSelected = selectedHistoryItem?.analysis_id === item.analysis_id

                return (
                  <div
                    key={item.analysis_id}
                    onClick={() => setSelectedHistoryItem(item)}
                    className={`history-card ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="history-card-head">
                      <div className="history-card-main">
                        <div className="history-role-line">
                          <strong>{item.job_title || 'Untitled role'}</strong>
                        </div>
                        <div className="history-company-line">
                          {item.company || 'Unknown company'}
                        </div>
                      </div>

                      <div className="history-score-wrap">
                        <MatchOrb value={item.result?.overall_match} size="sm" />
                      </div>
                    </div>

                    <div className="history-meta-row">
                      <span className="history-meta-pill">CV · {item.filename}</span>
                      <span className="history-meta-pill">#{item.analysis_id}</span>
                    </div>

                    {!!item.result?.strengths?.length && (
                      <div className="history-chip-row">
                        {item.result.strengths.slice(0, 3).map((strength) => (
                          <span key={strength} className="history-chip">
                            {strength}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="history-preview">
                      {item.job_description
                        ?.replace(/Top strengths:\s*.*$/gim, '')
                        ?.replace(/Signals not clearly shown:\s*.*$/gim, '')
                        ?.replace(/Potential gaps:\s*.*$/gim, '')
                        ?.replace(/Rewrite suggestions:\s*.*$/gim, '')
                        ?.replace(/\s+/g, ' ')
                        ?.trim()}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="detail-card">
            <div className="panel-header">
              <h2 className="section-title">Report details</h2>
              <p className="section-subtitle">Review the full output for the selected analysis.</p>
            </div>

            {!selectedHistoryItem && (
              <div className="muted">Select an analysis from history.</div>
            )}

            {selectedHistoryItem && (
              <div className="report-detail-grid" aria-live="polite" aria-busy="false">
                <div className="report-identity-card detail-full-span">
                  <div>
                    <div className="report-kicker">Selected role</div>
                    <div className="report-role-title">
                      <strong>{selectedHistoryItem.job_title}</strong> — {selectedHistoryItem.company || 'Unknown company'}
                    </div>
                  </div>

                  <div className="report-meta-row">
                    <span className="history-meta-pill">CV · {selectedHistoryItem.filename}</span>
                    <span className="history-meta-pill">Analysis #{selectedHistoryItem.analysis_id}</span>
                  </div>
                </div>

                <div className="detail-score-block detail-full-span">
                  <div className="detail-score-head">
                    <div>
                      <h3>Overall match</h3>
                    </div>
                    <div className="detail-score-percent">
                      {normalizeMatchScore(selectedHistoryItem.result?.overall_match)}%
                    </div>
                  </div>

                  <div className="detail-score-main">
                    <div className="detail-score-visual">
                      <MatchOrb value={selectedHistoryItem.result?.overall_match} size="md" />
                    </div>

                    <div className="detail-score-side">
                      <div className="detail-score-kpi">
                        <span>Profile alignment</span>
                        <strong>{normalizeMatchScore(selectedHistoryItem.result?.overall_match)}%</strong>
                      </div>

                      <div
                        className="fit-progress"
                        style={
                          {
                            '--fit-score': normalizeMatchScore(selectedHistoryItem.result?.overall_match),
                            '--fit-bar': getScoreTone(
                              normalizeMatchScore(selectedHistoryItem.result?.overall_match)
                            ).bar,
                          } as React.CSSProperties
                        }
                      >
                        <div className="fit-progress-track">
                          <div className="fit-progress-fill" />
                        </div>
                      </div>

                      <p className="detail-score-description">
                        Aligned with the core signals of this role.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="detail-section-card">
                  <div className="detail-section-head">
                    <h3>Strong matches</h3>
                    <span className="detail-count-pill">
                      {selectedHistoryItem.result?.strengths?.length || 0}
                    </span>
                  </div>
                  <ul className="clean-list">
                    {selectedHistoryItem.result?.strengths?.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="detail-section-card">
                  <div className="detail-section-head">
                    <h3>Signals not clearly shown</h3>
                    <span className="detail-count-pill">
                      {selectedHistoryItem.result?.not_explicitly_shown?.length || 0}
                    </span>
                  </div>
                  <ul className="clean-list">
                    {selectedHistoryItem.result?.not_explicitly_shown?.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="detail-section-card">
                  <div className="detail-section-head">
                    <h3>Potential gaps</h3>
                    <span className="detail-count-pill">
                      {selectedHistoryItem.result?.missing_or_weak_areas?.length || 0}
                    </span>
                  </div>
                  <ul className="clean-list">
                    {selectedHistoryItem.result?.missing_or_weak_areas?.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="detail-section-card">
                  <div className="detail-section-head">
                    <h3>Rewrite suggestions</h3>
                    <span className="detail-count-pill">
                      {selectedHistoryItem.result?.cv_rewrite_suggestions?.length || 0}
                    </span>
                  </div>
                  <ul className="clean-list">
                    {selectedHistoryItem.result?.cv_rewrite_suggestions?.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="detail-section-card detail-full-span">
                  <div className="detail-section-head">
                    <h3>Role snapshot</h3>
                  </div>
                  <p className="long-text detail-job-description">
                    {selectedHistoryItem.job_description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}