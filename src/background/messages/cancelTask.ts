import type { PlasmoMessaging } from "@plasmohq/messaging"
import { cancelTask, isRunning } from "~/background/taskManager"

export type CancelTaskRequest = {
  action: "cancelTask"
}

export type CancelTaskResponse = {
  success: boolean
  error?: string
}

const handler: PlasmoMessaging.MessageHandler<
  CancelTaskRequest,
  CancelTaskResponse
> = async (req, res) => {
  if (!(await isRunning())) {
    res.send({ success: false, error: "No task running" })
    return
  }

  const cancelled = await cancelTask()
  res.send({ success: cancelled })
}

export default handler
