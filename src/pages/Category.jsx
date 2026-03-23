import { partial } from "lodash-es"
import { useCallback, useMemo } from "react"
import { useParams } from "react-router"

import { getCategoryEntries, markCategoryAsRead } from "@/apis"
import Content from "@/components/Content/Content"

const Category = () => {
  const { id: categoryId } = useParams()

  const getEntries = useMemo(() => partial(getCategoryEntries, categoryId), [categoryId])
  const info = useMemo(() => ({ from: "category", id: categoryId }), [categoryId])
  const markAllAsRead = useCallback(() => markCategoryAsRead(categoryId), [categoryId])

  return <Content getEntries={getEntries} info={info} markAllAsRead={markAllAsRead} />
}

export default Category
