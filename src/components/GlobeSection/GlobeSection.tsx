import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import { numericToAlpha3 } from 'i18n-iso-countries'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { TrackballControls } from 'three/addons/controls/TrackballControls.js'
import ThreeGlobe from 'three-globe'

import styles from './GlobeSection.module.css'
import { TRAVEL_DATA, UN_RECOGNIZED_COUNTRIES, type TravelCountry } from './travelData'

const WORLD_ATLAS_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const COL = {
  visited: '#444441',
  unvisited: '#d3d1c7',
  hover: '#888780',
  selected: '#5f5e5a',
} as const

export type HexCountry = {
  iso: string
  label: string
  visited: boolean
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
}

function isoFromWorldId(id: string | number | undefined): string | undefined {
  if (id === undefined || id === null) return undefined
  const code = String(id)
  try {
    const a3 = numericToAlpha3(code)
    return a3 || undefined
  } catch {
    return undefined
  }
}

function buildHexFeatures(topology: Topology): HexCountry[] {
  const countries = topology.objects.countries as GeometryCollection & {
    type: 'GeometryCollection'
  }
  const fc = feature(topology, countries) as GeoJSON.FeatureCollection
  const out: HexCountry[] = []
  for (const f of fc.features) {
    const iso = isoFromWorldId(f.id as string | number | undefined)
    if (!iso || !f.geometry) continue
    const travel = TRAVEL_DATA[iso]
    const label =
      travel?.label ??
      (typeof f.properties?.name === 'string'
        ? (f.properties.name as string).toLowerCase()
        : iso.toLowerCase())
    const visited = Boolean(travel?.visited)
    if (f.geometry.type !== 'Polygon' && f.geometry.type !== 'MultiPolygon') continue
    out.push({
      iso,
      label,
      visited,
      geometry: f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
    })
  }
  return out
}

function colorForHex(
  d: HexCountry,
  hoveredIso: string | null,
  selectedIso: string | null,
): string {
  if (selectedIso && d.iso === selectedIso) return COL.selected
  if (hoveredIso && d.iso === hoveredIso) return COL.hover
  return d.visited ? COL.visited : COL.unvisited
}

function visitedCountryCount(): number {
  return Object.values(TRAVEL_DATA).filter((c) => c.visited).length
}

function worldVisitedPercent(): number {
  return Math.round((visitedCountryCount() / UN_RECOGNIZED_COUNTRIES) * 100)
}

function countryVisitedPercent(entry: TravelCountry): number {
  if (!entry.totalPlaces) return 0
  return Math.round((entry.visitedPlaces / entry.totalPlaces) * 100)
}

function readPageBackgroundRgb(): THREE.Color {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-background-primary')
    .trim()
  if (raw) return new THREE.Color(raw)
  return new THREE.Color(0xffffff)
}

function GlobeSection() {
  const globePaneRef = useRef<HTMLDivElement>(null)
  const canvasHostRef = useRef<HTMLDivElement>(null)

  const globeRef = useRef<InstanceType<typeof ThreeGlobe> | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<TrackballControls | null>(null)
  const rafRef = useRef(0)
  const clockRef = useRef(new THREE.Clock())
  const featuresRef = useRef<HexCountry[]>([])

  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  )
  const [selection, setSelection] = useState<{ iso: string; label: string } | null>(
    null,
  )
  const [hoveredIso, setHoveredIso] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(
    null,
  )
  const hoverPauseRef = useRef(false)

  const applyHexColors = useCallback(
    (
      globe: InstanceType<typeof ThreeGlobe>,
      list: HexCountry[],
      h: string | null,
      s: string | null,
    ) => {
      globe.hexPolygonColor((d: object) => colorForHex(d as HexCountry, h, s))
      globe.hexPolygonsData([...list])
    },
    [],
  )

  useEffect(() => {
    if (loadState !== 'ready' || !globeRef.current) return
    applyHexColors(globeRef.current, featuresRef.current, hoveredIso, selection?.iso ?? null)
  }, [hoveredIso, selection?.iso, loadState, applyHexColors])

  useEffect(() => {
    const el = canvasHostRef.current
    const pane = globePaneRef.current
    if (!el || !pane) return
    const hostPane = pane

    let disposed = false
    setLoadState('loading')

    const scene = new THREE.Scene()
    scene.background = null
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000)
    camera.position.set(0, 0, 280)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    rendererRef.current = renderer
    el.appendChild(renderer.domElement)

    const globe = new ThreeGlobe({ waitForGlobeReady: true, animateIn: false })
      .showGlobe(false)
      .showGraticules(false)
      .showAtmosphere(false)
      .hexPolygonsData([])
      .hexPolygonGeoJsonGeometry('geometry')
      .hexPolygonAltitude(0.001)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.32)
      .hexPolygonUseDots(true)
      .hexPolygonDotResolution(14)
      .hexPolygonCurvatureResolution(4)
      .hexPolygonsTransitionDuration(0)

    globeRef.current = globe
    scene.add(globe)

    const ambient = new THREE.AmbientLight(0xffffff, Math.PI)
    scene.add(ambient)

    const controls = new TrackballControls(camera, renderer.domElement)
    controls.rotateSpeed = 3.2
    controls.zoomSpeed = 0.65
    controls.panSpeed = 0.4
    controls.staticMoving = true
    controls.minDistance = 115
    controls.maxDistance = 520
    controlsRef.current = controls

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    function getHexFromIntersect(obj: THREE.Object3D | null): HexCountry | null {
      let cur: THREE.Object3D | null = obj
      while (cur) {
        const data = (cur as unknown as { __data?: HexCountry }).__data
        if (data?.iso) return data
        cur = cur.parent
      }
      return null
    }

    function setPointerFromEvent(ev: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
    }

    function onPointerMove(ev: PointerEvent) {
      if (!cameraRef.current) return
      setPointerFromEvent(ev)
      raycaster.setFromCamera(pointer, cameraRef.current)
      const hits = raycaster.intersectObjects(scene.children, true)
      const first = hits.find((h) => getHexFromIntersect(h.object))
      const data = first ? getHexFromIntersect(first.object) : null
      const nextIso = data?.iso ?? null
      setHoveredIso((prev) => (prev === nextIso ? prev : nextIso))
      if (data && nextIso) {
        const rect = hostPane.getBoundingClientRect()
        setTooltip({
          text: data.label,
          x: ev.clientX - rect.left + 12,
          y: ev.clientY - rect.top + 12,
        })
      } else {
        setTooltip(null)
      }
    }

    function onPointerLeave() {
      hoverPauseRef.current = false
      setHoveredIso(null)
      setTooltip(null)
    }

    function onPointerOver() {
      hoverPauseRef.current = true
    }

    function onPointerDown(ev: PointerEvent) {
      if (!cameraRef.current) return
      setPointerFromEvent(ev)
      raycaster.setFromCamera(pointer, cameraRef.current)
      const hits = raycaster.intersectObjects(scene.children, true)
      const first = hits.find((h) => getHexFromIntersect(h.object))
      const data = first ? getHexFromIntersect(first.object) : null
      if (data?.iso) setSelection({ iso: data.iso, label: data.label })
    }

    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerleave', onPointerLeave)
    renderer.domElement.addEventListener('pointerover', onPointerOver)
    renderer.domElement.addEventListener('pointerdown', onPointerDown)

    function resize() {
      const w = hostPane.clientWidth || 1
      const h = hostPane.clientHeight || 1
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      globe.rendererSize(new THREE.Vector2(w, h))
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(hostPane)

    const updateClear = () => {
      const c = readPageBackgroundRgb()
      renderer.setClearColor(c, 0)
    }
    updateClear()
    const mo = new MutationObserver(updateClear)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    fetch(WORLD_ATLAS_URL)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json() as Promise<Topology>
      })
      .then((topology) => {
        if (disposed) return
        const list = buildHexFeatures(topology)
        featuresRef.current = list
        globe.hexPolygonColor((d: object) =>
          colorForHex(d as HexCountry, null, null),
        )
        globe.hexPolygonsData(list)
        setLoadState('ready')
      })
      .catch(() => {
        if (!disposed) setLoadState('error')
      })

    const animate = () => {
      if (disposed) return
      rafRef.current = requestAnimationFrame(animate)
      const delta = clockRef.current.getDelta()
      controls.update()
      if (!hoverPauseRef.current) {
        globe.rotation.y += delta * 0.12
      }
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      mo.disconnect()
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave)
      renderer.domElement.removeEventListener('pointerover', onPointerOver)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      controls.dispose()
      scene.remove(globe)
      if (typeof (globe as { _destructor?: () => void })._destructor === 'function') {
        ;(globe as { _destructor: () => void })._destructor()
      }
      renderer.dispose()
      if (renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement)
      }
      globeRef.current = null
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      controlsRef.current = null
    }
  }, [applyHexColors])

  const selectedEntry = selection ? TRAVEL_DATA[selection.iso] : undefined
  const countryPanelOpen = Boolean(selection)

  const back = () => {
    setSelection(null)
  }
  const vCount = visitedCountryCount()
  const wPct = worldVisitedPercent()

  return (
    <section className={styles.section} aria-label="travel globe">
      <div className={styles.layout}>
        <div ref={globePaneRef} className={styles.globePane}>
          <div ref={canvasHostRef} className={styles.canvasHost} />
          {loadState === 'loading' || loadState === 'idle' ? (
            <div className={styles.status}>loading map…</div>
          ) : null}
          {loadState === 'error' ? (
            <div className={styles.status}>couldn&apos;t load map data</div>
          ) : null}
          {tooltip && loadState === 'ready' ? (
            <div
              className={styles.tooltip}
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              {tooltip.text}
            </div>
          ) : null}
        </div>

        <aside className={styles.sidebar} aria-label="travel stats">
          <div className={styles.sidebarInner}>
            <div
              className={`${styles.track} ${countryPanelOpen ? styles.trackOpen : ''}`}
            >
              <div className={styles.panel}>
                <div className={styles.statBlock}>
                  <div className={styles.statValue}>{wPct}%</div>
                  <div className={styles.statLabel}>
                    visited {wPct}% of the world
                  </div>
                </div>
                <div className={styles.statBlock}>
                  <div className={styles.statValue}>{vCount}</div>
                  <div className={styles.statLabel}>countries explored</div>
                </div>
              </div>

              <div className={styles.panel}>
                {countryPanelOpen && selection ? (
                  <>
                    <div className={styles.backRow}>
                      <button type="button" className={styles.backBtn} onClick={back}>
                        ← back
                      </button>
                    </div>
                    <h3 className={styles.countryTitle}>
                      {selectedEntry?.label ?? selection.label}
                    </h3>
                    <div className={styles.statLabel}>
                      visited{' '}
                      {selectedEntry ? countryVisitedPercent(selectedEntry) : 0}% of{' '}
                      {selectedEntry?.label ?? selection.label}
                    </div>
                    {selectedEntry?.places?.length ? (
                      <div className={styles.pills}>
                        {selectedEntry.places.map((p) => (
                          <span key={p} className={styles.pill}>
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.emptyNote}>no cities logged yet</p>
                    )}
                  </>
                ) : (
                  <div className={styles.statLabel}>select a country on the globe</div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default GlobeSection
export { TRAVEL_DATA, UN_RECOGNIZED_COUNTRIES } from './travelData'
