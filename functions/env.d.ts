type PagesFunction<Env = unknown> = (
  context: EventContext<Env, string, Record<string, never>>,
) => Response | Promise<Response>

type EventContext<Env, P extends string, Data> = {
  request: Request
  functionPath: string
  waitUntil: (promise: Promise<unknown>) => void
  passThroughOnException: () => void
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>
  env: Env
  params: Record<P, string | undefined>
  data: Data
}
