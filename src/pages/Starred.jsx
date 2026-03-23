import { getStarredEntries } from "@/apis"
import Content from "@/components/Content/Content"

const getEntries = (status, _starred, filterParams) => getStarredEntries(status, filterParams)
const info = { from: "starred", id: "" }

const Starred = () => <Content getEntries={getEntries} info={info} />

export default Starred
