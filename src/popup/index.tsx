import { useState } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import { Button } from "~/components/ui/button"
import type { OrganizeResponse } from "~/background/messages/organize"
import type { UngroupResponse } from "~/background/messages/ungroup"
import type { Status } from "~/lib/types"
import "~/style.css"

function Popup() {
  const [status, setStatus] = useState<Status>({ type: "idle" })
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)

  const handleOrganize = async () => {
    setStatus({ type: "progress", message: "Fetching tabs..." })
    setDebugLog([])

    try {
      setStatus({ type: "progress", message: "Organizing with AI..." })

      const response = await sendToBackground<{}, OrganizeResponse>({
        name: "organize"
      })

      if (response.debug) {
        setDebugLog(response.debug)
      }

      if (response.success) {
        setStatus({
          type: "success",
          message: `Organized into ${response.groupCount} groups`
        })
        setTimeout(() => setStatus({ type: "idle" }), 3000)
      } else {
        setStatus({
          type: "error",
          message: response.error || "Failed to organize",
          details: response.debug?.join("\n")
        })
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }

  const handleUngroup = async () => {
    setStatus({ type: "progress", message: "Ungrouping tabs..." })

    try {
      const response = await sendToBackground<{}, UngroupResponse>({
        name: "ungroup"
      })

      if (response.success) {
        setStatus({ type: "success", message: "All tabs ungrouped" })
        setTimeout(() => setStatus({ type: "idle" }), 2000)
      } else {
        setStatus({
          type: "error",
          message: response.error || "Failed to ungroup"
        })
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }

  const isProcessing = status.type === "progress"

  return (
    <div className="w-[280px] bg-[#0a0a0a] text-zinc-50 p-4">
      <h1 className="text-base font-medium text-center mb-4">Tab Organizer</h1>

      <div className="space-y-2">
        <Button
          onClick={handleOrganize}
          disabled={isProcessing}
          className="w-full h-11"
        >
          Organize Tabs
        </Button>

        <button
          onClick={handleUngroup}
          disabled={isProcessing}
          className="w-full text-xs text-zinc-500 hover:text-zinc-400 disabled:opacity-50 py-1"
        >
          Ungroup All
        </button>
      </div>

      {status.type !== "idle" && (
        <div className="mt-4 pt-3 border-t border-zinc-800">
          <p
            className={`text-xs ${
              status.type === "error"
                ? "text-red-400"
                : status.type === "success"
                ? "text-green-400"
                : "text-zinc-400"
            }`}
          >
            {status.message}
          </p>

          {status.type === "error" && debugLog.length > 0 && (
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-zinc-600 hover:text-zinc-500 mt-1"
            >
              {showDebug ? "Hide" : "Show"} debug info
            </button>
          )}

          {showDebug && debugLog.length > 0 && (
            <pre className="mt-2 p-2 bg-zinc-900 rounded text-[10px] text-zinc-500 overflow-auto max-h-32">
              {debugLog.join("\n")}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

export default Popup
