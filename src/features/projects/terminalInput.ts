import { TERMINAL_PROJECTS } from './terminalProjectsData'

const TERMINAL_COMMANDS = ['clear', 'close', 'help', 'ls', 'open', 'preview'] as const

const PROJECT_ARG_COMMANDS = new Set<string>(['close', 'open', 'preview'])

type ParsedInput =
  | { kind: 'command'; partial: string }
  | { kind: 'arg'; command: string; partial: string }

export type TabCompletionState = {
  baseInput: string
  matches: string[]
  index: number
}

function parseInput(input: string): ParsedInput {
  const spaceIdx = input.indexOf(' ')
  if (spaceIdx === -1) return { kind: 'command', partial: input }
  return {
    kind: 'arg',
    command: input.slice(0, spaceIdx),
    partial: input.slice(spaceIdx + 1),
  }
}

function longestCommonPrefix(values: readonly string[]): string {
  if (values.length === 0) return ''
  if (values.length === 1) return values[0]!

  let prefix = values[0]!
  for (const value of values.slice(1)) {
    const lowerPrefix = prefix.toLowerCase()
    const lowerValue = value.toLowerCase()
    while (prefix.length > 0 && !lowerValue.startsWith(lowerPrefix)) {
      prefix = prefix.slice(0, -1)
    }
  }
  return prefix
}


function projectMatchesPartial(project: (typeof TERMINAL_PROJECTS)[number], partial: string): boolean {
  return projectMatchScore(project, partial) > 0
}

/** Higher score = better autocomplete candidate. */
function projectMatchScore(project: (typeof TERMINAL_PROJECTS)[number], partial: string): number {
  if (!partial) return 1
  const p = partial.toLowerCase()
  let best = 0

  const consider = (token: string, scores: { start: number; firstWord: number; anyWord: number }) => {
    const lower = token.toLowerCase()
    if (lower.startsWith(p)) {
      best = Math.max(best, scores.start)
      return
    }
    const words = lower.split(/[\s-]+/)
    if (words[0]?.startsWith(p)) {
      best = Math.max(best, scores.firstWord)
      return
    }
    if (words.some((word) => word.startsWith(p))) {
      best = Math.max(best, scores.anyWord)
    }
  }

  consider(project.title, { start: 100, firstWord: 90, anyWord: 60 })
  consider(project.slug, { start: 85, firstWord: 75, anyWord: 45 })
  for (const alias of project.aliases) {
    consider(alias, { start: 80, firstWord: 70, anyWord: 40 })
  }

  return best
}

function findCommandMatches(partial: string): string[] {
  const query = partial.toLowerCase()
  return TERMINAL_COMMANDS.filter((cmd) => cmd.startsWith(query))
}

function findProjectMatches(partial: string): string[] {
  const query = partial.toLowerCase().trim()
  return TERMINAL_PROJECTS.filter((project) => projectMatchesPartial(project, query))
    .sort((a, b) => {
      const scoreDiff = projectMatchScore(b, query) - projectMatchScore(a, query)
      if (scoreDiff !== 0) return scoreDiff
      return a.title.localeCompare(b.title)
    })
    .map((project) => project.title)
}

function findMatches(input: string): string[] {
  const parsed = parseInput(input)

  if (parsed.kind === 'command') {
    return findCommandMatches(parsed.partial)
  }

  const command = parsed.command.toLowerCase()
  if (!PROJECT_ARG_COMMANDS.has(command)) return []

  return findProjectMatches(parsed.partial)
}

function buildCompletedValue(input: string, completion: string): string {
  const parsed = parseInput(input)

  if (parsed.kind === 'command') {
    const addSpace = TERMINAL_COMMANDS.includes(completion as (typeof TERMINAL_COMMANDS)[number])
    return addSpace ? `${completion} ` : completion
  }

  return `${parsed.command} ${completion}`
}

export function applyTabCompletion(
  input: string,
  state: TabCompletionState | null,
): { value: string; state: TabCompletionState | null } {
  const isNewCycle = state == null || state.baseInput !== input
  const matches = findMatches(input)

  if (matches.length === 0) {
    return { value: input, state: null }
  }

  const parsed = parseInput(input)
  const partial = parsed.kind === 'command' ? parsed.partial : parsed.partial

  if (isNewCycle && matches.length === 1) {
    return {
      value: buildCompletedValue(input, matches[0]!),
      state: { baseInput: input, matches, index: 0 },
    }
  }

  if (isNewCycle && matches.length > 1) {
    const parsedArg = parseInput(input)
    if (parsedArg.kind === 'arg') {
      const query = parsedArg.partial.toLowerCase().trim()
      const ranked = TERMINAL_PROJECTS.filter((project) => projectMatchesPartial(project, query)).sort(
        (a, b) => projectMatchScore(b, query) - projectMatchScore(a, query),
      )
      const topScore = projectMatchScore(ranked[0]!, query)
      const secondScore = ranked[1] ? projectMatchScore(ranked[1], query) : 0
      if (topScore > secondScore) {
        return {
          value: buildCompletedValue(input, ranked[0]!.title),
          state: { baseInput: input, matches, index: 0 },
        }
      }
    }

    const prefix = longestCommonPrefix(matches)
    if (prefix.length > partial.length) {
      return {
        value: buildCompletedValue(input, prefix),
        state: { baseInput: input, matches, index: 0 },
      }
    }
  }

  const index = isNewCycle ? 0 : (state!.index + 1) % matches.length
  const completion = matches[index]!

  return {
    value: buildCompletedValue(input, completion),
    state: { baseInput: input, matches, index },
  }
}

export function navigateHistory(
  history: readonly string[],
  currentIndex: number,
  direction: 'up' | 'down',
  draft: string,
): { value: string; index: number; draft: string } {
  if (history.length === 0) {
    return { value: draft, index: -1, draft }
  }

  if (direction === 'up') {
    if (currentIndex === -1) {
      return { value: history[history.length - 1]!, index: history.length - 1, draft }
    }
    if (currentIndex === 0) {
      return { value: history[0]!, index: 0, draft }
    }
    const nextIndex = currentIndex - 1
    return { value: history[nextIndex]!, index: nextIndex, draft }
  }

  if (currentIndex === -1) {
    return { value: draft, index: -1, draft }
  }

  const nextIndex = currentIndex + 1
  if (nextIndex >= history.length) {
    return { value: draft, index: -1, draft }
  }

  return { value: history[nextIndex]!, index: nextIndex, draft }
}

export function pushHistory(history: string[], command: string): string[] {
  const trimmed = command.trim()
  if (!trimmed) return history
  if (history.at(-1) === trimmed) return history
  return [...history, trimmed]
}
