import type { TabInfo, TabGroup } from "./types"

export async function getAllTabs(): Promise<TabInfo[]> {
  const tabs = await chrome.tabs.query({ currentWindow: true })
  return tabs
    .filter((tab) => tab.id !== undefined && tab.url)
    .map((tab) => ({
      id: tab.id!,
      title: tab.title || "Untitled",
      url: tab.url || ""
    }))
}

export async function ungroupAllTabs(): Promise<void> {
  const currentWindow = await chrome.windows.getCurrent()
  const groups = await chrome.tabGroups.query({ windowId: currentWindow.id })

  // Collect all tab IDs from all groups in parallel
  const tabsPerGroup = await Promise.all(
    groups.map(group => chrome.tabs.query({ groupId: group.id }))
  )
  const tabIds = tabsPerGroup
    .flat()
    .map(tab => tab.id)
    .filter((id): id is number => id !== undefined)

  // Ungroup all tabs at once
  if (tabIds.length > 0) {
    await chrome.tabs.ungroup(tabIds)
  }
}

export interface CreateGroupsOptions {
  collapseOthers?: boolean
  activeTabId?: number
}

export async function createTabGroups(
  groups: TabGroup[],
  options: CreateGroupsOptions = {}
): Promise<void> {
  const { collapseOthers = false, activeTabId } = options

  for (const group of groups) {
    if (group.tabIds.length === 0) continue

    const groupId = await chrome.tabs.group({ tabIds: group.tabIds })

    // Determine if this group should be collapsed
    // If collapseOthers is enabled, collapse all groups except the one containing the active tab
    const containsActiveTab = activeTabId !== undefined && group.tabIds.includes(activeTabId)
    const shouldCollapse = collapseOthers && !containsActiveTab

    await chrome.tabGroups.update(groupId, {
      title: group.name,
      color: group.color,
      collapsed: shouldCollapse
    })
  }
}

