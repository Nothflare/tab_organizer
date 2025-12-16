import { useState, useEffect } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import type { OrganizeResponse } from "~/background/messages/organize"
import type { UngroupResponse } from "~/background/messages/ungroup"
import type { Status } from "~/lib/types"
import "~/style.css"

function Popup() {
  const [status, setStatus] = useState<Status>({ type: "idle" })
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)

  const handleOrganize = async () => {
    setDebugLog([])

    // Stage 1: Fetching tabs
    setStatus({ type: "progress", message: "Fetching tabs..." })
    await new Promise(r => setTimeout(r, 300))

    // Stage 2: Sending request
    setStatus({ type: "progress", message: "Sending request..." })

    try {
      // Stage 3: AI thinking (shown while waiting for response)
      const thinkingTimeout = setTimeout(() => {
        setStatus({ type: "progress", message: "AI thinking..." })
      }, 800)

      const response = await sendToBackground<{}, OrganizeResponse>({
        name: "organize"
      })

      clearTimeout(thinkingTimeout)

      if (response.debug) {
        setDebugLog(response.debug)
      }

      if (response.success) {
        // Stage 4: Creating groups
        setStatus({ type: "progress", message: "Creating groups..." })
        await new Promise(r => setTimeout(r, 200))

        setStatus({
          type: "success",
          message: `${response.groupCount} groups created`
        })
        setTimeout(() => setStatus({ type: "idle" }), 3000)
      } else {
        setStatus({
          type: "error",
          message: response.error || "Failed",
          details: response.debug?.join("\n")
        })
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Error"
      })
    }
  }

  const handleUngroup = async () => {
    setStatus({ type: "progress", message: "Ungrouping..." })

    try {
      const response = await sendToBackground<{}, UngroupResponse>({
        name: "ungroup"
      })

      if (response.success) {
        setStatus({ type: "success", message: "Ungrouped" })
        setTimeout(() => setStatus({ type: "idle" }), 1500)
      } else {
        setStatus({
          type: "error",
          message: response.error || "Failed"
        })
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Error"
      })
    }
  }

  const isProcessing = status.type === "progress"

  const getStatusText = () => {
    switch (status.type) {
      case "idle":
        return { text: "Ready to organize", color: "text-zinc-500" }
      case "progress":
        return { text: status.message, color: "text-blue-400" }
      case "success":
        return { text: `Done — ${status.message}`, color: "text-emerald-400" }
      case "error":
        return { text: status.message, color: "text-red-400" }
    }
  }

  const statusDisplay = getStatusText()

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
      setShouldAnimate(status.type === "progress")
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
          disabled={isProcessing}
          className="h-11 px-3 text-xs font-medium text-zinc-400 bg-zinc-800 rounded-md
                     hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-50
                     disabled:cursor-not-allowed transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleOrganize}
          disabled={isProcessing}
          className="flex-1 h-11 text-sm font-medium bg-zinc-100 text-zinc-900 rounded-md
                     hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors flex items-center justify-center gap-2"
        >
          {isProcessing && status.message === "Organizing..." ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Organizing</span>
            </>
          ) : (
            "Organize"
          )}
        </button>
      </div>

      <div className={`mt-3 px-2 py-2 rounded bg-zinc-900/50 border border-zinc-800 overflow-hidden ${
        status.type === "error" ? "border-red-500/30 bg-red-500/5" : ""
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
