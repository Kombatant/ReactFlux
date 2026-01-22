export const AI_PROVIDERS = {
  NONE: "none",
  ANTHROPIC: "anthropic",
  GEMINI: "gemini",
  PERPLEXITY: "perplexity",
}

const normalizeGeminiModel = (model) => model?.replace(/^models\//, "")

const parseJsonSafely = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

const parseErrorMessage = (data, fallback) => {
  if (!data) {
    return fallback
  }
  return data?.error?.message || data?.message || fallback
}

export const fetchProviderModels = async (provider, apiKey) => {
  if (!apiKey) {
    return []
  }

  if (provider === AI_PROVIDERS.ANTHROPIC) {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    })
    const data = await parseJsonSafely(response)
    if (!response.ok) {
      throw new Error(parseErrorMessage(data, response.statusText))
    }
    return (data?.models || []).map((model) => model?.id).filter(Boolean)
  }

  if (provider === AI_PROVIDERS.GEMINI) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    )
    const data = await parseJsonSafely(response)
    if (!response.ok) {
      throw new Error(parseErrorMessage(data, response.statusText))
    }
    return (data?.models || [])
      .filter((model) => (model?.supportedGenerationMethods || []).includes("generateContent"))
      .map((model) => normalizeGeminiModel(model?.name))
      .filter((name) => name && name.includes("gemini") && !name.includes("embedding"))
  }

  if (provider === AI_PROVIDERS.PERPLEXITY) {
    const fallbackModels = ["sonar", "sonar-pro", "sonar-reasoning"]
    try {
      const response = await fetch("https://api.perplexity.ai/models", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      })
      const data = await parseJsonSafely(response)
      if (!response.ok) {
        return fallbackModels
      }
      const models = data?.data || data?.models || data?.result || []
      const parsedModels = models
        .map((model) => {
          if (typeof model === "string") {
            return model
          }
          return model?.id || model?.name
        })
        .filter(Boolean)
      return parsedModels.length > 0 ? parsedModels : fallbackModels
    } catch {
      return fallbackModels
    }
  }

  return []
}

const buildSummaryPrompt = (title, content) => {
  const trimmedTitle = title?.trim()
  const titleLine = trimmedTitle ? `Title: ${trimmedTitle}\n` : ""
  return (
    "Summarize the following article in 5-7 concise bullet points. " +
    "Focus on key facts and outcomes.\n\n" +
    `${titleLine}Content:\n${content}`
  )
}

const extractAnthropicText = (data) => {
  const segments = data?.content || []
  return segments
    .map((segment) => segment?.text)
    .filter(Boolean)
    .join("\n")
}

const extractGeminiText = (data) => {
  const parts = data?.candidates?.[0]?.content?.parts || []
  return parts
    .map((part) => part?.text)
    .filter(Boolean)
    .join("\n")
}

const extractPerplexityText = (data) => data?.choices?.[0]?.message?.content || ""

export const summarizeWithProvider = async ({ provider, apiKey, model, title, content }) => {
  if (provider === AI_PROVIDERS.ANTHROPIC) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1800,
        messages: [{ role: "user", content: buildSummaryPrompt(title, content) }],
      }),
    })
    const data = await parseJsonSafely(response)
    if (!response.ok) {
      throw new Error(parseErrorMessage(data, response.statusText))
    }
    return extractAnthropicText(data)
  }

  if (provider === AI_PROVIDERS.GEMINI) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: buildSummaryPrompt(title, content) }],
            },
          ],
          generationConfig: { maxOutputTokens: 1800 },
        }),
      },
    )
    const data = await parseJsonSafely(response)
    if (!response.ok) {
      throw new Error(parseErrorMessage(data, response.statusText))
    }
    return extractGeminiText(data)
  }

  if (provider === AI_PROVIDERS.PERPLEXITY) {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1800,
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: buildSummaryPrompt(title, content) },
        ],
      }),
    })
    const data = await parseJsonSafely(response)
    if (!response.ok) {
      throw new Error(parseErrorMessage(data, response.statusText))
    }
    return extractPerplexityText(data)
  }

  throw new Error("unsupported_provider")
}

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

const buildListFromLines = (lines) =>
  `<ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`

const buildParagraphs = (text) =>
  text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replaceAll("\n", " ").trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("")

export const formatSummaryHtml = (summaryText, heading) => {
  const normalized = summaryText.trim()
  if (!normalized) {
    return ""
  }

  const lines = normalized
    .split("\n")
    .map((line) => line.replace(/^[•\-*]\s?/, "").trim())
    .filter(Boolean)

  const isList = lines.length > 1
  const bodyHtml = isList ? buildListFromLines(lines) : buildParagraphs(normalized)
  return `<section class="ai-summary"><h2>${escapeHtml(heading)}</h2>${bodyHtml}</section>`
}
