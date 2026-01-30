import { useStore } from "@nanostores/react"
import { ofetch } from "ofetch"
import { useEffect, useState } from "react"

import { dataState } from "@/store/dataState"
import { GITHUB_REPO_PATH, UPDATE_NOTIFICATION_KEY } from "@/utils/constants"
import { checkIsInLast24Hours, getTimestamp } from "@/utils/date"
import buildInfo from "@/version-info.json"

function useVersionCheck() {
  const { isAppDataReady } = useStore(dataState)

  const [hasUpdate, setHasUpdate] = useState(false)

  const dismissUpdate = () => {
    localStorage.setItem(UPDATE_NOTIFICATION_KEY, getTimestamp().toString())
    setHasUpdate(false)
  }

  useEffect(() => {
    if (!isAppDataReady || import.meta.env.DEV) {
      return
    }

    const checkUpdate = async () => {
      try {
        const lastDismissed = localStorage.getItem(UPDATE_NOTIFICATION_KEY)
        if (lastDismissed && checkIsInLast24Hours(lastDismissed)) {
          return
        }

        const remoteVersionInfoUrl = `https://raw.githubusercontent.com/${GITHUB_REPO_PATH}/main/src/version-info.json`
        const remoteBuildInfo = await ofetch(remoteVersionInfoUrl, {
          cache: "no-store",
        })

        if (buildInfo.gitHash && remoteBuildInfo.gitHash) {
          setHasUpdate(buildInfo.gitHash !== remoteBuildInfo.gitHash)
          return
        }

        const currentGitTimestamp = getTimestamp(buildInfo.gitDate)
        const latestGitTimestamp = getTimestamp(remoteBuildInfo.gitDate)

        setHasUpdate(currentGitTimestamp < latestGitTimestamp)
      } catch (error) {
        console.error("Check update failed", error)
      }
    }

    checkUpdate()
  }, [isAppDataReady])

  return { hasUpdate, dismissUpdate }
}

export default useVersionCheck
