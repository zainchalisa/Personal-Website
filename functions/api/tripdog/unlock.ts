import { handleTripdogUnlock } from '../../_lib/tripdog'

type Env = {
  TRIPDOG_UNLOCK_PASSWORD?: string
  TRIPDOG_PASSWORD?: string
  TRIPDOG_PROJECT_JSON?: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  return handleTripdogUnlock(context.request, context.env)
}
