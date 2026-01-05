import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { url: jobUrl, description } = await request.json();

    if (!jobUrl || !description) {
      return NextResponse.json({ error: "URL and description are required" }, { status: 400 });
    }

    const promptText = "Analyze this job posting for a fair-chance employment program serving people with criminal backgrounds.\n\nJob URL: " + jobUrl + "\n\nJob Description:\n" + description + "\n\nBased on the job description provided, respond ONLY with a JSON object (no markdown, no backticks) with these exact fields:\n{\n  \"jobTitle\": \"exact job title\",\n  \"company\": \"company name\",\n  \"location\": \"city, state\",\n  \"grade\": \"best or better or good or fair or poor\",\n  \"gradeReason\": \"explanation based on: best=fair chance encouraged, better=has EEO statement, good=no background check mentioned, fair=background check but only certain felonies disqualify, poor=strict background requirements\",\n  \"experienceCategory\": \"construction or warehouse or transportation or foodservice or hospitality or custodial or other\",\n  \"ceoMatch\": \"explanation of why this job matches CEO Fresno participant skills (mention relevant certifications like OSHA, forklift, CDL, food handler if applicable)\",\n  \"salary\": \"salary if listed\",\n  \"requiresDiploma\": true or false,\n  \"requiresLicense\": true or false\n}";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: promptText }]
      })
    });

    if (!response.ok) {
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

    let analysis;
    try {
      const cleanJson = analysisText.replace(/```json|```/g, "").trim();
      analysis = JSON.parse(cleanJson);
    } catch (parseErr) {
      return NextResponse.json({
        error: "Failed to parse response",
        troubleshoot: "Please try again."
      });
    }

    const job = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      url: jobUrl,
      directUrl: jobUrl,
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
      datePosted: new Date().toISOString().split("T")[0],
      expirationDate: null,
      submittedAt: new Date().toISOString(),
      submittedBy: "CEO Fresno Staff",
      needsReview: false
    };

    return NextResponse.json({ success: true, job: job });

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({
      error: "Server error",
      troubleshoot: "An unexpected error occurred. Please try again."
    }, { status: 500 });
  }
}
