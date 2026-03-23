import { getHistoryEntries } from "@/apis"
import Content from "@/components/Content/Content"

const getEntries = (_status, _starred, filterParams) => getHistoryEntries(filterParams)
const info = { from: "history", id: "" }

const History = () => <Content getEntries={getEntries} info={info} />

export default History
