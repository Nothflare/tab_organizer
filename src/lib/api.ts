import type { Settings, TabInfo, AIResponse, TabGroup } from "./types"

const SYSTEM_PROMPT = `You are a browser tab organizer. Create precise, task-focused groups.

Guidelines:
- Create SPECIFIC groups (e.g. "🛠️ React Debugging" not "💻 Development")
- Prefer more smaller groups over fewer large ones
- Split by distinct tasks/topics, even within same domain
- Max 6-8 tabs per group - split larger sets by subtask
- ALWAYS prefix names with relevant emoji
- Every tab must be in exactly one group

Return ONLY valid JSON:
{"groups":[{"name":"💻 Work","color":"blue","tabIds":[0,1,2]}]}

Colors: grey, blue, red, yellow, green, pink, purple, cyan, orange`

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const pathSegments = parsed.pathname.split("/").filter(Boolean)
    const firstPath = pathSegments.length > 0 ? `/${pathSegments[0]}` : ""
    return `${parsed.origin}${firstPath}`
  } catch {
    return url
  }
}

interface TabMapping {
  indexToId: Map<number, number>
  idToIndex: Map<number, number>
}

function createTabMapping(tabs: TabInfo[]): TabMapping {
  const indexToId = new Map<number, number>()
  const idToIndex = new Map<number, number>()
  tabs.forEach((tab, index) => {
    indexToId.set(index, tab.id)
    idToIndex.set(tab.id, index)
  })
  return { indexToId, idToIndex }
}

function buildUserPrompt(tabs: TabInfo[]): string {
  // Use short indices (0, 1, 2...) instead of actual tab IDs to minimize LLM output
  const tabList = tabs
    .map((t, index) => `${index}: "${t.title}" | ${sanitizeUrl(t.url)}`)
    .join("\n")
  return `Organize these tabs:\n\n${tabList}`
}

const VALID_COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"] as const

function parseResponse(text: string, mapping: TabMapping): TabGroup[] {
  // Extract JSON from response (handles markdown code blocks)
  let jsonStr = text
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim()
  }

  let parsed: AIResponse
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error("AI returned invalid JSON. Try again or enable debug mode.")
  }

  if (!parsed.groups || !Array.isArray(parsed.groups)) {
    throw new Error("Invalid response: missing groups array")
  }

  return parsed.groups.map((group) => ({
    name: group.name || "Unnamed",
    color: VALID_COLORS.includes(group.color as any) ? group.color : "grey",
    // Map indices back to actual tab IDs, skip any unknown indices
    tabIds: (group.tabIds || [])
      .map((index) => mapping.indexToId.get(index))
      .filter((id): id is number => id !== undefined)
  }))
}

export async function organizeTabsWithAI(
  tabs: TabInfo[],
  settings: Settings,
  options?: { signal?: AbortSignal; onDebug?: (msg: string) => void }
): Promise<TabGroup[]> {
  const { signal, onDebug } = options ?? {}
  const { apiEndpoint, apiKey, model, reasoningEffort } = settings
  const mapping = createTabMapping(tabs)

  const requestBody: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(tabs) }
    ],
    temperature: 0.3
  }

  // Add reasoning_effort for thinking models (ignored by non-thinking models)
  if (reasoningEffort && reasoningEffort !== "off") {
    requestBody.reasoning_effort = reasoningEffort
  }

  onDebug?.(`Request to ${apiEndpoint}/chat/completions`)
  onDebug?.(`Model: ${model}`)
  onDebug?.(`Tabs: ${tabs.length}`)
  if (reasoningEffort && reasoningEffort !== "off") {
    onDebug?.(`Reasoning: ${reasoningEffort}`)
  }

  const response = await fetch(`${apiEndpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody),
    signal
  })

  if (!response.ok) {
    const errorText = await response.text()
    onDebug?.(`Error: ${response.status} - ${errorText}`)
    // Don't expose full error details to UI - may contain sensitive info
    const statusMessages: Record<number, string> = {
      401: "Invalid API key",
      403: "Access denied - check API key permissions",
      429: "Rate limited - please wait and try again",
      500: "API server error - try again later",
      503: "API service unavailable - try again later"
    }
    throw new Error(statusMessages[response.status] || `API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error("No content in API response")
  }

  onDebug?.(`Response: ${content}`)

  return parseResponse(content, mapping)
}
