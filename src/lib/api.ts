import type { Settings, TabInfo, AIResponse, TabGroup } from "./types"

const SYSTEM_PROMPT = `You are a browser tab organizer. Analyze tabs by their URLs and titles to understand their content and purpose, then organize them into logical task-focused groups.

Common groupings:
- 💻 Work/Development - GitHub, docs, Stack Overflow, IDEs
- 🔬 Research - Articles, papers, tutorials, learning resources
- 💬 Communication - Email, Slack, Discord, messaging
- 🎮 Social/Entertainment - YouTube, Twitter, Reddit, news
- 🛒 Shopping/Finance - Amazon, banking, shopping sites
- 📚 Reference - Documentation, API references, wikis
- 📦 Misc - Anything that doesn't fit elsewhere

Guidelines:
- Group by task/purpose, not by domain
- ALWAYS prefix group names with a relevant emoji
- Use descriptive group names based on actual content
- Assign distinct colors to each group for visual clarity
- Every tab must be assigned to exactly one group

Return ONLY valid JSON in this exact format:
{
  "groups": [
    {"name": "💻 Work", "color": "blue", "tabIds": [1, 2, 3]}
  ]
}

Available colors: grey, blue, red, yellow, green, pink, purple, cyan, orange`

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

function buildUserPrompt(tabs: TabInfo[]): string {
  const tabList = tabs
    .map((t) => `ID: ${t.id} | Title: "${t.title}" | URL: ${sanitizeUrl(t.url)}`)
    .join("\n")
  return `Organize these tabs:\n\n${tabList}`
}

const VALID_COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"] as const

function parseResponse(text: string, validTabIds: Set<number>): TabGroup[] {
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
    tabIds: (group.tabIds || []).filter((id) => validTabIds.has(id))
  }))
}

export async function organizeTabsWithAI(
  tabs: TabInfo[],
  settings: Settings,
  options?: { signal?: AbortSignal; onDebug?: (msg: string) => void }
): Promise<TabGroup[]> {
  const { signal, onDebug } = options ?? {}
  const { apiEndpoint, apiKey, model } = settings
  const validTabIds = new Set(tabs.map((t) => t.id))

  const requestBody = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(tabs) }
    ],
    temperature: 0.3
  }

  onDebug?.(`Request to ${apiEndpoint}/chat/completions`)
  onDebug?.(`Model: ${model}`)
  onDebug?.(`Tabs: ${tabs.length}`)

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

  return parseResponse(content, validTabIds)
}
