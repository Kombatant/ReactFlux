import { Button, ConfigProvider, Layout, Notification } from "@arco-design/web-react"
import deDE from "@arco-design/web-react/es/locale/de-DE"
import enUS from "@arco-design/web-react/es/locale/en-US"
import esES from "@arco-design/web-react/es/locale/es-ES"
import frFR from "@arco-design/web-react/es/locale/fr-FR"
import zhCN from "@arco-design/web-react/es/locale/zh-CN"
import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"

import "./App.css"
import Main from "./components/Main/Main"
import Sidebar from "./components/Sidebar/Sidebar"
import useFeedIconsSync from "./hooks/useFeedIconsSync"
import useLanguage, { polyglotState } from "./hooks/useLanguage"
import useScreenWidth from "./hooks/useScreenWidth"
import useTheme from "./hooks/useTheme"
import useVersionCheck from "./hooks/useVersionCheck"
import { settingsState, updateSettings } from "./store/settingsState"
import { GITHUB_REPO_PATH } from "./utils/constants"
import hideSpinner from "./utils/loading"

const localMap = {
  "de-DE": deDE,
  "es-ES": esES,
  "fr-FR": frFR,
  "zh-CN": zhCN,
}

const getLocale = (language) => localMap[language] || enUS

const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value))

const App = () => {
  useLanguage()
  useTheme()
  useFeedIconsSync()

  const { hasUpdate, dismissUpdate } = useVersionCheck()

  const { isBelowLarge } = useScreenWidth()

  const { polyglot } = useStore(polyglotState)
  const { language, sidebarWidth: storedSidebarWidth } = useStore(settingsState)
  const locale = getLocale(language)

  const [sidebarWidth, setSidebarWidth] = useState(storedSidebarWidth ?? 240)
  const [isResizingSidebar, setIsResizingSidebar] = useState(false)

  useEffect(() => {
    hideSpinner()
  }, [])

  const handleSidebarSplitterPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return
    }

    event.preventDefault()

    const startX = event.clientX
    const startWidth = sidebarWidth
    let latestWidth = startWidth

    const minWidth = 180
    const maxWidth = 480

    document.body.style.userSelect = "none"
    setIsResizingSidebar(true)

    const handlePointerMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX
      const nextWidth = clampNumber(startWidth + delta, minWidth, maxWidth)
      latestWidth = nextWidth
      setSidebarWidth(nextWidth)
    }

    const handlePointerUp = () => {
      document.body.style.userSelect = ""
      setIsResizingSidebar(false)
      updateSettings({ sidebarWidth: latestWidth })
      globalThis.removeEventListener("pointermove", handlePointerMove)
      globalThis.removeEventListener("pointerup", handlePointerUp)
    }

    globalThis.addEventListener("pointermove", handlePointerMove)
    globalThis.addEventListener("pointerup", handlePointerUp)
  }

  useEffect(() => {
    if (hasUpdate) {
      const id = "new-version-available"
      Notification.info({
        id,
        title: polyglot.t("app.new_version_available"),
        closable: false,
        content: polyglot.t("app.new_version_available_description"),
        duration: 0,
        btn: (
          <span>
            <Button
              size="small"
              style={{ marginRight: 8 }}
              type="secondary"
              onClick={() => {
                dismissUpdate()
                Notification.remove(id)
              }}
            >
              {polyglot.t("actions.dismiss")}
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={() => {
                globalThis.open(`https://github.com/${GITHUB_REPO_PATH}/commits/main`, "_blank")
                Notification.remove(id)
              }}
            >
              {polyglot.t("actions.check")}
            </Button>
          </span>
        ),
      })
    }
  }, [dismissUpdate, hasUpdate, polyglot])

  return (
    polyglot && (
      <ConfigProvider locale={locale}>
        <div
          className="app"
          style={
            isBelowLarge
              ? undefined
              : {
                  gridTemplateColumns: `${sidebarWidth}px var(--pane-splitter-size) 1fr`,
                }
          }
        >
          {isBelowLarge ? null : (
            <Layout.Sider
              breakpoint="lg"
              className="sidebar"
              collapsible={false}
              trigger={null}
              width={sidebarWidth}
            >
              <Sidebar />
            </Layout.Sider>
          )}
          {isBelowLarge ? null : (
            <div
              aria-label="Resize sidebar"
              aria-orientation="vertical"
              role="separator"
              className={
                isResizingSidebar
                  ? "pane-splitter app-splitter is-dragging"
                  : "pane-splitter app-splitter"
              }
              onPointerDown={handleSidebarSplitterPointerDown}
            />
          )}
          <Main />
        </div>
      </ConfigProvider>
    )
  )
}

export default App
