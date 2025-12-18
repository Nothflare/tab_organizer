import type { PlasmoMessaging } from "@plasmohq/messaging"
import { resetToIdle, isRunning } from "~/background/taskManager"

export type ResetTaskRequest = {
  action: "resetTask"
}

export type ResetTaskResponse = {
  success: boolean
}

const handler: PlasmoMessaging.MessageHandler<
  ResetTaskRequest,
  ResetTaskResponse
> = async (req, res) => {
  if (await isRunning()) {
    res.send({ success: false }) // Cannot reset while running
    return
  }
  await resetToIdle()
  res.send({ success: true })
}

export default handler
