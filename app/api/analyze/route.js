import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

// The SDK automatically picks up the GEMINI_API_KEY environment variable
const ai = new GoogleGenAI({});

export async function POST(request) {
  try {
    const { url: jobUrl, description } = await request.json();

    if (!jobUrl || !description) {
      return NextResponse.json({ error: "URL and description are required" }, { status: 400 });
    }

    // Notice we no longer need to instruct it on how to format the JSON
    const promptText = `Analyze this job posting for a fair-chance employment program serving people with criminal backgrounds.

Job URL: ${jobUrl}

Job Description:
${description}`;

    // Define the strict structure we want Gemini to return
    const jobSchema = {
      type: Type.OBJECT,
      properties: {
        jobTitle: { type: Type.STRING, description: "exact job title" },
        company: { type: Type.STRING, description: "company name" },
        location: { type: Type.STRING, description: "city, state" },
        grade: { 
          type: Type.STRING, 
          enum: ["best", "better", "good", "fair", "poor"],
          description: "best=fair chance encouraged, better=has EEO statement, good=no background check mentioned, fair=background check but only certain felonies disqualify, poor=strict background requirements" 
        },
        gradeReason: { type: Type.STRING, description: "explanation based on the background check grade" },
        experienceCategory: { 
          type: Type.STRING, 
          enum: ["construction", "warehouse", "transportation", "foodservice", "hospitality", "custodial", "other"]
        },
        ceoMatch: { type: Type.STRING, description: "explanation of why this job matches CEO Fresno participant skills (mention relevant certifications like OSHA, forklift, CDL, food handler if applicable)" },
        salary: { type: Type.STRING, nullable: true, description: "salary if listed, otherwise null" },
        requiresDiploma: { type: Type.BOOLEAN },
        requiresLicense: { type: Type.BOOLEAN },
        applyTimeEstimate: { 
          type: Type.STRING,
          description: "estimated time range to complete the application, e.g. '5-10 min', '15-25 min', '30-45 min', '45-60 min'. If walk-in or email only, say '5 min (walk-in)' or '5 min (email)'"
        }
      },
      // FIX: Added the required array
      required: [
        "jobTitle", 
        "company", 
        "location", 
        "grade", 
        "gradeReason", 
        "experienceCategory", 
        "ceoMatch", 
        "requiresDiploma", 
        "requiresLicense", 
        "applyTimeEstimate"
      ]
    };

    // Make the API call to Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // We use 2.5-flash as it is highly optimized for text extraction tasks
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: jobSchema,
        temperature: 0.1 // Keeping temperature low ensures more factual, deterministic extraction
      }
    });

    if (!response.text) {
      throw new Error("No text returned from Gemini");
    }

    // Because we used responseSchema, this is guaranteed to parse correctly
    const analysis = JSON.parse(response.text);

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
      applyTime: analysis.applyTimeEstimate || "10-15 min",
      datePosted: new Date().toISOString().split("T")[0], // FIX: Added [0] to get just the date string
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
