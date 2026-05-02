import { useId, useMemo, useState } from 'react'
import './App.css'

const SPECTRA = [
  {
    id: 'chlorophyll-extract',
    name: 'Chlorophyll Extract',
    project: 'Leaf Pigment Stability Week 4',
    collectedOn: '2024-04-18',
    solvent: '90% acetone',
    temperature: '22 °C',
    instrument: 'Shimadzu UV-2600 UV-Vis',
    normalization: 'Absorbance normalized to 1 cm cuvette path length',
    summary:
      'Strong Soret band near 430 nm with a secondary Q-band at 662 nm indicating intact chlorophyll a with minor pheophytinization.',
    spectrum: [
      { wavelength: 390, intensity: 0.18 },
      { wavelength: 410, intensity: 0.36 },
      { wavelength: 430, intensity: 0.92 },
      { wavelength: 450, intensity: 0.58 },
      { wavelength: 470, intensity: 0.36 },
      { wavelength: 500, intensity: 0.42 },
      { wavelength: 550, intensity: 0.30 },
      { wavelength: 600, intensity: 0.54 },
      { wavelength: 630, intensity: 0.74 },
      { wavelength: 650, intensity: 0.82 },
      { wavelength: 662, intensity: 0.87 },
      { wavelength: 680, intensity: 0.78 },
      { wavelength: 700, intensity: 0.46 },
    ],
    peaks: [
      { wavelength: 430, intensity: 0.92, assignment: 'Soret transition (π→π*)' },
      { wavelength: 662, intensity: 0.87, assignment: 'Qy transition, chlorophyll a' },
    ],
    quality: 'High',
  },
  {
    id: 'anthocyanin',
    name: 'Anthocyanin Fraction',
    project: 'Berry Pigment Profiling',
    collectedOn: '2024-04-22',
    solvent: 'Methanol + 0.1% HCl',
    temperature: '20 °C',
    instrument: 'Thermo Scientific Evolution 350',
    normalization: 'Baseline corrected to blank solvent at 540 nm',
    summary:
      'Dominant λmax at 526 nm consistent with cyanidin-based anthocyanins. Subtle shoulder in the blue region indicates co-pigmentation.',
    spectrum: [
      { wavelength: 380, intensity: 0.12 },
      { wavelength: 400, intensity: 0.21 },
      { wavelength: 430, intensity: 0.35 },
      { wavelength: 460, intensity: 0.48 },
      { wavelength: 490, intensity: 0.64 },
      { wavelength: 510, intensity: 0.82 },
      { wavelength: 526, intensity: 0.95 },
      { wavelength: 540, intensity: 0.88 },
      { wavelength: 560, intensity: 0.74 },
      { wavelength: 600, intensity: 0.46 },
      { wavelength: 640, intensity: 0.28 },
      { wavelength: 680, intensity: 0.16 },
    ],
    peaks: [
      { wavelength: 526, intensity: 0.95, assignment: 'π→π* transition, cyanidin derivatives' },
      { wavelength: 460, intensity: 0.48, assignment: 'Blue co-pigmentation shoulder' },
    ],
    quality: 'Research grade',
  },
  {
    id: 'protein-aromatic',
    name: 'Protein Aromatic Residues',
    project: 'Protein Folding Monitoring',
    collectedOn: '2024-04-26',
    solvent: 'Phosphate buffer pH 7.4',
    temperature: '25 °C',
    instrument: 'Jasco J-815 CD with absorption detector',
    normalization: 'Absorbance scaled to molar extinction at 280 nm',
    summary:
      'Tryptophan band centered near 280 nm with phenylalanine shoulder around 258 nm. No scattering artifacts observed.',
    spectrum: [
      { wavelength: 240, intensity: 0.20 },
      { wavelength: 250, intensity: 0.32 },
      { wavelength: 258, intensity: 0.44 },
      { wavelength: 265, intensity: 0.52 },
      { wavelength: 275, intensity: 0.68 },
      { wavelength: 280, intensity: 0.94 },
      { wavelength: 290, intensity: 0.88 },
      { wavelength: 300, intensity: 0.64 },
      { wavelength: 310, intensity: 0.42 },
      { wavelength: 320, intensity: 0.30 },
    ],
    peaks: [
      { wavelength: 280, intensity: 0.94, assignment: 'Tryptophan π→π*' },
      { wavelength: 258, intensity: 0.44, assignment: 'Phenylalanine ring transition' },
    ],
    quality: 'Pass',
  },
]

const xTicks = [
  240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440, 460, 480, 500, 520, 540, 560, 580, 600,
  620, 640, 660, 680, 700
]

function SpectralChart({ spectrum, peaks, title }) {
  const width = 640
  const height = 280
  const padding = { top: 20, right: 20, bottom: 40, left: 48 }
  const titleId = useId()

  const minWavelength = Math.min(...spectrum.map((point) => point.wavelength))
  const maxWavelength = Math.max(...spectrum.map((point) => point.wavelength))
  const maxIntensity = Math.max(...spectrum.map((point) => point.intensity))

  const toX = (wavelength) => {
    return (
      padding.left +
      ((wavelength - minWavelength) / (maxWavelength - minWavelength)) *
        (width - padding.left - padding.right)
    )
  }

  const toY = (intensity) => {
    return (
      height -
      padding.bottom -
      (intensity / maxIntensity) * (height - padding.top - padding.bottom)
    )
  }

  const pathD = spectrum
    .map((point, index) => {
      const prefix = index === 0 ? 'M' : 'L'
      return `${prefix}${toX(point.wavelength)},${toY(point.intensity)}`
    })
    .join(' ')

  const areaPath = `${pathD} L${toX(spectrum[spectrum.length - 1].wavelength)},${
    height - padding.bottom
  } L${toX(spectrum[0].wavelength)},${height - padding.bottom} Z`

  return (
    <figure className="spectral-chart" aria-labelledby={titleId}>
      <figcaption id={titleId} className="sr-only">
        {title}
      </figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${title}. Peak intensity ${maxIntensity.toFixed(2)} absorbance units.`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="spectrum-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="fill-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="grid-bg">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.3" />
          </radialGradient>
        </defs>
        <rect
          x={padding.left}
          y={padding.top}
          width={width - padding.left - padding.right}
          height={height - padding.top - padding.bottom}
          fill="url(#grid-bg)"
          className="chart-surface"
        />
        <g className="grid">
          {xTicks
            .filter((tick) => tick > minWavelength && tick < maxWavelength)
            .map((tick) => (
              <line
                key={tick}
                x1={toX(tick)}
                x2={toX(tick)}
                y1={padding.top}
                y2={height - padding.bottom}
              />
            ))}
          {[0.25, 0.5, 0.75, 1].map((fraction) => (
            <line
              key={fraction}
              x1={padding.left}
              x2={width - padding.right}
              y1={toY(maxIntensity * fraction)}
              y2={toY(maxIntensity * fraction)}
            />
          ))}
        </g>
        <path d={pathD} stroke="url(#spectrum-gradient)" fill="none" strokeWidth={3} />
        <path d={areaPath} fill="url(#fill-gradient)" opacity={0.2} />
        <g className="axes">
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={height - padding.bottom}
            y2={height - padding.bottom}
          />
          <line x1={padding.left} x2={padding.left} y1={padding.top} y2={height - padding.bottom} />
        </g>
        <g className="tick-labels">
          {xTicks
            .filter((tick) => tick >= minWavelength && tick <= maxWavelength)
            .map((tick) => (
              <text
                key={tick}
                x={toX(tick)}
                y={height - padding.bottom + 24}
                className="tick-label tick-label-x"
                textAnchor="middle"
              >
                {tick}
              </text>
            ))}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <text
              key={fraction}
              x={padding.left - 18}
              y={toY(maxIntensity * fraction) + 4}
              className="tick-label tick-label-y"
              textAnchor="end"
            >
              {(maxIntensity * fraction).toFixed(2)}
            </text>
          ))}
        </g>
        <g className="peaks">
          {peaks.map((peak) => (
            <g key={peak.wavelength}>
              <line
                x1={toX(peak.wavelength)}
                x2={toX(peak.wavelength)}
                y1={toY(peak.intensity)}
                y2={height - padding.bottom}
                className="peak-marker"
              />
              <circle
                cx={toX(peak.wavelength)}
                cy={toY(peak.intensity)}
                r={6}
                className="peak-dot"
              />
              <text
                x={toX(peak.wavelength)}
                y={toY(peak.intensity) - 12}
                className="peak-label"
              >
                {peak.wavelength} nm
              </text>
            </g>
          ))}
        </g>
        <text
          x={(padding.left + width - padding.right) / 2}
          y={height - 4}
          className="axis-label"
          textAnchor="middle"
        >
          Wavelength (nm)
        </text>
        <text
          className="axis-label"
          textAnchor="middle"
          transform={`translate(18 ${(padding.top + height - padding.bottom) / 2}) rotate(-90)`}
        >
          Intensity (a.u.)
        </text>
      </svg>
    </figure>
  )
}

function formatRange(spectrum) {
  const minWavelength = Math.min(...spectrum.map((point) => point.wavelength))
  const maxWavelength = Math.max(...spectrum.map((point) => point.wavelength))
  return `${minWavelength}-${maxWavelength} nm`
}

function dominantPeak(sample) {
  return sample.peaks.reduce((highest, peak) => {
    if (!highest || peak.intensity > highest.intensity) {
      return peak
    }
    return highest
  }, null)
}

function App() {
  const [selectedSampleId, setSelectedSampleId] = useState(SPECTRA[0].id)

  const selectedSample = useMemo(
    () => SPECTRA.find((sample) => sample.id === selectedSampleId) ?? SPECTRA[0],
    [selectedSampleId]
  )

  return (
    <div className="dashboard">
      <header className="header">
        <div>
          <p className="badge">Spectroscopy Lab Notebook</p>
          <h1>Spectral Results Overview</h1>
          <p className="lede">
            Explore recent absorbance scans captured across our pigment and protein studies. Select a
            sample to review its spectral fingerprints, annotated peaks, and acquisition metadata.
          </p>
        </div>
        <div className="selector">
          <label htmlFor="sample-selector">Sample</label>
          <select
            id="sample-selector"
            value={selectedSampleId}
            onChange={(event) => setSelectedSampleId(event.target.value)}
          >
            {SPECTRA.map((sample) => (
              <option key={sample.id} value={sample.id}>
                {sample.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="content">
        <section className="panel panel-chart">
          <div className="panel-header">
            <h2>{selectedSample.name}</h2>
            <div className="metadata">
              <span>{selectedSample.project}</span>
              <span>Collected {selectedSample.collectedOn}</span>
              <span>{selectedSample.instrument}</span>
            </div>
          </div>
          <p className="panel-summary">{selectedSample.summary}</p>
          <SpectralChart
            spectrum={selectedSample.spectrum}
            peaks={selectedSample.peaks}
            title={`${selectedSample.name} absorbance spectrum`}
          />
        </section>

        <section className="panel panel-details">
          <h3>Acquisition Details</h3>
          <dl className="details-grid">
            <div>
              <dt>Solvent</dt>
              <dd>{selectedSample.solvent}</dd>
            </div>
            <div>
              <dt>Temperature</dt>
              <dd>{selectedSample.temperature}</dd>
            </div>
            <div>
              <dt>Normalization</dt>
              <dd>{selectedSample.normalization}</dd>
            </div>
            <div>
              <dt>Quality Check</dt>
              <dd className={`quality quality-${selectedSample.quality.toLowerCase().replace(/\s+/g, '-')}`}>
                {selectedSample.quality}
              </dd>
            </div>
          </dl>

          <div className="peak-highlights">
            <h4>Annotated Peaks</h4>
            <ul>
              {selectedSample.peaks.map((peak) => (
                <li key={peak.wavelength}>
                  <span className="peak-wavelength">{peak.wavelength} nm</span>
                  <span className="peak-intensity">{peak.intensity.toFixed(2)} a.u.</span>
                  <p>{peak.assignment}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel panel-table">
          <h3>Sample Comparison</h3>
          <table>
            <thead>
              <tr>
                <th scope="col">Sample</th>
                <th scope="col">λ Range</th>
                <th scope="col">Dominant Peak</th>
                <th scope="col">Peak Intensity</th>
                <th scope="col">Quality</th>
              </tr>
            </thead>
            <tbody>
              {SPECTRA.map((sample) => {
                const peak = dominantPeak(sample)
                return (
                  <tr key={sample.id} className={sample.id === selectedSample.id ? 'active' : ''}>
                    <th scope="row">{sample.name}</th>
                    <td>{formatRange(sample.spectrum)}</td>
                    <td>{peak ? `${peak.wavelength} nm` : '—'}</td>
                    <td>{peak ? peak.intensity.toFixed(2) : '—'} a.u.</td>
                    <td>{sample.quality}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  )
}

export default App
