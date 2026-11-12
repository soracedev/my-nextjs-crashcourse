import { SeverityNumber, type Logger } from "@opentelemetry/api-logs"
import type { LoggerProvider } from "@opentelemetry/sdk-logs"

const token = process.env.NEXT_PUBLIC_POSTHOG_KEY
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

let posthogLoggerProvider: LoggerProvider | null = null
let posthogLogger: Logger | null = null

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return
  }

  if (!token || !host) {
    if (process.env.NODE_ENV !== "production") {
      const missingVariable = !token
        ? "NEXT_PUBLIC_POSTHOG_KEY"
        : "NEXT_PUBLIC_POSTHOG_HOST"

      console.warn(
        `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`
      )
    }
    return
  }

  const [
    { OTLPLogExporter },
    { resourceFromAttributes },
    { BatchLogRecordProcessor, LoggerProvider },
  ] = await Promise.all([
    import("@opentelemetry/exporter-logs-otlp-http"),
    import("@opentelemetry/resources"),
    import("@opentelemetry/sdk-logs"),
  ])

  posthogLoggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({
      "service.name": "nextjscrashcourse",
    }),
    processors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({
          url: `${host.replace(/\/$/, "")}/i/v1/logs`,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      }),
    ],
  })
  posthogLogger = posthogLoggerProvider.getLogger("posthog-log-exporter")

  posthogLogger.emit({
    body: "PostHog log exporter initialized",
    severityNumber: SeverityNumber.INFO,
    attributes: { component: "posthog_log_exporter" },
  })
}

export function onRequestError() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return
  }

  posthogLogger?.emit({
    body: "Next.js request failed",
    severityNumber: SeverityNumber.ERROR,
    attributes: { component: "nextjs_request" },
  })
}
