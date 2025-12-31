import { NextResponse } from "next/server";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.status === 429) {
      const waitTime = attempt * 5000;
      if (attempt < maxRetries) {
        await delay(waitTime);
        continue;
      }
    }
    return response;
  }
}

export async function POST(request) {
  try {
    const { url: jobUrl } = await request.json();

    if (!jobUrl) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const promptText = "Analyze this job posting URL for a fair-chance employment program serving people with criminal backgrounds: " + jobUrl + "\n\nIMPORTANT: Use web search to fetch and analyze the actual job posting content.\n\nRespond ONLY with a JSON object (no markdown, no backticks) with these exact fields:\n{\n  \"isLegitimate\": true or false,\n  \"legitimacyReason\": \"brief explanation\",\n  \"jobTitle\": \"exact job title\",\n  \"company\": \"company name\",\n  \"location\": \"city, state\",\n  \"directApplicationUrl\": \"direct apply link if different or same URL\",\n  \"grade\": \"best or better or good or fair or poor\",\n  \"gradeReason\": \"explanation\",\n  \"experienceCategory\": \"construction or warehouse or transportation or foodservice or hospitality or custodial or other\",\n  \"ceoMatch\": \"explanation of why this job matches CEO Fresno participant skills\",\n  \"salary\": \"salary if listed\",\n  \"requiresDiploma\": true or false,\n  \"requiresLicense\": true or false,\n  \"datePosted\": \"YYYY-MM-DD format\",\n  \"expirationDate\": \"YYYY-MM-DD or null\"\n}";

    const response = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: promptText }]
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json({
          error: "Rate limited",
          troubleshoot: "Too many requests. Wait 30 seconds and try again."
        }, { status: 429 });
      }
      return NextResponse.json({
        error: "API request failed",
        troubleshoot: "Server returned " + response.status + ". Try again."
      }, { status: response.status });
    }

    const data = await response.json();

    let analysisText = "";
    for (const block of data.content) {
      if (block.type === "text") {
        analysisText += block.text;
      }
    }

    if (!analysisText.trim()) {
      return NextResponse.json({
        error: "Empty response",
        troubleshoot: "The page may be blocked or require login",
        canAddAnyway: true
      });
    }

    let analysis;
    try {
      const cleanJson = analysisText.replace(/```json|```/g, "").trim();
      analysis = JSON.parse(cleanJson);
    } catch (parseErr) {
      return NextResponse.json({
        error: "Failed to parse response",
        troubleshoot: "Try the direct employer page instead of a job board.",
        canAddAnyway: true
      });
    }

    if (!analysis.isLegitimate) {
      return NextResponse.json({
        error: "Flagged as not legitimate",
        troubleshoot: analysis.legitimacyReason || "Posting may be expired",
        canAddAnyway: true
      });
    }

    const job = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      url: jobUrl,
      directUrl: analysis.directApplicationUrl || jobUrl,
      title: analysis.jobTitle || "Unknown Position",
      company: analysis.company || "Unknown Company",
      location: analysis.location || "Location not specified",
      grade: analysis.grade || "good",
      gradeReason: analysis.gradeReason || "",
      category: analysis.experienceCategory || "other",
      ceoMatch: analysis.ceoMatch || "",
      salary: analysis.salary || "Not listed",
      requiresDiploma: analysis.requiresDiploma || false,
      requiresLicense: analysis.requiresLicense || false,
      datePosted: analysis.datePosted || new Date().toISOString().split("T")[0],
      expirationDate: analysis.expirationDate || null,
      submittedAt: new Date().toISOString(),
      submittedBy: "CEO Fresno Staff",
      needsReview: false
    };

    return NextResponse.json({ success: true, job: job });

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({
      error: "Server error",
      troubleshoot: "An unexpected error occurred. Please try again.",
      canAddAnyway: true
    }, { status: 500 });
  }
}
