import { TERMINAL_PROJECTS } from './terminalProjectsData'
import type { TerminalProject } from './terminalProjectTypes'

function normalize(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function resolveTerminalProject(input: string): TerminalProject | null {
  const query = normalize(input)
  if (!query) return null

  for (const project of TERMINAL_PROJECTS) {
    if (normalize(project.slug) === query) return project
    if (normalize(project.title) === query) return project
    for (const alias of project.aliases) {
      if (normalize(alias) === query) return project
    }
  }

  return null
}

const CLOSE_COMMAND_NAMES: Record<string, string> = {
  photon: 'photon',
  sync: 'sync',
  'rutgers-cafe': 'ru cafe',
  'classification-neural-networks': 'classification',
  tripdog: 'tripdog',
}

export function getProjectCloseCommandName(project: TerminalProject): string {
  return CLOSE_COMMAND_NAMES[project.slug] ?? project.slug
}

export const TERMINAL_HELP_LINES = [
  'Available commands:',
  '  open <project>    — open project details',
  '  close <project> — close detail pane',
  '  preview <project> — quick media preview',
  '  ls                — list all projects',
  '  clear             — clear terminal output',
  '  help              — show this reference',
]
