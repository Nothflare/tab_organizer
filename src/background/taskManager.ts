import type { TaskState, TaskPhase, TaskResult } from "~/lib/types"

const STORAGE_KEY = "task_state"

// AbortController must remain in-memory (can't be serialized)
let abortController: AbortController | null = null

async function getStoredState(): Promise<TaskState> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return result[STORAGE_KEY] ?? { status: "idle" }
}

async function setStoredState(state: TaskState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: state })
}

export async function getTaskState(): Promise<TaskState> {
  return getStoredState()
}

export async function setTaskPhase(phase: TaskPhase): Promise<void> {
  const current = await getStoredState()
  if (current.status === "running") {
    await setStoredState({ ...current, phase })
  }
}

export async function startTask(): Promise<AbortController> {
  abortController = new AbortController()
  await setStoredState({
    status: "running",
    phase: "fetching-tabs",
    startedAt: Date.now()
  })
  return abortController
}

export async function completeTask(result: TaskResult): Promise<void> {
  await setStoredState({
    status: "completed",
    result,
    completedAt: Date.now()
  })
  abortController = null
}

export async function failTask(error: string): Promise<void> {
  await setStoredState({
    status: "error",
    error,
    failedAt: Date.now()
  })
  abortController = null
}

export async function cancelTask(): Promise<boolean> {
  const current = await getStoredState()
  if (current.status !== "running" || !abortController) {
    return false
  }
  abortController.abort()
  await setStoredState({
    status: "cancelled",
    cancelledAt: Date.now()
  })
  abortController = null
  return true
}

export async function resetToIdle(): Promise<void> {
  await setStoredState({ status: "idle" })
  abortController = null
}

export async function isRunning(): Promise<boolean> {
  const current = await getStoredState()
  return current.status === "running"
}
