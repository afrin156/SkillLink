export function buildUTMLink(
  externalUrl: string,
  jobId: string,
  jobTitle: string
): string {
  try {
    const url = new URL(externalUrl)
    url.searchParams.set("utm_source", "skilllink")
    url.searchParams.set("utm_medium", "job_portal")
    url.searchParams.set("utm_campaign", jobId)
    url.searchParams.set("utm_content", jobTitle.replace(/\s+/g, "_").toLowerCase())
    return url.toString()
  } catch {
    return externalUrl // return original if URL is invalid
  }
}