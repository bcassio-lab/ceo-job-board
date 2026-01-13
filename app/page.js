"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Frequent Hirers detection patterns - expanded to 17 employers
const FREQUENT_HIRERS = {
  walmart: { patterns: ["walmart", "sam's club", "sams club"], name: "Walmart / Sam's Club", icon: "🛒" },
  amazon: { patterns: ["amazon", "aws", "whole foods"], name: "Amazon", icon: "📦" },
  target: { patterns: ["target"], name: "Target", icon: "🎯" },
  fedex: { patterns: ["fedex", "federal express"], name: "FedEx", icon: "📬" },
  ups: { patterns: ["ups", "united parcel"], name: "UPS", icon: "📦" },
  foster_farms: { patterns: ["foster farms"], name: "Foster Farms", icon: "🐔" },
  pridestaff: { patterns: ["pridestaff"], name: "PrideStaff", icon: "🤝" },
  randstad: { patterns: ["randstad"], name: "Randstad", icon: "🤝" },
  adecco: { patterns: ["adecco"], name: "Adecco", icon: "🤝" },
  home_depot: { patterns: ["home depot", "homedepot", "the home depot"], name: "Home Depot", icon: "🧰" },
  lowes: { patterns: ["lowe's", "lowes", "lowe"], name: "Lowe's", icon: "🔨" },
  starbucks: { patterns: ["starbucks", "starbucks coffee"], name: "Starbucks", icon: "☕" },
  mcdonalds: { patterns: ["mcdonald's", "mcdonalds", "mcd"], name: "McDonald's", icon: "🍟" },
  kroger: { patterns: ["kroger", "food 4 less", "food4less", "ralphs", "fred meyer"], name: "Kroger / Food 4 Less", icon: "🛒" },
  goodwill: { patterns: ["goodwill", "goodwill industries"], name: "Goodwill Industries", icon: "💚" },
  taco_bell: { patterns: ["taco bell", "tacobell"], name: "Taco Bell", icon: "🌮" },
  burger_king: { patterns: ["burger king", "burgerking", "bk"], name: "Burger King", icon: "🍔" }
};

// Detect if URL is from Indeed
const isIndeedUrl = (url) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes("indeed.com") || 
         lowerUrl.includes("indeed.ca") || 
         lowerUrl.includes("indeed.co");
};

// Detect if URL is from other problematic job sites
const isProblematicSite = (url) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const problematicDomains = [
    "workforcenow.adp.com",
    "workday.com",
    "myworkday",
    "taleo.net",
    "icims.com",
    "ultipro.com",
    "paycomonline.net",
    "lever.co",
    "greenhouse.io",
    "jobvite.com",
    "smartrecruiters.com"
  ];
  return problematicDomains.some(domain => lowerUrl.includes(domain));
};

// Extract job key from Indeed URL if present
const extractIndeedJobKey = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("jk") || null;
  } catch {
    return null;
  }
};

// Detect frequent hirer from job data
const detectFrequentHirer = (job) => {
  const searchText = `${job.company} ${job.title}`.toLowerCase();
  for (const [slug, data] of Object.entries(FREQUENT_HIRERS)) {
    if (data.patterns.some(pattern => searchText.includes(pattern))) {
      return slug;
    }
  }
  return null;
};

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [frequentHirers, setFrequentHirers] = useState([]);
  const [url, setUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualDescription, setManualDescription] = useState("");
  const [indeedMode, setIndeedMode] = useState(false);
  const [indeedJobKey, setIndeedJobKey] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("jobs");
  const [selectedHirer, setSelectedHirer] = useState(null);
  const [filters, setFilters] = useState({
    grade: "all",
    category: "all",
    diploma: "all",
    license: "all"
  });
  const [errorLog, setErrorLog] = useState([]);
  const [showErrorLog, setShowErrorLog] = useState(false);

  // Fetch jobs from Supabase
  const fetchJobs = useCallback(async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
    } else {
      const now = new Date();
      const activeJobs = (data || []).filter(job => {
        if (job.expiration_date) {
          return new Date(job.expiration_date) > now;
        }
        const submittedAt = new Date(job.submitted_at);
        const daysSinceSubmitted = (now - submittedAt) / (1000 * 60 * 60 * 24);
        return daysSinceSubmitted <= 21;
      });
      setJobs(activeJobs);
    }
    setLoading(false);
  }, []);

  // Fetch frequent hirers from Supabase
  const fetchFrequentHirers = useCallback(async () => {
    const { data, error } = await supabase
      .from("frequent_hirers")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching frequent hirers:", error);
    } else {
      setFrequentHirers(data || []);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchFrequentHirers();

    const jobsChannel = supabase
      .channel("jobs-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, fetchJobs)
      .subscribe();

    const hirersChannel = supabase
      .channel("hirers-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "frequent_hirers" }, fetchFrequentHirers)
      .subscribe();

    return () => {
      supabase.removeChannel(jobsChannel);
      supabase.removeChannel(hirersChannel);
    };
  }, [fetchJobs, fetchFrequentHirers]);

  // Watch URL input for Indeed detection
  useEffect(() => {
    if (isIndeedUrl(url)) {
      if (!indeedMode && !manualMode) {
        setIndeedMode(true);
        const jobKey = extractIndeedJobKey(url);
        setIndeedJobKey(jobKey);
      }
    } else if (isProblematicSite(url)) {
      if (!manualMode && !indeedMode) {
        setManualMode(true);
      }
    }
  }, [url, indeedMode, manualMode]);

  // Save job to Supabase
  const saveJobToSupabase = async (job) => {
    const hirerSlug = detectFrequentHirer(job);

    const { error } = await supabase.from("jobs").insert([{
      url: job.url,
      direct_url: job.directUrl,
      title: job.title,
      company: job.company,
      location: job.location,
      grade: job.grade,
      grade_reason: job.gradeReason,
      category: job.category,
      ceo_match: job.ceoMatch,
      salary: job.salary,
      requires_diploma: job.requiresDiploma,
      requires_license: job.requiresLicense,
      date_posted: job.datePosted,
      expiration_date: job.expirationDate,
      submitted_by: job.submittedBy,
      needs_review: job.needsReview || false,
      frequent_hirer_slug: hirerSlug
    }]);

    if (error) {
      console.error("Error saving job:", error);
      return false;
    }
    return true;
  };

  // Handle Indeed-specific submission
  const handleIndeedSubmit = async () => {
    if (!url.trim() || !manualDescription.trim()) {
      setError("Please paste both the Indeed URL and the job description");
      return;
    }

    setAnalyzing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/analyze-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          description: manualDescription.trim()
        })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        if (data.troubleshoot) {
          setErrorLog(prev => [...prev, {
            time: new Date().toLocaleTimeString(),
            url: url.trim(),
            error: data.error,
            troubleshoot: data.troubleshoot
          }]);
        }
      } else if (data.job) {
        const saved = await saveJobToSupabase(data.job);
        if (saved) {
          setSuccess(`Added: ${data.job.title} at ${data.job.company}`);
          setUrl("");
          setManualDescription("");
          setIndeedMode(false);
          setIndeedJobKey(null);
        } else {
          setError("Failed to save job to database");
        }
      }
    } catch (err) {
      setError("Failed to analyze job. Please try again.");
    }

    setAnalyzing(false);
  };

  // Handle manual entry submission
  const handleManualSubmit = async () => {
    if (!url.trim() || !manualDescription.trim()) {
      setError("Please provide both a URL and job description");
      return;
    }

    setAnalyzing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/analyze-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          description: manualDescription.trim()
        })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        if (data.troubleshoot) {
          setErrorLog(prev => [...prev, {
            time: new Date().toLocaleTimeString(),
            url: url.trim(),
            error: data.error,
            troubleshoot: data.troubleshoot
          }]);
        }
      } else if (data.job) {
        const saved = await saveJobToSupabase(data.job);
        if (saved) {
          setSuccess(`Added: ${data.job.title} at ${data.job.company}`);
          setUrl("");
          setManualDescription("");
          setManualMode(false);
        } else {
          setError("Failed to save job to database");
        }
      }
    } catch (err) {
      setError("Failed to analyze job. Please try again.");
    }

    setAnalyzing(false);
  };

  // Handle single URL submission
  const handleSubmit = async () => {
    if (!url.trim()) {
      setError("Please enter a job URL");
      return;
    }

    // Check if Indeed or problematic site - redirect to appropriate mode
    if (isIndeedUrl(url)) {
      setIndeedMode(true);
      setIndeedJobKey(extractIndeedJobKey(url));
      return;
    }

    if (isProblematicSite(url)) {
      setManualMode(true);
      return;
    }

    setAnalyzing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        if (data.troubleshoot) {
          setErrorLog(prev => [...prev, {
            time: new Date().toLocaleTimeString(),
            url: url.trim(),
            error: data.error,
            troubleshoot: data.troubleshoot
          }]);
        }
      } else if (data.job) {
        const saved = await saveJobToSupabase(data.job);
        if (saved) {
          setSuccess(`Added: ${data.job.title} at ${data.job.company}`);
          setUrl("");
        } else {
          setError("Failed to save job to database");
        }
      }
    } catch (err) {
      setError("Failed to analyze job. Please try again.");
    }

    setAnalyzing(false);
  };

  // Handle bulk URL submission
  const handleBulkSubmit = async () => {
    const urls = bulkUrls.split("\n").map(u => u.trim()).filter(u => u);
    if (urls.length === 0) {
      setError("Please enter at least one URL");
      return;
    }

    setAnalyzing(true);
    setError("");
    setSuccess("");

    let added = 0;
    let failed = 0;
    const newErrors = [];
    const indeedUrls = [];

    for (const jobUrl of urls) {
      // Separate Indeed URLs for manual handling
      if (isIndeedUrl(jobUrl) || isProblematicSite(jobUrl)) {
        indeedUrls.push(jobUrl);
        continue;
      }

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: jobUrl })
        });

        const data = await response.json();

        if (data.error) {
          failed++;
          newErrors.push({
            time: new Date().toLocaleTimeString(),
            url: jobUrl,
            error: data.error,
            troubleshoot: data.troubleshoot || "Check the URL and try again"
          });
        } else if (data.job) {
          const saved = await saveJobToSupabase(data.job);
          if (saved) {
            added++;
          } else {
            failed++;
          }
        }
      } catch (err) {
        failed++;
        newErrors.push({
          time: new Date().toLocaleTimeString(),
          url: jobUrl,
          error: "Request failed",
          troubleshoot: "Network error - try again"
        });
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setErrorLog(prev => [...prev, ...newErrors]);

    let message = `Added ${added} job${added !== 1 ? "s" : ""}`;
    if (failed > 0) message += `, ${failed} failed`;
    if (indeedUrls.length > 0) {
      message += `. ${indeedUrls.length} Indeed/ADP URL(s) need manual entry.`;
    }
    setSuccess(message);
    setBulkUrls(indeedUrls.join("\n")); // Keep Indeed URLs for manual processing
    setAnalyzing(false);
  };

  // Handle "Add Anyway" for failed URLs
  const handleAddAnyway = async () => {
    if (!url.trim()) return;

    const job = {
      url: url.trim(),
      directUrl: url.trim(),
      title: "Needs Review",
      company: "Unknown",
      location: "Unknown",
      grade: "good",
      gradeReason: "Added manually - needs review",
      category: "other",
      ceoMatch: "",
      salary: "Not listed",
      requiresDiploma: false,
      requiresLicense: false,
      datePosted: new Date().toISOString().split("T")[0],
      expirationDate: null,
      submittedBy: "CEO Fresno Staff",
      needsReview: true
    };

    const saved = await saveJobToSupabase(job);
    if (saved) {
      setSuccess("Job added for manual review");
      setUrl("");
      setError("");
      setIndeedMode(false);
      setManualMode(false);
    } else {
      setError("Failed to save job");
    }
  };

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    if (filters.grade !== "all" && job.grade !== filters.grade) return false;
    if (filters.category !== "all" && job.category !== filters.category) return false;
    if (filters.diploma === "no" && job.requires_diploma) return false;
    if (filters.diploma === "yes" && !job.requires_diploma) return false;
    if (filters.license === "no" && job.requires_license) return false;
    if (filters.license === "yes" && !job.requires_license) return false;
    return true;
  });

  const gradeColors = {
    best: "bg-green-100 text-green-800 border-green-300",
    better: "bg-blue-100 text-blue-800 border-blue-300",
    good: "bg-yellow-100 text-yellow-800 border-yellow-300",
    fair: "bg-orange-100 text-orange-800 border-orange-300",
    poor: "bg-red-100 text-red-800 border-red-300"
  };

  const categories = ["construction", "warehouse", "transportation", "foodservice", "hospitality", "custodial", "other"];

  // Reset all modes
  const resetModes = () => {
    setBulkMode(false);
    setManualMode(false);
    setIndeedMode(false);
    setIndeedJobKey(null);
    setManualDescription("");
    setError("");
    setSuccess("");
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CEO Fresno Job Board</h1>
          <p className="text-gray-600 mt-2">Fair Chance Employment Opportunities</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setActiveTab("jobs"); setSelectedHirer(null); }}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === "jobs" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
          >
            Job Listings ({filteredJobs.length})
          </button>
          <button
            onClick={() => setActiveTab("hirers")}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === "hirers" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
          >
            Frequent Hirers ({frequentHirers.length})
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === "add" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
          >
            + Add Jobs
          </button>
        </div>

        {/* Add Jobs Tab */}
        {activeTab === "add" && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => resetModes()}
                className={`px-3 py-1 rounded text-sm ${!bulkMode && !manualMode && !indeedMode ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                Single URL
              </button>
              <button
                onClick={() => { resetModes(); setBulkMode(true); }}
                className={`px-3 py-1 rounded text-sm ${bulkMode ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                Bulk Upload
              </button>
              <button
                onClick={() => { resetModes(); setManualMode(true); }}
                className={`px-3 py-1 rounded text-sm ${manualMode ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                Manual Entry
              </button>
              <button
                onClick={() => { resetModes(); setIndeedMode(true); }}
                className={`px-3 py-1 rounded text-sm ${indeedMode ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                📋 Indeed Quick Entry
              </button>
            </div>

            {/* Indeed Quick Entry Mode */}
            {indeedMode && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                    📋 Indeed Quick Entry
                  </h3>
                  <p className="text-purple-700 text-sm mt-1">
                    Indeed blocks automatic reading. Follow these quick steps:
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Step 1: URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step 1: Paste Indeed URL
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.indeed.com/viewjob?jk=..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {indeedJobKey && (
                      <p className="text-xs text-green-600 mt-1">✓ Job ID detected: {indeedJobKey}</p>
                    )}
                  </div>

                  {/* Instructions */}
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-gray-900 mb-2">Step 2: Copy job details</p>
                    <ol className="list-decimal list-inside text-gray-600 space-y-1">
                      <li>Open the Indeed job in a new tab</li>
                      <li>Scroll to see the full description</li>
                      <li>Select all text (Ctrl+A / Cmd+A)</li>
                      <li>Copy (Ctrl+C / Cmd+C)</li>
                      <li>Paste below</li>
                    </ol>
                  </div>
                </div>

                {/* Step 3: Paste description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Step 3: Paste job description here
                  </label>
                  <textarea
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    placeholder="Paste the entire job posting here... Include job title, company name, location, requirements, and description."
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                  />
                  {manualDescription.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {manualDescription.length} characters pasted
                      {manualDescription.length < 100 && " (paste more for better analysis)"}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleIndeedSubmit}
                    disabled={analyzing || !url.trim() || !manualDescription.trim()}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {analyzing ? "Analyzing..." : "Analyze & Add Job"}
                  </button>
                  <button
                    onClick={handleAddAnyway}
                    disabled={!url.trim()}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Add for Manual Review
                  </button>
                </div>
              </div>
            )}

            {/* Regular Manual Entry Mode */}
            {manualMode && !indeedMode && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-900">Manual Entry Mode</h3>
                  <p className="text-amber-700 text-sm mt-1">
                    For sites that block automatic reading (ADP, Workday, Taleo, etc.)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paste Job Description
                  </label>
                  <textarea
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    placeholder="Copy and paste the entire job posting here..."
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleManualSubmit}
                    disabled={analyzing || !url.trim() || !manualDescription.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {analyzing ? "Analyzing..." : "Analyze & Add"}
                  </button>
                  <button
                    onClick={handleAddAnyway}
                    disabled={!url.trim()}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Add Anyway
                  </button>
                </div>
              </div>
            )}

            {/* Bulk Mode */}
            {bulkMode && !indeedMode && !manualMode && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paste URLs (one per line)
                  </label>
                  <textarea
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    placeholder="https://example.com/job1&#10;https://example.com/job2&#10;https://example.com/job3"
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Note: Indeed and ADP URLs will be separated for manual entry
                  </p>
                </div>
                <button
                  onClick={handleBulkSubmit}
                  disabled={analyzing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {analyzing ? "Processing..." : "Analyze All"}
                </button>
              </div>
            )}

            {/* Single URL Mode */}
            {!bulkMode && !manualMode && !indeedMode && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Indeed URLs auto-switch to Quick Entry mode
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={analyzing}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {analyzing ? "Analyzing..." : "Add Job"}
                  </button>
                  {error && (
                    <button
                      onClick={handleAddAnyway}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Add Anyway
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Error/Success Messages */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {success}
              </div>
            )}

            {/* Error Log */}
            {errorLog.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowErrorLog(!showErrorLog)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {showErrorLog ? "Hide" : "Show"} Error Log ({errorLog.length})
                </button>
                {showErrorLog && (
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {errorLog.map((log, i) => (
                      <div key={i} className="text-xs p-2 bg-gray-50 rounded">
                        <span className="text-gray-500">{log.time}</span>
                        <span className="ml-2 text-red-600">{log.error}</span>
                        <p className="text-gray-600 truncate">{log.url}</p>
                        {log.troubleshoot && (
                          <p className="text-blue-600 mt-1">💡 {log.troubleshoot}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Frequent Hirers Tab */}
        {activeTab === "hirers" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            {selectedHirer ? (
              <div>
                <button
                  onClick={() => setSelectedHirer(null)}
                  className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  ← Back to all hirers
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{selectedHirer.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedHirer.name}</h2>
                    <p className="text-gray-600">{selectedHirer.tagline}</p>
                  </div>
                </div>
                {selectedHirer.quick_facts && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {selectedHirer.quick_facts.map((fact, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                        {fact}
                      </span>
                    ))}
                  </div>
                )}
                {selectedHirer.apply_url && (
                  <a
                    href={selectedHirer.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Apply Now →
                  </a>
                )}
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedHirer.guide_html }}
                />
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold mb-4">Frequent Hirers - Application Guides</h2>
                <p className="text-gray-600 mb-6">
                  Step-by-step guides for employers who regularly hire CEO participants
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {frequentHirers.map((hirer) => (
                    <button
                      key={hirer.slug}
                      onClick={() => setSelectedHirer(hirer)}
                      className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{hirer.icon}</span>
                        <div>
                          <h3 className="font-semibold">{hirer.name}</h3>
                          <p className="text-sm text-gray-500">{hirer.category}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{hirer.tagline}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Grade</label>
                  <select
                    value={filters.grade}
                    onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
                    className="px-3 py-1 border rounded-lg text-sm"
                  >
                    <option value="all">All Grades</option>
                    <option value="best">Best</option>
                    <option value="better">Better</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="px-3 py-1 border rounded-lg text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Diploma Required</label>
                  <select
                    value={filters.diploma}
                    onChange={(e) => setFilters({ ...filters, diploma: e.target.value })}
                    className="px-3 py-1 border rounded-lg text-sm"
                  >
                    <option value="all">Any</option>
                    <option value="no">No Diploma Required</option>
                    <option value="yes">Diploma Required</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">License Required</label>
                  <select
                    value={filters.license}
                    onChange={(e) => setFilters({ ...filters, license: e.target.value })}
                    className="px-3 py-1 border rounded-lg text-sm"
                  >
                    <option value="all">Any</option>
                    <option value="no">No License Required</option>
                    <option value="yes">License Required</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Job List */}
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading jobs...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No jobs match your filters. Try adjusting the filters above.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-gray-600">{job.company} • {job.location}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${gradeColors[job.grade] || gradeColors.good}`}>
                        {job.grade?.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {job.category}
                      </span>
                      {job.salary && job.salary !== "Not listed" && (
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                          {job.salary}
                        </span>
                      )}
                      {job.requires_diploma && (
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs">
                          Diploma Required
                        </span>
                      )}
                      {job.requires_license && (
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs">
                          License Required
                        </span>
                      )}
                      {job.needs_review && (
                        <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">
                          Needs Review
                        </span>
                      )}
                      {job.frequent_hirer_slug && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                          {FREQUENT_HIRERS[job.frequent_hirer_slug]?.icon} Frequent Hirer
                        </span>
                      )}
                    </div>

                    {job.grade_reason && (
                      <p className="text-sm text-gray-600 mb-3">{job.grade_reason}</p>
                    )}

                    {job.ceo_match && (
                      <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded mb-3">
                        <strong>CEO Match:</strong> {job.ceo_match}
                      </p>
                    )}

                    <div className="flex gap-3">
                      <a
                        href={job.direct_url || job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Apply Now →
                      </a>
                      {job.frequent_hirer_slug && frequentHirers.find(h => h.slug === job.frequent_hirer_slug) && (
                        <button
                          onClick={() => {
                            setSelectedHirer(frequentHirers.find(h => h.slug === job.frequent_hirer_slug));
                            setActiveTab("hirers");
                          }}
                          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm"
                        >
                          View Hiring Guide
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-3">
                      Added {new Date(job.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
