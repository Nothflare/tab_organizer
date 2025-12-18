import type { PlasmoMessaging } from "@plasmohq/messaging"
import type { TaskState } from "~/lib/types"
import { getTaskState } from "~/background/taskManager"

export type GetTaskStatusRequest = {
  action: "getTaskStatus"
}

export type GetTaskStatusResponse = {
  state: TaskState
}

const handler: PlasmoMessaging.MessageHandler<
  GetTaskStatusRequest,
  GetTaskStatusResponse
> = async (req, res) => {
  const state = await getTaskState()
  res.send({ state })
}

export default handler
