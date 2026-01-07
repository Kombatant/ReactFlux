import { Button, Divider, InputNumber, Notification, Select, Switch } from "@arco-design/web-react"
import { IconDownload, IconUpload } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useState } from "react"

import SettingItem from "./SettingItem"
import "./SettingItem.css"

import { exportOPML, importOPML } from "@/apis"
import { polyglotState } from "@/hooks/useLanguage"
import { settingsState, updateSettings } from "@/store/settingsState"

const readFileAsText = async (file) => {
  try {
    return await file.text()
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`)
  }
}

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type })
  const url = globalThis.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  globalThis.URL.revokeObjectURL(url)
}

const Content = () => {
  const { polyglot } = useStore(polyglotState)
  const settings = useStore(settingsState)

  const [importing, setImporting] = useState(false)

  const handleExport = async () => {
    try {
      const opmlContent = await exportOPML()
      downloadFile(opmlContent, "feeds.opml", "text/xml")
      Notification.success({ title: polyglot.t("sidebar.export_opml_success") })
    } catch {
      Notification.error({ title: polyglot.t("sidebar.export_opml_error") })
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) {
      return
    }

    setImporting(true)
    try {
      const fileContent = await readFileAsText(file)
      const response = await importOPML(fileContent)
      if (response.status === 201) {
        Notification.success({ title: polyglot.t("sidebar.import_opml_success") })
      } else {
        Notification.error({ title: polyglot.t("sidebar.import_opml_error") })
      }
    } catch (error) {
      Notification.error({ title: polyglot.t("sidebar.import_opml_error"), content: error.message })
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <SettingItem
        description={polyglot.t("settings.content.show_hidden_description")}
        title={polyglot.t("sidebar.show_hidden_feeds")}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Switch
            checked={settings.showHiddenFeeds}
            onChange={(value) => updateSettings({ showHiddenFeeds: value })}
          />
        </div>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.content.feeds_show_unread_description")}
        title={polyglot.t("settings.content.feeds_show_unread_label")}
      >
        <Switch
          checked={settings.showUnreadFeedsOnly}
          onChange={(value) => updateSettings({ showUnreadFeedsOnly: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem title={polyglot.t("settings.content.import_export_label")}>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            icon={<IconUpload />}
            onClick={() => document.querySelector("#contentOpmlInput").click()}
          >
            {polyglot.t("sidebar.import_opml")}
          </Button>
          <input
            accept=".opml,.xml"
            disabled={importing}
            id="contentOpmlInput"
            style={{ display: "none" }}
            type="file"
            onChange={handleImport}
          />
          <Button icon={<IconDownload />} onClick={handleExport}>
            {polyglot.t("sidebar.export_opml")}
          </Button>
        </div>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.content.title_alignment_description")}
        title={polyglot.t("appearance.title_alignment_label")}
      >
        <Select
          className="input-select"
          value={settings.titleAlignment}
          onChange={(value) => updateSettings({ titleAlignment: value })}
        >
          <Select.Option value="left">
            {polyglot.t("appearance.title_alignment_left") || "Left"}
          </Select.Option>
          <Select.Option value="center">
            {polyglot.t("appearance.title_alignment_center") || "Center"}
          </Select.Option>
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        title={
          polyglot.t("settings.content.article_font_size_label") ||
          polyglot.t("appearance.font_size_label")
        }
      >
        <InputNumber
          className="input-select"
          max={1.25}
          min={0.75}
          size="small"
          step={0.05}
          style={{ width: 120 }}
          suffix="rem"
          value={settings.fontSize}
          onChange={(value) => updateSettings({ fontSize: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem title={polyglot.t("appearance.article_width_label")}>
        <InputNumber
          className="input-select"
          max={90}
          min={50}
          size="small"
          step={5}
          style={{ width: 120 }}
          suffix="%"
          value={settings.articleWidth}
          onChange={(value) => updateSettings({ articleWidth: value })}
        />
      </SettingItem>
    </>
  )
}

export default Content
