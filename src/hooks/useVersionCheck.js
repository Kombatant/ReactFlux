import { useStore } from "@nanostores/react"
import { ofetch } from "ofetch"
import { useEffect, useState } from "react"

import { dataState } from "@/store/dataState"
import { GITHUB_REPO_PATH, UPDATE_NOTIFICATION_KEY } from "@/utils/constants"
import { checkIsInLast24Hours, getTimestamp } from "@/utils/date"
import buildInfo from "@/version-info.json"

const DEFAULT_REMOTE_VERSION_INFO_URL = `https://raw.githubusercontent.com/${GITHUB_REPO_PATH}/main/src/version-info.json`

const isVersionCheckDebugEnabled = () => {
  const rawValue = import.meta.env.VITE_VERSION_CHECK_DEBUG
  if (typeof rawValue !== "string") {
    return false
  }

  const normalizedValue = rawValue.trim().toLowerCase()
  return ["1", "true", "yes", "on"].includes(normalizedValue)
}

const logVersionCheckDebug = (payload) => {
  if (!isVersionCheckDebugEnabled()) {
    return
  }

  console.info("[version-check]", payload)
}

const getRemoteVersionInfoUrl = () => {
  const configuredUrl = import.meta.env.VITE_VERSION_INFO_URL
  const baseUrl = configuredUrl || DEFAULT_REMOTE_VERSION_INFO_URL

  try {
    const url = new URL(baseUrl)
    url.searchParams.set("_", Date.now().toString())
    return url.toString()
  } catch {
    const separator = baseUrl.includes("?") ? "&" : "?"
    return `${baseUrl}${separator}_=${Date.now()}`
  }
}

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
          logVersionCheckDebug({
            reason: "dismissed_in_last_24_hours",
            lastDismissed,
          })
          return
        }

        const remoteVersionInfoUrl = getRemoteVersionInfoUrl()
        const remoteBuildInfo = await ofetch(remoteVersionInfoUrl, {
          cache: "no-store",
        })

        const currentGitTimestamp = getTimestamp(buildInfo.gitDate)
        const latestGitTimestamp = getTimestamp(remoteBuildInfo.gitDate)
        const hasValidDates =
          Number.isFinite(currentGitTimestamp) && Number.isFinite(latestGitTimestamp)

        if (hasValidDates) {
          const hasUpdateByDate = currentGitTimestamp < latestGitTimestamp
          setHasUpdate(hasUpdateByDate)
          logVersionCheckDebug({
            reason: "date_comparison",
            hasUpdate: hasUpdateByDate,
            remoteVersionInfoUrl,
            local: buildInfo,
            remote: remoteBuildInfo,
            currentGitTimestamp,
            latestGitTimestamp,
          })
          return
        }

        if (buildInfo.gitHash && remoteBuildInfo.gitHash) {
          const hasUpdateByHash = buildInfo.gitHash !== remoteBuildInfo.gitHash
          setHasUpdate(hasUpdateByHash)
          logVersionCheckDebug({
            reason: "hash_fallback",
            hasUpdate: hasUpdateByHash,
            remoteVersionInfoUrl,
            local: buildInfo,
            remote: remoteBuildInfo,
          })
          return
        }

        setHasUpdate(false)
        logVersionCheckDebug({
          reason: "insufficient_version_data",
          hasUpdate: false,
          remoteVersionInfoUrl,
          local: buildInfo,
          remote: remoteBuildInfo,
        })
      } catch (error) {
        console.error("Check update failed", error)
        logVersionCheckDebug({
          reason: "request_failed",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    checkUpdate()
  }, [isAppDataReady])

  return { hasUpdate, dismissUpdate }
}

export default useVersionCheck
