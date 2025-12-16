export interface Settings {
  apiEndpoint: string
  apiKey: string
  model: string
  debugMode: boolean
  collapseGroups: boolean
}

export interface TabInfo {
  id: number
  title: string
  url: string
}

export interface TabGroup {
  name: string
  color: chrome.tabGroups.ColorEnum
  tabIds: number[]
}

export interface AIResponse {
  groups: TabGroup[]
}

export type Status =
  | { type: "idle" }
  | { type: "progress"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string; details?: string }
