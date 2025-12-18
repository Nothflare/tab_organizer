import { useState, useEffect } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import type { UngroupResponse } from "~/background/messages/ungroup"
import type { OrganizeResponse } from "~/background/messages/organize"
import type { TaskState, TaskPhase } from "~/lib/types"
import "~/style.css"

const TASK_STATE_KEY = "task_state"

// Map task phases to user-friendly messages
const PHASE_MESSAGES: Record<TaskPhase, string> = {
  "fetching-tabs": "Fetching tabs...",
  "ungrouping": "Preparing...",
  "calling-ai": "AI thinking...",
  "creating-groups": "Creating groups..."
}

function Popup() {
  const [taskState, setTaskState] = useState<TaskState>({ status: "idle" })
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)

  // Load initial state and listen for changes
  useEffect(() => {
    // Load initial state directly from storage
    chrome.storage.local.get(TASK_STATE_KEY).then((result) => {
      const state = result[TASK_STATE_KEY] as TaskState | undefined
      if (state?.status) {
        setTaskState(state)
        if (state.status === "completed" && state.result?.debug) {
          setDebugLog(state.result.debug)
        }
      }
    })

    // Listen for storage changes
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes[TASK_STATE_KEY]) {
        const newState = changes[TASK_STATE_KEY].newValue as TaskState
        if (newState?.status) {
          setTaskState(newState)
          if (newState.status === "completed" && newState.result?.debug) {
            setDebugLog(newState.result.debug)
          }
        }
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [])

  // Auto-dismiss all terminal states after a delay
  useEffect(() => {
    const isTerminalState = taskState.status === "completed" ||
                           taskState.status === "error" ||
                           taskState.status === "cancelled"
    if (!isTerminalState) return

    // Different delays: success is quick, errors/cancelled stay longer so user can read
    const delay = taskState.status === "completed" ? 3000 : 4000

    const timeout = setTimeout(async () => {
      await chrome.storage.local.set({ [TASK_STATE_KEY]: { status: "idle" } })
      setTaskState({ status: "idle" })
      setDebugLog([])
    }, delay)

    return () => clearTimeout(timeout)
  }, [taskState.status])

  // Handle organize button click (toggle behavior)
  const handleOrganizeClick = async () => {
    if (taskState.status === "running") {
      // Cancel the running task - update storage directly for immediate feedback
      const cancelledState: TaskState = { status: "cancelled", cancelledAt: Date.now() }
      await chrome.storage.local.set({ [TASK_STATE_KEY]: cancelledState })
      setTaskState(cancelledState)
      // Also notify background to abort if possible
      sendToBackground({ name: "cancelTask" }).catch(() => {})
    } else {
      // Clear any previous state and start fresh
      setDebugLog([])
      const runningState: TaskState = { status: "running", phase: "fetching-tabs", startedAt: Date.now() }
      setTaskState(runningState)

      try {
        const response = await sendToBackground<{}, OrganizeResponse>({
          name: "organize"
        })

        if (response?.error) {
          const errorState: TaskState = { status: "error", error: response.error, failedAt: Date.now() }
          await chrome.storage.local.set({ [TASK_STATE_KEY]: errorState })
          setTaskState(errorState)
        }
        // If started successfully, storage listener will handle updates
      } catch (error) {
        console.error("Failed to start organize:", error)
        const errorState: TaskState = {
          status: "error",
          error: error instanceof Error ? error.message : "Failed to start",
          failedAt: Date.now()
        }
        await chrome.storage.local.set({ [TASK_STATE_KEY]: errorState })
        setTaskState(errorState)
      }
    }
  }

  const handleUngroup = async () => {
    if (taskState.status === "running") return

    try {
      const response = await sendToBackground<{}, UngroupResponse>({
        name: "ungroup"
      })

      if (response.success) {
        // Brief success indication
        const successState: TaskState = { status: "completed", result: { groupCount: 0 }, completedAt: Date.now() }
        await chrome.storage.local.set({ [TASK_STATE_KEY]: successState })
        setTaskState(successState)
      } else {
        const errorState: TaskState = {
          status: "error",
          error: response.error || "Failed to ungroup",
          failedAt: Date.now()
        }
        await chrome.storage.local.set({ [TASK_STATE_KEY]: errorState })
        setTaskState(errorState)
      }
    } catch (error) {
      const errorState: TaskState = {
        status: "error",
        error: error instanceof Error ? error.message : "Error",
        failedAt: Date.now()
      }
      await chrome.storage.local.set({ [TASK_STATE_KEY]: errorState })
      setTaskState(errorState)
    }
  }

  // Derive UI state
  const isRunning = taskState.status === "running"

  // Get status display
  const getStatusDisplay = (): { text: string; color: string } => {
    switch (taskState.status) {
      case "idle":
        return { text: "Ready to organize", color: "text-zinc-500" }
      case "running":
        return { text: PHASE_MESSAGES[taskState.phase], color: "text-blue-400" }
      case "completed":
        return {
          text: taskState.result.groupCount > 0
            ? `Done — ${taskState.result.groupCount} groups created`
            : "Done — Ungrouped",
          color: "text-emerald-400"
        }
      case "cancelled":
        return { text: "Cancelled", color: "text-yellow-400" }
      case "error":
        return { text: taskState.error, color: "text-red-400" }
    }
  }

  const statusDisplay = getStatusDisplay()

  // Animation state for text transitions
  const [displayText, setDisplayText] = useState("Ready to organize")
  const [textColor, setTextColor] = useState("text-zinc-500")
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (statusDisplay.text === displayText) return

    // Start exit animation
    setIsExiting(true)

    // After exit animation, swap text and enter
    const timeout = setTimeout(() => {
      setDisplayText(statusDisplay.text)
      setTextColor(statusDisplay.color)
      setShouldAnimate(taskState.status === "running")
      setIsExiting(false)
    }, 150)

    return () => clearTimeout(timeout)
  }, [statusDisplay.text])

  const WaveText = ({ text }: { text: string }) => (
    <span className="inline-flex">
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="animate-wave"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  )

  return (
    <div className="w-[280px] bg-[#0a0a0a] text-zinc-50 p-3">
      <div className="flex gap-2">
        <button
          onClick={handleUngroup}
          disabled={isRunning}
          className="h-11 px-3 text-xs font-medium text-zinc-400 bg-zinc-800 rounded-md
                     hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-50
                     disabled:cursor-not-allowed transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleOrganizeClick}
          className={`flex-1 h-11 text-sm font-medium rounded-md transition-colors
                      flex items-center justify-center gap-2
                      ${isRunning
                        ? "bg-red-600 hover:bg-red-500 text-white"
                        : "bg-zinc-100 text-zinc-900 hover:bg-white"
                      }`}
        >
          {isRunning ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Cancel</span>
            </>
          ) : (
            "Organize"
          )}
        </button>
      </div>

      <div className={`mt-3 px-2 py-2 rounded bg-zinc-900/50 border border-zinc-800 overflow-hidden ${
        taskState.status === "error" ? "border-red-500/30 bg-red-500/5" : ""
      }`}>
        <div
          className={`text-xs ${textColor} transition-all duration-150 ${
            isExiting ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
          }`}
        >
          {shouldAnimate ? <WaveText text={displayText} /> : displayText}
        </div>

        {debugLog.length > 0 && (
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="mt-1.5 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {showDebug ? "hide debug log" : "show debug log"}
          </button>
        )}
        {showDebug && debugLog.length > 0 && (
          <pre className="mt-2 p-2 text-[10px] text-zinc-500 bg-black/30 rounded overflow-auto max-h-24 font-mono">
            {debugLog.join("\n")}
          </pre>
        )}
      </div>
    </div>
  )
}

export default Popup
