import { getAllEntries, markAllAsRead } from "@/apis"
import Content from "@/components/Content/Content"

const getEntries = (status, _starred, filterParams) => getAllEntries(status, filterParams)
const info = { from: "all", id: "" }

const All = () => <Content getEntries={getEntries} info={info} markAllAsRead={markAllAsRead} />

export default All
