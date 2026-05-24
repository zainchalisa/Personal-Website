import { FAR_BUILDING_RECTS, NEAR_BUILDING_RECTS } from './buildingRects'
import { buildSkylineWindows, type SkylineWindow } from './skylineWindows'
import styles from './PixelSkyline.module.css'

const SKYLINE_WIDTH = 1440

const NEAR_SKYLINE_WINDOWS = buildSkylineWindows(NEAR_BUILDING_RECTS)

type BuildingRect = (typeof FAR_BUILDING_RECTS)[number]

function BuildingClipPath({
  id,
  rects,
  offsetX = 0,
}: {
  id: string
  rects: BuildingRect[]
  offsetX?: number
}) {
  return (
    <clipPath id={id}>
      {rects.map((r, i) => (
        <rect
          key={i}
          x={r.x + offsetX}
          y={r.y}
          width={r.width}
          height={r.height}
          shapeRendering="crispEdges"
        />
      ))}
    </clipPath>
  )
}

function BuildingRects({
  rects,
  fill,
  offsetX = 0,
}: {
  rects: BuildingRect[]
  fill: string
  offsetX?: number
}) {
  return (
    <>
      {rects.map((r, i) => (
        <rect
          key={i}
          x={r.x + offsetX}
          y={r.y}
          width={r.width}
          height={r.height}
          fill={fill}
          shapeRendering="crispEdges"
        />
      ))}
    </>
  )
}

function WindowLayer({
  windows,
  offsetX = 0,
}: {
  windows: SkylineWindow[]
  offsetX?: number
}) {
  return (
    <g className={styles.windows}>
      {windows.map((w, i) => (
        <rect
          key={i}
          x={w.x + offsetX}
          y={w.y}
          width={8}
          height={9}
          className={w.lit ? styles.windowLit : styles.windowUnlit}
          style={
            w.lit
              ? {
                  animationDuration: `${w.duration}s`,
                  animationDelay: `${w.delay}s`,
                }
              : undefined
          }
          shapeRendering="crispEdges"
        />
      ))}
    </g>
  )
}

function ScrollingBuildingLayer({
  rects,
  fill,
  layerClassName,
  trackClassName,
  clipPathId,
  windows,
}: {
  rects: BuildingRect[]
  fill: string
  layerClassName: string
  trackClassName: string
  clipPathId: string
  windows?: SkylineWindow[]
}) {
  return (
    <g className={trackClassName}>
      <defs>
        <BuildingClipPath id={`${clipPathId}-0`} rects={rects} />
        <BuildingClipPath
          id={`${clipPathId}-1`}
          rects={rects}
          offsetX={SKYLINE_WIDTH}
        />
      </defs>
      <g className={styles.scrollInner}>
        <g className={layerClassName} clipPath={`url(#${clipPathId}-0)`}>
          <BuildingRects rects={rects} fill={fill} />
          {windows ? <WindowLayer windows={windows} /> : null}
        </g>
        <g className={layerClassName} clipPath={`url(#${clipPathId}-1)`}>
          <BuildingRects rects={rects} fill={fill} offsetX={SKYLINE_WIDTH} />
          {windows ? (
            <WindowLayer windows={windows} offsetX={SKYLINE_WIDTH} />
          ) : null}
        </g>
      </g>
    </g>
  )
}

export function PixelSkyline() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <svg
        className={styles.svg}
        viewBox={`0 0 ${SKYLINE_WIDTH} 360`}
        preserveAspectRatio="xMidYMax slice"
      >
        <ScrollingBuildingLayer
          rects={FAR_BUILDING_RECTS}
          fill="var(--skyline-far)"
          layerClassName={styles.far}
          trackClassName={styles.farTrack}
          clipPathId="pixel-skyline-far-clip"
        />
        <ScrollingBuildingLayer
          rects={NEAR_BUILDING_RECTS}
          fill="var(--skyline-near)"
          layerClassName={styles.near}
          trackClassName={styles.nearTrack}
          clipPathId="pixel-skyline-near-clip"
          windows={NEAR_SKYLINE_WINDOWS}
        />
      </svg>
      <div className={styles.scanlines} />
    </div>
  )
}
