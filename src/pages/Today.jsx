import { getTodayEntries, updateEntriesStatus } from "@/apis"
import Content from "@/components/Content/Content"

const getEntries = (status, _starred, filterParams) => getTodayEntries(status, filterParams)
const info = { from: "today", id: "" }

const markTodayAsRead = async () => {
  const unreadResponse = await getTodayEntries("unread")
  const unreadCount = unreadResponse.total
  let unreadEntries = unreadResponse.entries

  if (unreadCount > unreadEntries.length) {
    unreadEntries = getTodayEntries("unread", { limit: unreadCount }).then(
      (response) => response.entries,
    )
  }

  const unreadEntryIds = unreadEntries.map((entry) => entry.id)
  return updateEntriesStatus(unreadEntryIds, "read")
}

const Today = () => {
  return <Content getEntries={getEntries} info={info} markAllAsRead={markTodayAsRead} />
}

export default Today
