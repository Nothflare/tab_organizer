import type { PlasmoMessaging } from "@plasmohq/messaging"
import { getAllTabs, ungroupAllTabs, createTabGroups } from "~/lib/tabs"
import { getSettings } from "~/lib/storage"
import { organizeTabsWithAI } from "~/lib/api"
import type { Settings } from "~/lib/types"
import {
  startTask,
  completeTask,
  failTask,
  setTaskPhase,
  isRunning,
  getTaskState
} from "~/background/taskManager"

export type OrganizeRequest = {
  action: "organize"
}

export type OrganizeResponse = {
  started: boolean
  error?: string
}

// Check if task was cancelled (by reading storage directly)
async function isCancelled(): Promise<boolean> {
  const state = await getTaskState()
  return state.status === "cancelled"
}

async function executeOrganizeTask(
  settings: Settings,
  signal: AbortSignal
): Promise<void> {
  const debugLog: string[] = []
  const onDebug = (msg: string) => {
    if (settings.debugMode) {
      debugLog.push(msg)
    }
  }

  try {
    // Phase 1: Fetch tabs
    await setTaskPhase("fetching-tabs")
    onDebug("Fetching tabs...")
    const tabs = await getAllTabs()
    onDebug(`Found ${tabs.length} tabs`)

    if (signal.aborted || await isCancelled()) return

    if (tabs.length === 0) {
      await failTask("No tabs found")
      return
    }

    // Get active tab before modifications
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    })
    const activeTabId = activeTab?.id
    onDebug(`Active tab ID: ${activeTabId ?? "none"}`)

    if (signal.aborted || await isCancelled()) return

    // Phase 2: Ungroup existing
    await setTaskPhase("ungrouping")
    onDebug("Ungrouping existing groups...")
    await ungroupAllTabs()

    if (signal.aborted || await isCancelled()) return

    // Phase 3: Call AI (the long operation)
    await setTaskPhase("calling-ai")
    onDebug("Calling AI...")
    const groups = await organizeTabsWithAI(tabs, settings, {
      signal,
      onDebug
    })
    onDebug(`AI returned ${groups.length} groups`)

    if (signal.aborted || await isCancelled()) return

    // Phase 4: Create groups
    await setTaskPhase("creating-groups")
    onDebug("Creating groups...")
    if (settings.collapseGroups) {
      onDebug("Collapse others enabled, active tab's group will stay expanded")
    }
    await createTabGroups(groups, {
      collapseOthers: settings.collapseGroups,
      activeTabId
    })

    // Final check before completing
    if (await isCancelled()) return

    onDebug("Done!")
    await completeTask({
      groupCount: groups.length,
      debug: settings.debugMode ? debugLog : undefined
    })
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // Cancellation via AbortController
      return
    }

    // Check if cancelled before reporting error
    if (await isCancelled()) return

    const message = error instanceof Error ? error.message : "Unknown error"
    onDebug(`Error: ${message}`)
    await failTask(message)
  }
}

const handler: PlasmoMessaging.MessageHandler<OrganizeRequest, OrganizeResponse> = async (req, res) => {
  // Prevent duplicate tasks
  if (await isRunning()) {
    res.send({ started: false, error: "Task already running" })
    return
  }

  const settings = await getSettings()

  // Validate before starting
  if (!settings.apiKey || !settings.apiEndpoint) {
    res.send({
      started: false,
      error: "Please configure API settings in the extension options"
    })
    return
  }

  // Start the task and get the abort controller
  const abortController = await startTask()

  // Acknowledge immediately - popup can close now
  res.send({ started: true })

  // Run the actual work asynchronously (fire-and-forget)
  executeOrganizeTask(settings, abortController.signal)
}

export default handler
