import { useEffect, useState } from "react"
import { getSettings, saveSettings } from "~/lib/storage"
import type { Settings } from "~/lib/types"
import { Button } from "~/components/ui/button"
import { Switch } from "~/components/ui/switch"
import "~/style.css"

function Options() {
  const [settings, setSettings] = useState<Settings>({
    apiEndpoint: "https://api.openai.com/v1",
    apiKey: "",
    model: "gpt-4o",
    debugMode: false,
    collapseGroups: false
  })
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  const handleSave = async () => {
    await saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-xl font-medium">Tab Organizer Settings</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              API Endpoint
            </label>
            <input
              type="text"
              value={settings.apiEndpoint}
              onChange={(e) => updateSetting("apiEndpoint", e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-sm focus:outline-none focus:border-zinc-700"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Compatible with OpenAI, Ollama, OpenRouter, etc.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">API Key</label>
            <div className="flex gap-2">
              <input
                type={showKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={(e) => updateSetting("apiKey", e.target.value)}
                placeholder="sk-..."
                className="flex-1 h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-sm focus:outline-none focus:border-zinc-700"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="px-3 h-10 text-xs text-zinc-400 hover:text-zinc-300 border border-zinc-800 rounded-md"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Model</label>
            <input
              type="text"
              value={settings.model}
              onChange={(e) => updateSetting("model", e.target.value)}
              placeholder="gpt-4o"
              className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-sm focus:outline-none focus:border-zinc-700"
            />
            <p className="text-xs text-zinc-500 mt-1">
              e.g. openai/gpt-5-mini, x-ai/grok-4.1-fast, anthropic/claude-sonnet-4.5, etc.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Switch
              id="collapseGroups"
              checked={settings.collapseGroups}
              onCheckedChange={(checked) => updateSetting("collapseGroups", checked)}
            />
            <div className="flex flex-col gap-0.5">
              <label htmlFor="collapseGroups" className="text-sm cursor-pointer">
                Collapse other groups after organizing
              </label>
              <p className="text-xs text-zinc-500">
                Keep only the active tab's group expanded for a cleaner view
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="debug"
              checked={settings.debugMode}
              onCheckedChange={(checked) => updateSetting("debugMode", checked)}
            />
            <label htmlFor="debug" className="text-sm cursor-pointer">
              Enable debug logging
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave}>Save</Button>
          {saved && <span className="text-sm text-green-400">Saved</span>}
        </div>
      </div>
    </div>
  )
}

export default Options
