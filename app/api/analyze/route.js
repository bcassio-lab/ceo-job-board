import { NextResponse } from 'next/server';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const response = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Analyze this job posting URL for a fair-chance employment program serving people with criminal backgrounds: ${jobUrl}

IMPORTANT: Use web search to fetch and analyze the actual job posting content.

Respond ONLY with a JSON object (no markdown, no backticks) with these exact fields:
{
  "isLegitimate": true/false,
  "legitimacyReason": "brief explanation",
  "jobTitle": "exact job title",
  "company": "company name",
  "location": "city, state",
  "directApplicationUrl": "direct apply link if different/better, or same URL",
  "grade": "best/better/good/fair/poor",
  "gradeReason": "explanation based on: best=fair chance encouraged, better=has EEO statement, good=no background check mentioned, fair=background check but only certain felonies disqualify, poor=strict background requirements",
  "experienceCategory": "construction/warehouse/transportation/foodservice/hospitality/custodial/other",
  "ceoMatch": "explanation of why this job matches CEO Fresno participant skills (mention relevant certifications like OSHA, forklift, CDL, food handler if applicable)",
  "salary": "salary/wage if listed",
  "requiresDiploma": true/false,
  "requiresLicense": true/false,
  "datePosted": "YYYY-MM-DD format if found, otherwise today's date",
  "expirationDate": "YYYY-MM-DD if listed, otherwise null"
}`
        }]
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json({ 
          error: 'Rate limited', 
          troubleshoot: 'Too many requests. Wait 30 seconds and try again.'
        }, { status: 429 });
      }
      return NextResponse.json({ 
        error: 'API request failed', 
        troubleshoot: `Server returned ${response.status}. Try again in a few minutes.`
      }, { status: response.status });
    }

    const data = await response.json();
    
    let analysisText = '';
    for (const block of data.content) {
      if (block.type === 'text') {
        analysisText += block.text;
      }
    }

    if (!analysisText.trim()) {
      return NextResponse.json({ 
        error: 'Empty response', 
        troubleshoot: 'The page may be blocked or require login',
        canAddAnyway: true
      });
    }

    let analysis;
    try {
      const cleanJson = analysisText.replace(/```json|```/g, '').trim();
      analysis = JSON.parse(cleanJson);
    } catch (parseErr) {
      return NextResponse.json({ 
        error: 'Failed to parse response', 
        troubleshoot: 'Try the direct employer page instead of a job board.',
        canAddAnyway: true
      });
    }

    if (!analysis.isLegitimate) {
      return NextResponse.json({ 
        error: 'Flagged as not legitimate', 
        troubleshoot: analysis.legitimacyReason || '
