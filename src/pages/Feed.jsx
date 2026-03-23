import { partial } from "lodash-es"
import { useCallback, useMemo } from "react"
import { useParams } from "react-router"

import { getFeedEntries, markFeedAsRead } from "@/apis"
import Content from "@/components/Content/Content"

const Feed = () => {
  const { id: feedId } = useParams()

  const getEntries = useMemo(() => partial(getFeedEntries, feedId), [feedId])
  const info = useMemo(() => ({ from: "feed", id: feedId }), [feedId])
  const markAllAsRead = useCallback(() => markFeedAsRead(feedId), [feedId])

  return <Content getEntries={getEntries} info={info} markAllAsRead={markAllAsRead} />
}

export default Feed
