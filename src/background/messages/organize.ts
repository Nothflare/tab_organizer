import type { PlasmoMessaging } from "@plasmohq/messaging"
import { getAllTabs, ungroupAllTabs, createTabGroups } from "~/lib/tabs"
import { getSettings } from "~/lib/storage"
import { organizeTabsWithAI } from "~/lib/api"

export type OrganizeRequest = {
  action: "organize"
}

export type OrganizeResponse = {
  success: boolean
  groupCount?: number
  error?: string
  debug?: string[]
}

const handler: PlasmoMessaging.MessageHandler<OrganizeRequest, OrganizeResponse> = async (req, res) => {
  const debugLog: string[] = []
  const settings = await getSettings()

  const onDebug = (msg: string) => {
    if (settings.debugMode) {
      debugLog.push(msg)
    }
  }

  try {
    // Validate API configuration
    if (!settings.apiKey || !settings.apiEndpoint) {
      return res.send({
        success: false,
        error: "Please configure API settings in the extension options",
        debug: debugLog
      })
    }

    onDebug("Starting organization...")

    // Step 1: Get all tabs and the active tab ID (before any modifications)
    onDebug("Fetching tabs...")
    const tabs = await getAllTabs()
    onDebug(`Found ${tabs.length} tabs`)

    if (tabs.length === 0) {
      return res.send({ success: false, error: "No tabs found", debug: debugLog })
    }

    // Get the active tab ID before any changes
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const activeTabId = activeTab?.id
    onDebug(`Active tab ID: ${activeTabId ?? "none"}`)

    // Step 2: Ungroup all existing groups first
    onDebug("Ungrouping existing groups...")
    await ungroupAllTabs()

    // Step 3: Call AI to get grouping
    onDebug("Calling AI...")
    const groups = await organizeTabsWithAI(tabs, settings, onDebug)
    onDebug(`AI returned ${groups.length} groups`)

    // Step 4: Create new groups with correct collapsed state
    onDebug("Creating groups...")
    if (settings.collapseGroups) {
      onDebug("Collapse others enabled, active tab's group will stay expanded")
    }
    await createTabGroups(groups, {
      collapseOthers: settings.collapseGroups,
      activeTabId
    })

    onDebug("Done!")
    res.send({ success: true, groupCount: groups.length, debug: debugLog })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    onDebug(`Error: ${message}`)
    res.send({ success: false, error: message, debug: debugLog })
  }
}

export default handler
