import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import type { PortfolioTheme } from '../../portfolio/portfolioTheme'
import '../terminal.css'
import { TERMINAL_PROJECTS } from '../terminalProjectsData'
import type { TerminalProject } from '../terminalProjectTypes'
import { TERMINAL_HELP_LINES, getProjectCloseCommandName, resolveTerminalProject } from '../terminalResolve'
import {
  applyTabCompletion,
  navigateHistory,
  pushHistory,
  type TabCompletionState,
} from '../terminalInput'
import { TerminalDetailPane } from './TerminalDetailPane'
import { MobileProjectDetailLayer } from './MobileProjectDetailLayer'
import { TerminalPreviewOverlay } from './TerminalPreviewOverlay'
import styles from './TerminalProjects.module.css'

const BOOT_COMMAND = 'ls ~/projects'
const TYPE_MS = 40
const STAGGER_MS = 120
const HINT_DELAY_MS = 2000
const HINT_DURATION_MS = 5000
const DEFAULT_SPLIT = 0.35

type HistoryOutput =
  | { type: 'projects'; visible: number }
  | { type: 'text'; lines: string[]; muted?: boolean }
  | { type: 'none' }

type HistoryEntry = {
  id: string
  command: string
  output: HistoryOutput
}

type Props = {
  theme: PortfolioTheme
  variant?: 'desktop' | 'mobile'
  onSelectedProjectChange?: (project: TerminalProject | null) => void
  detailCloseRef?: RefObject<(() => void) | null>
}

function statusClass(status: TerminalProject['status']): string {
  return status === 'concept' ? styles.statusConcept : styles.statusBuilt
}

export function TerminalProjects({
  theme,
  variant = 'desktop',
  onSelectedProjectChange,
  detailCloseRef,
}: Props) {
  const isMobile = variant === 'mobile'
  const [typedChars, setTypedChars] = useState(0)
  const [visibleProjects, setVisibleProjects] = useState(0)
  const [bootDone, setBootDone] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [selectedProject, setSelectedProject] = useState<TerminalProject | null>(null)
  const [previewProject, setPreviewProject] = useState<TerminalProject | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [splitRatio, setSplitRatio] = useState(DEFAULT_SPLIT)
  const [resizing, setResizing] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lineIdRef = useRef(0)
  const commandHistoryRef = useRef<string[]>([])
  const historyIndexRef = useRef(-1)
  const historyDraftRef = useRef('')
  const tabCompletionRef = useRef<TabCompletionState | null>(null)
  const staggerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const selectedProjectRef = useRef<TerminalProject | null>(null)
  selectedProjectRef.current = selectedProject

  const appendHistoryEntry = useCallback((command: string, output: HistoryOutput) => {
    setHistory((prev) => [
      ...prev,
      { id: String(++lineIdRef.current), command, output },
    ])
  }, [])

  const closeDetailPane = useCallback(
    (echoCommand?: string) => {
      if (echoCommand) {
        appendHistoryEntry(echoCommand, { type: 'none' })
      }
      setSelectedProject(null)
    },
    [appendHistoryEntry],
  )

  const closeDetailFromUi = useCallback(() => {
    const open = selectedProjectRef.current
    if (!open) return
    closeDetailPane(`close ${getProjectCloseCommandName(open)}`)
  }, [closeDetailPane])

  useEffect(() => {
    onSelectedProjectChange?.(selectedProject)
  }, [onSelectedProjectChange, selectedProject])

  useEffect(() => {
    if (!detailCloseRef) return
    detailCloseRef.current = closeDetailFromUi
    return () => {
      detailCloseRef.current = null
    }
  }, [closeDetailFromUi, detailCloseRef])

  const openProject = useCallback((project: TerminalProject) => {
    setSelectedProject(project)
    setPreviewProject(null)
  }, [])

  const previewProjectMedia = useCallback((project: TerminalProject) => {
    setPreviewProject(project)
  }, [])

  const focusInput = useCallback(() => {
    if (!isMobile) inputRef.current?.focus()
  }, [isMobile])

  const staggerProjectsForEntry = useCallback((entryId: string) => {
    if (staggerTimerRef.current) {
      clearInterval(staggerTimerRef.current)
      staggerTimerRef.current = null
    }

    let projectIndex = 0
    staggerTimerRef.current = setInterval(() => {
      projectIndex += 1
      setHistory((prev) =>
        prev.map((entry) =>
          entry.id === entryId && entry.output.type === 'projects'
            ? { ...entry, output: { ...entry.output, visible: projectIndex } }
            : entry,
        ),
      )
      if (projectIndex >= TERMINAL_PROJECTS.length) {
        if (staggerTimerRef.current) clearInterval(staggerTimerRef.current)
        staggerTimerRef.current = null
      }
    }, STAGGER_MS)
  }, [])

  const listProjects = useCallback(
    (command: string) => {
      const entryId = String(++lineIdRef.current)
      setHistory((prev) => [
        ...prev,
        { id: entryId, command, output: { type: 'projects', visible: 0 } },
      ])
      staggerProjectsForEntry(entryId)
    },
    [staggerProjectsForEntry],
  )

  const runCommand = useCallback(
    (raw: string) => {
      const trimmed = raw.trim()
      if (!trimmed) return

      const parts = trimmed.split(/\s+/)
      const cmd = parts[0]?.toLowerCase()
      const arg = parts.slice(1).join(' ')

      if (cmd === 'help') {
        appendHistoryEntry(raw, { type: 'text', lines: TERMINAL_HELP_LINES })
        return
      }

      if (cmd === 'clear') {
        setHistory([])
        return
      }

      if (cmd === 'ls') {
        listProjects(raw)
        return
      }

      if (cmd === 'open') {
        const project = resolveTerminalProject(arg)
        if (!project) {
          appendHistoryEntry(raw, {
            type: 'text',
            lines: [`Project not found: ${arg} — try 'help'`],
            muted: true,
          })
          return
        }
        appendHistoryEntry(raw, { type: 'none' })
        openProject(project)
        return
      }

      if (cmd === 'preview') {
        const project = resolveTerminalProject(arg)
        if (!project) {
          appendHistoryEntry(raw, {
            type: 'text',
            lines: [`Project not found: ${arg} — try 'help'`],
            muted: true,
          })
          return
        }
        appendHistoryEntry(raw, { type: 'none' })
        previewProjectMedia(project)
        return
      }

      if (cmd === 'close') {
        const open = selectedProjectRef.current
        if (!open) {
          appendHistoryEntry(raw, { type: 'text', lines: ['No project detail open'], muted: true })
          return
        }
        if (arg) {
          const target = resolveTerminalProject(arg)
          if (!target) {
            appendHistoryEntry(raw, {
              type: 'text',
              lines: [`Project not found: ${arg} — try 'help'`],
              muted: true,
            })
            return
          }
          if (target.slug !== open.slug) {
            appendHistoryEntry(raw, {
              type: 'text',
              lines: [`${getProjectCloseCommandName(target)} is not open`],
              muted: true,
            })
            return
          }
        }
        appendHistoryEntry(raw, { type: 'none' })
        setSelectedProject(null)
        return
      }

      appendHistoryEntry(raw, {
        type: 'text',
        lines: [`Command not found: ${trimmed} — try 'help'`],
        muted: true,
      })
    },
    [appendHistoryEntry, listProjects, openProject, previewProjectMedia],
  )

  useEffect(() => {
    setTypedChars(0)
    setVisibleProjects(0)
    setBootDone(false)
    setHistory([])

    let typeTimer: ReturnType<typeof setInterval> | undefined
    let staggerTimer: ReturnType<typeof setInterval> | undefined
    let charIndex = 0

    typeTimer = setInterval(() => {
      charIndex += 1
      setTypedChars(charIndex)
      if (charIndex >= BOOT_COMMAND.length) {
        clearInterval(typeTimer)
        typeTimer = undefined
        let projectIndex = 0
        staggerTimer = setInterval(() => {
          projectIndex += 1
          setVisibleProjects(projectIndex)
          if (projectIndex >= TERMINAL_PROJECTS.length) {
            clearInterval(staggerTimer)
            staggerTimer = undefined
            setHistory([
              {
                id: String(++lineIdRef.current),
                command: BOOT_COMMAND,
                output: { type: 'projects', visible: TERMINAL_PROJECTS.length },
              },
            ])
            setBootDone(true)
          }
        }, STAGGER_MS)
      }
    }, TYPE_MS)

    return () => {
      if (typeTimer) clearInterval(typeTimer)
      if (staggerTimer) clearInterval(staggerTimer)
      if (staggerTimerRef.current) clearInterval(staggerTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!bootDone) return
    const showTimer = window.setTimeout(() => setShowHint(true), HINT_DELAY_MS)
    const hideTimer = window.setTimeout(() => setShowHint(false), HINT_DELAY_MS + HINT_DURATION_MS)
    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [bootDone])

  useEffect(() => {
    if (!isMobile && bootDone) {
      inputRef.current?.focus()
    }
  }, [isMobile, bootDone])

  useEffect(() => {
    if (!isMobile) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 300)
      return () => window.clearTimeout(timer)
    }
  }, [isMobile])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [history, visibleProjects, bootDone, inputValue])

  useEffect(() => {
    if (!resizing) return

    const onMove = (e: PointerEvent) => {
      const shell = shellRef.current
      if (!shell) return
      const rect = shell.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      setSplitRatio(Math.min(0.55, Math.max(0.25, ratio)))
    }

    const onUp = () => setResizing(false)

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [resizing])

  const submitCommand = useCallback(
    (raw: string) => {
      const trimmed = raw.trim()
      if (!trimmed) return

      commandHistoryRef.current = pushHistory(commandHistoryRef.current, trimmed)
      historyIndexRef.current = -1
      historyDraftRef.current = ''
      tabCompletionRef.current = null
      setInputValue('')
      runCommand(raw)
    },
    [runCommand],
  )

  const handleInputChange = useCallback((value: string) => {
    historyIndexRef.current = -1
    tabCompletionRef.current = null
    setInputValue(value)
  }, [])

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submitCommand(inputValue)
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      const result = applyTabCompletion(inputValue, tabCompletionRef.current)
      tabCompletionRef.current = result.state
      setInputValue(result.value)
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const nav = navigateHistory(
        commandHistoryRef.current,
        historyIndexRef.current,
        'up',
        historyDraftRef.current,
      )
      if (historyIndexRef.current === -1) {
        historyDraftRef.current = inputValue
      }
      historyIndexRef.current = nav.index
      tabCompletionRef.current = null
      setInputValue(nav.value)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nav = navigateHistory(
        commandHistoryRef.current,
        historyIndexRef.current,
        'down',
        historyDraftRef.current,
      )
      historyIndexRef.current = nav.index
      tabCompletionRef.current = null
      setInputValue(nav.value)
    }
  }

  const handleDividerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    setResizing(true)
  }

  const typedCommand = BOOT_COMMAND.slice(0, typedChars)
  const showDetail = selectedProject != null
  const terminalWidth = showDetail && !isMobile ? `${splitRatio * 100}%` : '100%'

  const renderProjectBlock = (project: TerminalProject) => {
    const isActive = selectedProject?.slug === project.slug
    return (
      <div
        key={project.slug}
        className={`${styles.projectBlock} ${isActive ? styles.projectBlockActive : ''}`}
        style={{ '--project-accent': project.accentColor } as React.CSSProperties}
      >
        <div className={styles.projectRow}>
          <span className={styles.projectName}>
            {project.terminalIcon} {project.title}
          </span>
          <span className={statusClass(project.status)}>● {project.status}</span>
        </div>
        <div className={styles.projectDesc}>{project.terminalOneLiner}</div>
        <div className={styles.projectStack}>{project.terminalStack}</div>
        <div className={styles.actionRow}>
          <span className={styles.actionRule} aria-hidden />
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => openProject(project)}
          >
            [open]
          </button>
          <span className={styles.actionSep} aria-hidden>
            ·
          </span>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => previewProjectMedia(project)}
          >
            [preview]
          </button>
          <span className={styles.actionRule} aria-hidden />
        </div>
      </div>
    )
  }

  const renderHistoryEntry = (entry: HistoryEntry) => {
    const projectOutput = entry.output.type === 'projects' ? entry.output : null
    const textOutput = entry.output.type === 'text' ? entry.output : null

    return (
      <div key={entry.id} className={styles.historyBlock}>
        <p className={styles.outputLine}>zain@portfolio ~ % {entry.command}</p>
        {projectOutput
          ? TERMINAL_PROJECTS.slice(0, projectOutput.visible).map(renderProjectBlock)
          : null}
        {textOutput
          ? textOutput.lines.map((line, index) => (
              <p
                key={`${entry.id}-${index}`}
                className={`${styles.outputLine} ${textOutput.muted ? styles.outputMuted : ''}`}
              >
                {line}
              </p>
            ))
          : null}
      </div>
    )
  }

  const terminalContent = (
    <div
      className={styles.terminalClickTarget}
      onClick={focusInput}
      onKeyDown={() => {}}
      role="presentation"
    >
      <div ref={scrollRef} className={styles.terminalScroll}>
        {!bootDone ? (
          <>
            <div className={styles.promptLine}>
              <span className={styles.prompt}>zain@portfolio ~ % </span>
              <span className={styles.typedCmd}>{typedCommand}</span>
            </div>
            {typedChars >= BOOT_COMMAND.length
              ? TERMINAL_PROJECTS.slice(0, visibleProjects).map(renderProjectBlock)
              : null}
          </>
        ) : (
          history.map(renderHistoryEntry)
        )}

        {bootDone ? (
          <div className={styles.inputLine}>
            {!isMobile ? (
              <>
                <span className={styles.prompt}>zain@portfolio ~ % </span>
                <span className={styles.typedCmd}>{inputValue}</span>
                <span className={styles.cursor} aria-hidden />
              </>
            ) : (
              <p className={styles.mobileHint}>Tap a project to explore</p>
            )}
          </div>
        ) : null}

        {showHint && !isMobile ? (
          <p className={styles.hint}>? Click a project or type help</p>
        ) : null}
      </div>

      {!isMobile ? (
        <input
          ref={inputRef}
          className={styles.hiddenInput}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Terminal command input"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      ) : null}
    </div>
  )

  return (
    <div
      ref={shellRef}
      className={`${styles.shell} terminal-root ${isMobile ? styles.shellMobile : ''}`}
      data-portfolio-theme={theme}
    >
      <div
        className={`${styles.terminalPane} ${!isMobile ? styles.terminalPaneDesktop : ''}`}
        style={!isMobile ? { width: terminalWidth } : undefined}
      >
        {terminalContent}
      </div>

      {showDetail && !isMobile ? (
        <>
          <div
            className={`${styles.dividerHandle} ${resizing ? styles.dividerHandleActive : ''}`}
            onPointerDown={handleDividerDown}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panes"
          />
          <aside className={styles.detailPane} aria-label="Project details">
            <TerminalDetailPane
              project={selectedProject!}
              onClose={closeDetailFromUi}
            />
          </aside>
        </>
      ) : null}

      {showDetail && isMobile ? (
        <MobileProjectDetailLayer key={selectedProject!.slug} onClose={closeDetailFromUi}>
          <TerminalDetailPane
            project={selectedProject!}
            variant="mobile"
            onClose={closeDetailFromUi}
          />
        </MobileProjectDetailLayer>
      ) : null}

      {previewProject ? (
        <TerminalPreviewOverlay
          project={previewProject}
          mobile={isMobile}
          onClose={() => setPreviewProject(null)}
        />
      ) : null}
    </div>
  )
}
