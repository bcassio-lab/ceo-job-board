import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

// The SDK automatically picks up the GEMINI_API_KEY environment variable
const ai = new GoogleGenAI({});

export async function POST(request) {
  try {import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// The SDK automatically picks up the ANTHROPIC_API_KEY environment variable
const anthropic = new Anthropic();

export async function POST(request) {
  try {
    const { url: jobUrl, description } = await request.json();

    if (!jobUrl || !description) {
      return NextResponse.json({ error: "URL and description are required" }, { status: 400 });
    }

    const promptText = `Analyze this job posting for a fair-chance employment program serving people with criminal backgrounds.

Job URL: ${jobUrl}

Job Description:
${description}

Use the record_job_analysis tool to return your analysis.`;

    // The structure we want Claude to return, as a plain JSON Schema.
    // (Gemini used Type.OBJECT / Type.STRING — Anthropic uses lowercase string types.)
    const jobSchema = {
      type: "object",
      properties: {
        jobTitle: { type: "string", description: "exact job title" },
        company: { type: "string", description: "company name" },
        location: { type: "string", description: "city, state" },
        grade: {
          type: "string",
          enum: ["best", "better", "good", "fair", "poor"],
          description:
            "best=fair chance encouraged, better=has EEO statement, good=no background check mentioned, fair=background check but only certain felonies disqualify, poor=strict background requirements"
        },
        gradeReason: { type: "string", description: "explanation based on the background check grade" },
        experienceCategory: {
          type: "string",
          enum: ["construction", "warehouse", "transportation", "foodservice", "hospitality", "custodial", "other"]
        },
        ceoMatch: {
          type: "string",
          description:
            "explanation of why this job matches CEO Fresno participant skills (mention relevant certifications like OSHA, forklift, CDL, food handler if applicable)"
        },
        salary: { type: ["string", "null"], description: "salary if listed, otherwise null" },
        requiresDiploma: { type: "boolean" },
        requiresLicense: { type: "boolean" },
        applyTimeEstimate: {
          type: "string",
          description:
            "estimated time range to complete the application, e.g. '5-10 min', '15-25 min', '30-45 min', '45-60 min'. If walk-in or email only, say '5 min (walk-in)' or '5 min (email)'"
        }
      },
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

    // Call Claude and FORCE it to use our tool, so the response always
    // matches the schema above. This is the equivalent of Gemini's responseSchema.
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6", // good balance for the judgment in grading; swap to "claude-haiku-4-5" for faster/cheaper
      max_tokens: 1024,
      temperature: 0.1, // low temperature keeps extraction factual and deterministic
      tools: [
        {
          name: "record_job_analysis",
          description: "Record the structured analysis of the job posting.",
          input_schema: jobSchema
        }
      ],
      tool_choice: { type: "tool", name: "record_job_analysis" },
      messages: [{ role: "user", content: promptText }]
    });

    // Pull the structured data out of the tool_use block Claude returns.
    const toolUse = response.content.find((block) => block.type === "tool_use");

    if (!toolUse) {
      throw new Error("No structured analysis returned from Claude");
    }

    const analysis = toolUse.input;

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
      datePosted: new Date().toISOString().split("T")[0],
      expirationDate: null,
      submittedAt: new Date().toISOString(),
      submittedBy: "CEO Fresno Staff",
      needsReview: false
    };

    return NextResponse.json({ success: true, job: job });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      {
        error: "Server error",
        troubleshoot: "An unexpected error occurred. Please try again."
      },
      { status: 500 }
    );
  }
}
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
