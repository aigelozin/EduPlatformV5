// In-process SSE broadcaster per livestream ID.
// Works with PM2 single-process mode on Beget Shared.
// For multi-process deployments, replace with Redis pub/sub.

type Listener = (data: string) => void

const listeners = new Map<string, Set<Listener>>()

export function subscribe(livestreamId: string, listener: Listener): () => void {
  if (!listeners.has(livestreamId)) {
    listeners.set(livestreamId, new Set())
  }
  listeners.get(livestreamId)!.add(listener)
  return () => {
    listeners.get(livestreamId)?.delete(listener)
    if (listeners.get(livestreamId)?.size === 0) {
      listeners.delete(livestreamId)
    }
  }
}

export function broadcast(livestreamId: string, data: object) {
  const payload = `data: ${JSON.stringify(data)}\n\n`
  listeners.get(livestreamId)?.forEach((fn) => fn(payload))
}

export function getListenerCount(livestreamId: string): number {
  return listeners.get(livestreamId)?.size ?? 0
}
