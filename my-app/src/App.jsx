import { useMemo, useState } from 'react'
import './App.css'

const VISIBLE_RANGE = { min: 380, max: 780 }
const X_TICKS = [380, 420, 460, 500, 540, 580, 620, 660, 700, 740, 780]
const DEFAULT_DATASET = `410 0.08
430 0.12
450 0.2
470 0.42
490 0.58
510 0.76
530 0.92
550 0.78
570 0.54
590 0.32
610 0.22
630 0.18
650 0.16`

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function wavelengthToRGB(wavelength, intensity = 1) {
  if (Number.isNaN(wavelength) || wavelength < VISIBLE_RANGE.min || wavelength > VISIBLE_RANGE.max) {
    return { r: 0, g: 0, b: 0, alpha: 0 }
  }

  let red = 0
  let green = 0
  let blue = 0

  if (wavelength < 440) {
    red = -(wavelength - 440) / (440 - 380)
    blue = 1
  } else if (wavelength < 490) {
    green = (wavelength - 440) / (490 - 440)
    blue = 1
  } else if (wavelength < 510) {
    green = 1
    blue = -(wavelength - 510) / (510 - 490)
  } else if (wavelength < 580) {
    red = (wavelength - 510) / (580 - 510)
    green = 1
  } else if (wavelength < 645) {
    red = 1
    green = -(wavelength - 645) / (645 - 580)
  } else {
    red = 1
  }

  let visibilityFactor = 1
  if (wavelength < 420) {
    visibilityFactor = 0.3 + (0.7 * (wavelength - 380)) / (420 - 380)
  } else if (wavelength > 700) {
    visibilityFactor = 0.3 + (0.7 * (VISIBLE_RANGE.max - wavelength)) / (VISIBLE_RANGE.max - 700)
  }

  const intensityFactor = visibilityFactor * clamp(intensity, 0, 1)
  const normalise = (value) => Math.round(255 * value * intensityFactor)

  return {
    r: normalise(red),
    g: normalise(green),
    b: normalise(blue),
    alpha: Number(intensityFactor.toFixed(2)),
  }
}

function formatRGB({ r, g, b, alpha }) {
  if (typeof alpha === 'number') {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return `rgb(${r}, ${g}, ${b})`
}

function parseDataset(input) {
  const points = []
  const warnings = []

  input.split(/\n/).forEach((line, lineIndex) => {
    const trimmed = line.trim()
    if (!trimmed) {
      return
    }

    const numbers = trimmed
      .split(/[\s,]+/)
      .map((token) => Number.parseFloat(token))
      .filter((value) => !Number.isNaN(value))

    if (numbers.length < 2) {
      warnings.push(`Line ${lineIndex + 1}: enter both wavelength and intensity values.`)
      return
    }

    const [wavelength, intensity] = numbers
    if (wavelength < VISIBLE_RANGE.min || wavelength > VISIBLE_RANGE.max) {
      warnings.push(`Line ${lineIndex + 1}: ${wavelength.toFixed(1)} nm is outside the visible range.`)
      return
    }

    if (intensity < 0 || intensity > 1) {
      warnings.push(`Line ${lineIndex + 1}: intensity ${intensity.toFixed(2)} must be between 0 and 1.`)
      return
    }

    points.push({ wavelength, intensity })
  })

  points.sort((a, b) => a.wavelength - b.wavelength)
  return { points, warnings }
}

function detectPeaks(points) {
  if (points.length < 2) {
    return []
  }

  const peaks = []

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]
    const prev = points[index - 1]
    const next = points[index + 1]

    const isLeftHigher = !prev || current.intensity >= prev.intensity
    const isRightHigher = !next || current.intensity >= next.intensity
    const isStrictPeak =
      (prev && current.intensity > prev.intensity) ||
      (next && current.intensity > next.intensity)

    if (isLeftHigher && isRightHigher && (prev || next)) {
      if (!prev || !next || isStrictPeak) {
        peaks.push({ ...current, index })
      }
    }
  }

  return peaks.sort((a, b) => b.intensity - a.intensity)
}

function formatIntensity(value) {
  return value >= 0.995 ? '1.00' : value.toFixed(2)
}

function IntensityChart({ points, peaks }) {
  const width = 720
  const height = 360
  const padding = { top: 36, right: 32, bottom: 56, left: 72 }

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxIntensity = points.length > 0 ? Math.max(1, ...points.map((point) => point.intensity)) : 1

  const toX = (wavelength) =>
    padding.left + ((wavelength - VISIBLE_RANGE.min) / (VISIBLE_RANGE.max - VISIBLE_RANGE.min)) * chartWidth

  const toY = (intensity) => padding.top + chartHeight - (intensity / maxIntensity) * chartHeight

  const pathD = points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command}${toX(point.wavelength)},${toY(point.intensity)}`
    })
    .join(' ')

  const areaPath = points.length
    ? `${pathD} L${toX(points[points.length - 1].wavelength)},${padding.top + chartHeight} L${toX(points[0].wavelength)},${
        padding.top + chartHeight
      } Z`
    : ''

  const yTickCount = 4
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, tickIndex) =>
    Number.parseFloat(((maxIntensity / yTickCount) * tickIndex).toFixed(2))
  )

  return (
    <figure className="chart" aria-labelledby="chart-title">
      <figcaption id="chart-title" className="sr-only">
        Intensity spectrum plotted against wavelength in nanometres
      </figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Intensity versus wavelength"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="line-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="area-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect
          x={padding.left}
          y={padding.top}
          width={chartWidth}
          height={chartHeight}
          className="chart__surface"
        />

        <g className="chart__grid">
          {X_TICKS.map((tick) => (
            <line key={tick} x1={toX(tick)} x2={toX(tick)} y1={padding.top} y2={padding.top + chartHeight} />
          ))}
          {yTicks.map((tick) => (
            <line
              key={`y-${tick}`}
              x1={padding.left}
              x2={padding.left + chartWidth}
              y1={toY(tick)}
              y2={toY(tick)}
            />
          ))}
        </g>

        {points.length > 0 && (
          <>
            <path d={pathD} fill="none" stroke="url(#line-gradient)" strokeWidth={3} strokeLinejoin="round" />
            <path d={areaPath} fill="url(#area-gradient)" />
            <g className="chart__points">
              {points.map((point) => (
                <circle
                  key={`${point.wavelength}-${point.intensity}`}
                  cx={toX(point.wavelength)}
                  cy={toY(point.intensity)}
                  r={4}
                  className="chart__point"
                />
              ))}
            </g>
            <g className="chart__peaks">
              {peaks.map((peak) => (
                <g key={`peak-${peak.wavelength}-${peak.intensity}`} className="chart__peak">
                  <line
                    x1={toX(peak.wavelength)}
                    x2={toX(peak.wavelength)}
                    y1={toY(peak.intensity)}
                    y2={padding.top + chartHeight}
                  />
                  <circle cx={toX(peak.wavelength)} cy={toY(peak.intensity)} r={7} />
                  <text x={toX(peak.wavelength)} y={toY(peak.intensity) - 14}>
                    {`${peak.wavelength.toFixed(0)} nm`}
                  </text>
                </g>
              ))}
            </g>
          </>
        )}

        <g className="chart__axes">
          <line x1={padding.left} x2={padding.left + chartWidth} y1={padding.top + chartHeight} y2={padding.top + chartHeight} />
          <line x1={padding.left} x2={padding.left} y1={padding.top} y2={padding.top + chartHeight} />
        </g>

        <g className="chart__labels">
          {X_TICKS.map((tick) => (
            <text key={`tick-x-${tick}`} x={toX(tick)} y={padding.top + chartHeight + 28} className="chart__tick chart__tick--x">
              {tick}
            </text>
          ))}
          {yTicks.map((tick) => (
            <text key={`tick-y-${tick}`} x={padding.left - 16} y={toY(tick) + 4} className="chart__tick chart__tick--y">
              {tick.toFixed(2)}
            </text>
          ))}
          <text x={padding.left + chartWidth / 2} y={height - 12} className="chart__axis-label">
            Wavelength (nm)
          </text>
          <text
            className="chart__axis-label"
            transform={`translate(${24} ${padding.top + chartHeight / 2}) rotate(-90)`}
          >
            Intensity
          </text>
        </g>
      </svg>

      {points.length === 0 && (
        <p className="chart__empty" role="status">
          Add wavelength and intensity values to plot the spectrum.
        </p>
      )}
    </figure>
  )
}

function App() {
  const [dataset, setDataset] = useState(DEFAULT_DATASET)

  const { points, warnings } = useMemo(() => parseDataset(dataset), [dataset])
  const peaks = useMemo(() => detectPeaks(points).slice(0, 5), [points])

  const previewStyle = useMemo(() => {
    if (points.length === 0) {
      return {
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backgroundImage: 'radial-gradient(circle at top, rgba(56, 189, 248, 0.2), transparent 65%)',
      }
    }

    const gradientStops = points
      .map((point) => {
        const color = wavelengthToRGB(point.wavelength, point.intensity)
        const position = ((point.wavelength - VISIBLE_RANGE.min) / (VISIBLE_RANGE.max - VISIBLE_RANGE.min)) * 100
        return `${formatRGB(color)} ${position.toFixed(1)}%`
      })
      .join(', ')

    return {
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backgroundImage: `linear-gradient(90deg, ${gradientStops})`,
    }
  }, [points])

  return (
    <div className="app">
      <header className="app__header">
        <h1>RGB Spectrum Intensity Visualiser</h1>
        <p>
          Enter a dataset of wavelengths and relative intensity values to explore how the spectrum shifts across the
          visible range. Peaks highlight where an object emits or reflects the most light.
        </p>
      </header>

      <main className="visualiser">
        <section className="visualiser__inputs" aria-labelledby="dataset-label">
          <div className="inputs__header">
            <h2 id="dataset-label">Wavelength dataset</h2>
            <p>Provide wavelength (nm) and intensity pairs. One pair per line, separated by spaces or commas.</p>
          </div>
          <textarea
            className="dataset-input"
            value={dataset}
            onChange={(event) => setDataset(event.target.value)}
            rows={10}
            spellCheck="false"
            aria-describedby="dataset-hint"
          />
          <p id="dataset-hint" className="input-hint">
            Visible wavelengths run from 380&nbsp;nm to 780&nbsp;nm. Intensity values should be between 0 and 1.
          </p>
          {warnings.length > 0 && (
            <ul className="input-warnings" role="status">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          <div className="spectrum-preview" style={previewStyle} role="img" aria-label="RGB preview of the intensity spectrum" />
        </section>

        <section className="visualiser__chart">
          <h2>Intensity spectrum</h2>
          <IntensityChart points={points} peaks={peaks} />
        </section>

        <section className="visualiser__peaks">
          <h2>Detected intensity peaks</h2>
          {peaks.length > 0 ? (
            <ul className="peaks-list">
              {peaks.map((peak) => (
                <li key={`peak-list-${peak.wavelength}-${peak.intensity}`}>
                  <span className="peaks-list__wavelength">{peak.wavelength.toFixed(0)} nm</span>
                  <span className="peaks-list__intensity">{formatIntensity(peak.intensity)}</span>
                  <span className="peaks-list__label">relative intensity</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="peaks-empty">Add at least three points to detect peaks.</p>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
