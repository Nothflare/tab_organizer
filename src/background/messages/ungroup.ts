import type { PlasmoMessaging } from "@plasmohq/messaging"
import { ungroupAllTabs } from "~/lib/tabs"

export type UngroupRequest = {
  action: "ungroup"
}

export type UngroupResponse = {
  success: boolean
  error?: string
}

const handler: PlasmoMessaging.MessageHandler<UngroupRequest, UngroupResponse> = async (req, res) => {
  try {
    await ungroupAllTabs()
    res.send({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    res.send({ success: false, error: message })
  }
}

export default handler
