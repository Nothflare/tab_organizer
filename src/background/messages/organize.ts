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
    onDebug("Starting organization...")

    // Step 1: Get all tabs
    onDebug("Fetching tabs...")
    const tabs = await getAllTabs()
    onDebug(`Found ${tabs.length} tabs`)

    if (tabs.length === 0) {
      return res.send({ success: false, error: "No tabs found", debug: debugLog })
    }

    // Step 2: Ungroup all existing groups first
    onDebug("Ungrouping existing groups...")
    await ungroupAllTabs()

    // Step 3: Call AI to get grouping
    onDebug("Calling AI...")
    const groups = await organizeTabsWithAI(tabs, settings, onDebug)
    onDebug(`AI returned ${groups.length} groups`)

    // Step 4: Create new groups
    onDebug("Creating groups...")
    await createTabGroups(groups)

    onDebug("Done!")
    res.send({ success: true, groupCount: groups.length, debug: debugLog })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    onDebug(`Error: ${message}`)
    res.send({ success: false, error: message, debug: debugLog })
  }
}

export default handler
