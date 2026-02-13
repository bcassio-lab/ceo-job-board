import { NextResponse } from 'next/server';

// Helper function to wait
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry logic for API calls
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      // Rate limited - wait and retry
      const waitTime = attempt * 5000; // 5s, 10s, 15s
      console.log(`Rate limited. Waiting ${waitTime/1000}s before retry ${attempt}/${maxRetries}`);
      
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
  "requiresDiploma": true/false (if job requires high school diploma or GED),
  "requiresLicense": true/false (if job requires driver's license or any professional license),
  "datePosted": "YYYY-MM-DD format if found, otherwise today's date",
  "expirationDate": "YYYY-MM-DD if listed, otherwise null",
  "applyTimeEstimate": "estimated time range to complete the application, e.g. '5-10 min', '15-20 min', '30-45 min'. Base this on: simple 1-page forms or walk-in = '5-10 min', standard online application with account creation (Workday, iCIMS, Taleo, ADP) = '15-25 min', lengthy multi-step applications with assessments or questionnaires = '30-45 min', government/state applications (CalCareers, USAJOBS) = '45-60 min'. If walk-in or email only, say '5 min (walk-in)' or '5 min (email)'"
}`
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      
      if (response.status === 429) {
        return NextResponse.json({ 
          error: 'Rate limited', 
          troubleshoot: 'Too many requests. Please wait 30 seconds and try again, or analyze fewer jobs at once.'
        }, { status: 429 });
      }
      
      return NextResponse.json({ 
        error: 'API request failed', 
        troubleshoot: `Server returned ${response.status}. Try again in a few minutes.`
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Extract text from response
    let analysisText = '';
    for (const block of data.content) {
      if (block.type === 'text') {
        analysisText += block.text;
      }
    }

    if (!analysisText.trim()) {
      return NextResponse.json({ 
        error: 'Empty response', 
        troubleshoot: 'The page may be blocked, require login, or have no readable content',
        canAddAnyway: true
      });
    }

    // Parse JSON response
    let analysis;
    try {
      const cleanJson = analysisText.replace(/```json|```/g, '').trim();
      analysis = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Parse error:', parseErr, 'Raw text:', analysisText);
      return NextResponse.json({ 
        error: 'Failed to parse response', 
        troubleshoot: 'The job page structure may be unusual. Try the direct employer page instead of a job board.',
        canAddAnyway: true
      });
    }

    if (!analysis.isLegitimate) {
      return NextResponse.json({ 
        error: 'Flagged as not legitimate', 
        troubleshoot: analysis.legitimacyReason || 'The posting may be expired, a scam, or not a real job listing',
        canAddAnyway: true
      });
    }

    // Build the job object
    const job = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      url: jobUrl,
      directUrl: analysis.directApplicationUrl || jobUrl,
      title: analysis.jobTitle || 'Unknown Position',
      company: analysis.company || 'Unknown Company',
      location: analysis.location || 'Location not specified',
      grade: analysis.grade || 'good',
      gradeReason: analysis.gradeReason || '',
      category: analysis.experienceCategory || 'other',
      ceoMatch: analysis.ceoMatch || '',
      salary: analysis.salary || 'Not listed',
      requiresDiploma: analysis.requiresDiploma || false,
      requiresLicense: analysis.requiresLicense || false,
      datePosted: analysis.datePosted || new Date().toISOString().split('T')[0],
      expirationDate: analysis.expirationDate || null,
      applyTime: analysis.applyTimeEstimate || '10-15 min',
      submittedAt: new Date().toISOString(),
      submittedBy: 'CEO Fresno Staff',
      needsReview: false
    };

    return NextResponse.json({ success: true, job });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      troubleshoot: 'An unexpected error occurred. Please try again.',
      canAddAnyway: true
    }, { status: 500 });
  }
}
