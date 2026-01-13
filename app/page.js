"use client";
import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Search, Plus, ExternalLink, Trash2, RefreshCw, AlertCircle, CheckCircle,
  Clock, Users, Filter, GraduationCap, Car, Calendar, Upload, ChevronDown,
  Check, Edit3, Building2, BookOpen, ArrowRight, Star, Phone, MapPin, Globe
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GRADES = {
  best: { label: "Best", color: "bg-emerald-500", textColor: "text-emerald-400", bgLight: "bg-emerald-500/20", border: "border-emerald-500" },
  good: { label: "Good", color: "bg-blue-500", textColor: "text-blue-400", bgLight: "bg-blue-500/20", border: "border-blue-500" },
  fair: { label: "Fair", color: "bg-amber-500", textColor: "text-amber-400", bgLight: "bg-amber-500/20", border: "border-amber-500" },
  poor: { label: "Poor", color: "bg-red-500", textColor: "text-red-400", bgLight: "bg-red-500/20", border: "border-red-500" }
};

const CATEGORIES = {
  construction: { label: "Construction", icon: "🏗️" },
  warehouse: { label: "Warehouse/Logistics", icon: "📦" },
  transportation: { label: "Transportation", icon: "🚛" },
  food_service: { label: "Food Service", icon: "🍽️" },
  hospitality: { label: "Hospitality", icon: "🏨" },
  custodial: { label: "Custodial", icon: "🧹" },
  manufacturing: { label: "Manufacturing", icon: "🏭" },
  retail: { label: "Retail", icon: "🛒" },
  other: { label: "Other", icon: "💼" }
};

const FREQUENT_HIRERS = {
  // Existing 9 employers...
  walmart: { patterns: ["walmart", "sam's club"], name: "Walmart / Sam's Club", icon: "🛒" },
  amazon: { patterns: ["amazon", "aws", "whole foods"], name: "Amazon", icon: "📦" },
  target: { patterns: ["target"], name: "Target", icon: "🎯" },
  fedex: { patterns: ["fedex", "federal express"], name: "FedEx", icon: "📬" },
  ups: { patterns: ["ups", "united parcel"], name: "UPS", icon: "📦" },
  foster_farms: { patterns: ["foster farms"], name: "Foster Farms", icon: "🐔" },
  pridestaff: { patterns: ["pridestaff"], name: "PrideStaff", icon: "🤝" },
  randstad: { patterns: ["randstad"], name: "Randstad", icon: "🤝" },
  adecco: { patterns: ["adecco"], name: "Adecco", icon: "🤝" },
  
  // NEW 8 employers...
  home_depot: { patterns: ["home depot", "homedepot", "the home depot"], name: "Home Depot", icon: "🧰" },
  lowes: { patterns: ["lowe's", "lowes", "lowe"], name: "Lowe's", icon: "🔨" },
  starbucks: { patterns: ["starbucks", "starbucks coffee"], name: "Starbucks", icon: "☕" },
  mcdonalds: { patterns: ["mcdonald's", "mcdonalds", "mcd"], name: "McDonald's", icon: "🍟" },
  kroger: { patterns: ["kroger", "food 4 less", "food4less", "ralphs", "fred meyer"], name: "Kroger / Food 4 Less", icon: "🛒" },
  goodwill: { patterns: ["goodwill", "goodwill industries"], name: "Goodwill Industries", icon: "💚" },
  taco_bell: { patterns: ["taco bell", "tacobell"], name: "Taco Bell", icon: "🌮" },
  burger_king: { patterns: ["burger king", "burgerking", "bk"], name: "Burger King", icon: "🍔" }
};

function detectFrequentHirer(company, url) {
  const searchText = `${company} ${url}`.toLowerCase();
  for (const [key, hirer] of Object.entries(FREQUENT_HIRERS)) {
    if (hirer.patterns.some(pattern => searchText.includes(pattern))) {
      return key;
    }
  }
  return null;
}

function getDaysUntilExpiration(expirationDate) {
  if (!expirationDate) return null;
  const now = new Date();
  const exp = new Date(expirationDate);
  const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function CEOJobBoard() {
  // Tab state
  const [activeTab, setActiveTab] = useState("jobs");
  
  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [filterGrades, setFilterGrades] = useState([]);
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterNoDiploma, setFilterNoDiploma] = useState(false);
  const [filterNoLicense, setFilterNoLicense] = useState(false);
  const [filterExpiringSoon, setFilterExpiringSoon] = useState(false);
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkProgress, setBulkProgress] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [editingJob, setEditingJob] = useState(null);
  
  // Frequent Hirers state
  const [frequentHirers, setFrequentHirers] = useState([]);
  const [selectedHirer, setSelectedHirer] = useState(null);
  const [hirersLoading, setHirersLoading] = useState(true);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("date_posted", { ascending: false });
      if (error) throw error;
      const transformedJobs = (data || []).map(job => ({
        id: job.id,
        url: job.url,
        directUrl: job.direct_url,
        title: job.title,
        company: job.company,
        location: job.location,
        grade: job.grade,
        gradeReason: job.grade_reason,
        category: job.category,
        ceoMatch: job.ceo_match,
        salary: job.salary,
        requiresDiploma: job.requires_diploma,
        requiresLicense: job.requires_license,
        datePosted: job.date_posted,
        expirationDate: job.expiration_date,
        submittedAt: job.submitted_at,
        submittedBy: job.submitted_by,
        needsReview: job.needs_review,
        frequentHirer: detectFrequentHirer(job.company, job.url)
      }));
      setJobs(transformedJobs);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setInitialLoad(false);
    }
  }, []);

  // Fetch frequent hirers
  const fetchFrequentHirers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("frequent_hirers")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      setFrequentHirers(data || []);
    } catch (err) {
      console.error("Error fetching frequent hirers:", err);
    } finally {
      setHirersLoading(false);
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

  // Auto-clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const analyzeJob = async (url) => {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.troubleshoot || data.error);
    return data.job;
  };

  const analyzeManualJob = async (url, description) => {
    const response = await fetch("/api/analyze-manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, description })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.troubleshoot || data.error);
    return data.job;
  };

  const saveJob = async (job) => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 21);
    const dbJob = {
      id: job.id,
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
      expiration_date: expirationDate.toISOString().split("T")[0],
      submitted_at: job.submittedAt,
      submitted_by: job.submittedBy,
      needs_review: job.needsReview
    };
    const { error } = await supabase.from("jobs").upsert(dbJob, { onConflict: "id" });
    if (error) throw error;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const job = await analyzeJob(newUrl.trim());
      await saveJob(job);
      setSuccess(`Added: ${job.title} at ${job.company}`);
      setNewUrl("");
      fetchJobs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualUrl.trim() || !manualDescription.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const job = await analyzeManualJob(manualUrl.trim(), manualDescription.trim());
      await saveJob(job);
      setSuccess(`Added: ${job.title} at ${job.company}`);
      setManualUrl("");
      setManualDescription("");
      setManualMode(false);
      fetchJobs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    const urls = bulkUrls.split("\n").map(u => u.trim()).filter(u => u);
    if (urls.length === 0) return;
    setBulkProgress({ current: 0, total: urls.length, results: [] });
    for (let i = 0; i < urls.length; i++) {
      try {
        const job = await analyzeJob(urls[i]);
        await saveJob(job);
        setBulkProgress(prev => ({
          ...prev,
          current: i + 1,
          results: [...prev.results, { url: urls[i], success: true, title: job.title }]
        }));
      } catch (err) {
        setBulkProgress(prev => ({
          ...prev,
          current: i + 1,
          results: [...prev.results, { url: urls[i], success: false, error: err.message }]
        }));
      }
      if (i < urls.length - 1) await new Promise(r => setTimeout(r, 2000));
    }
    fetchJobs();
  };

  const handleDelete = async (id) => {
    try {
      await supabase.from("jobs").delete().eq("id", id);
      fetchJobs();
    } catch (err) {
      setError("Failed to delete job");
    }
  };

  const handleUpdateJob = async (job) => {
    try {
      await saveJob(job);
      setEditingJob(null);
      fetchJobs();
      setSuccess("Job updated successfully");
    } catch (err) {
      setError("Failed to update job");
    }
  };

  const filteredJobs = jobs
    .filter(job => filterGrades.length === 0 || filterGrades.includes(job.grade))
    .filter(job => filterCategories.length === 0 || filterCategories.includes(job.category))
    .filter(job => !filterNoDiploma || !job.requiresDiploma)
    .filter(job => !filterNoLicense || !job.requiresLicense)
    .filter(job => !filterExpiringSoon || (getDaysUntilExpiration(job.expirationDate) !== null && getDaysUntilExpiration(job.expirationDate) <= 7))
    .sort((a, b) => {
      if (sortBy === "grade") {
        const order = { best: 0, good: 1, fair: 2, poor: 3 };
        return order[a.grade] - order[b.grade];
      }
      if (sortBy === "expiring") {
        const daysA = getDaysUntilExpiration(a.expirationDate) ?? 999;
        const daysB = getDaysUntilExpiration(b.expirationDate) ?? 999;
        return daysA - daysB;
      }
      return new Date(b.datePosted) - new Date(a.datePosted);
    });

  // Render Frequent Hirers Guide
  const renderFrequentHirersGuide = () => {
    if (selectedHirer) {
      const hirer = frequentHirers.find(h => h.slug === selectedHirer);
      if (!hirer) return null;
      
      return (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedHirer(null)}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to all guides
          </button>
          
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-4xl">{hirer.icon}</div>
              <div>
                <h2 className="text-2xl font-bold text-white">{hirer.name}</h2>
                <p className="text-slate-400 mt-1">{hirer.tagline}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {hirer.apply_url && (
                <a
                  href={hirer.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  <Globe className="w-5 h-5" />
                  Apply Now
                  <ExternalLink className="w-4 h-4 ml-auto" />
                </a>
              )}
              {hirer.phone && (
                <a
                  href={`tel:${hirer.phone}`}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  {hirer.phone}
                </a>
              )}
              {hirer.address && (
                <div className="flex items-center gap-2 bg-slate-700 text-white px-4 py-3 rounded-lg">
                  <MapPin className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{hirer.address}</span>
                </div>
              )}
            </div>

            {hirer.quick_facts && (
              <div className="bg-slate-900 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  Quick Facts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {hirer.quick_facts.map((fact, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{fact}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div 
              className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-a:text-blue-400"
              dangerouslySetInnerHTML={{ __html: hirer.guide_html }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-blue-800">
          <h2 className="text-xl font-bold text-white mb-2">📋 Application Survival Guides</h2>
          <p className="text-slate-300">
            Step-by-step guides for high-volume employers. Each guide covers exactly how to apply, 
            what assessments to expect, common tech pitfalls, and tips for success.
          </p>
        </div>

        {hirersLoading ? (
          <div className="text-center py-12 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
            Loading guides...
          </div>
        ) : frequentHirers.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No guides available yet.</p>
            <p className="text-sm mt-2">Run the database seed script to add employer guides.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {frequentHirers.map(hirer => (
              <button
                key={hirer.slug}
                onClick={() => setSelectedHirer(hirer.slug)}
                className="bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-xl p-5 text-left transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{hirer.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {hirer.name}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{hirer.tagline}</p>
                    {hirer.category && (
                      <span className="inline-block mt-2 text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                        {hirer.category}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            CEO Fresno Fair Chance Job Board
          </h1>
          <p className="text-slate-400 mt-2">AI-powered job analysis for reentry employment</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
              activeTab === "jobs"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            <Search className="w-4 h-4" />
            Job Board
            <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
              {jobs.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("guides")}
            className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
              activeTab === "guides"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Frequent Hirers
            <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
              {frequentHirers.length}
            </span>
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-200 font-medium">Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="bg-emerald-900/50 border border-emerald-500 rounded-lg p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-200">{success}</p>
          </div>
        )}

        {activeTab === "guides" ? (
          renderFrequentHirersGuide()
        ) : (
          <>
            {/* Add Job Section */}
            <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Add Job
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setManualMode(false); setBulkMode(!bulkMode); }}
                    className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${bulkMode ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
                  >
                    <Upload className="w-4 h-4" /> Bulk Upload
                  </button>
                  <button
                    onClick={() => { setBulkMode(false); setManualMode(!manualMode); }}
                    className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${manualMode ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
                  >
                    <Edit3 className="w-4 h-4" /> Manual Entry
                  </button>
                </div>
              </div>

              {bulkMode ? (
                <div className="space-y-4">
                  <textarea
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    placeholder="Paste job URLs (one per line)..."
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 h-32 resize-none"
                  />
                  <button
                    onClick={handleBulkSubmit}
                    disabled={bulkProgress !== null}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    {bulkProgress ? `Processing ${bulkProgress.current}/${bulkProgress.total}...` : "Analyze All"}
                  </button>
                  {bulkProgress && bulkProgress.current === bulkProgress.total && (
                    <div className="mt-4 space-y-2">
                      {bulkProgress.results.map((r, i) => (
                        <div key={i} className={`text-sm p-2 rounded ${r.success ? "bg-emerald-900/30 text-emerald-300" : "bg-red-900/30 text-red-300"}`}>
                          {r.success ? `✓ ${r.title}` : `✗ ${r.error}`}
                        </div>
                      ))}
                      <button onClick={() => { setBulkProgress(null); setBulkUrls(""); }} className="text-sm text-slate-400 hover:text-white">
                        Clear results
                      </button>
                    </div>
                  )}
                </div>
              ) : manualMode ? (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Job URL</label>
                    <input
                      type="url"
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Job Description (copy & paste from the job page)</label>
                    <textarea
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      placeholder="Paste the full job description here..."
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 h-40 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !manualUrl.trim() || !manualDescription.trim()}
                    className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</> : "Analyze Manual Entry"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="Paste job posting URL..."
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loading || !newUrl.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Search className="w-4 h-4" /> Analyze</>}
                  </button>
                </form>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6 items-center">
              {/* Grade Filter */}
              <div className="relative">
                <button
                  onClick={() => { setGradeDropdownOpen(!gradeDropdownOpen); setCategoryDropdownOpen(false); }}
                  className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm hover:border-slate-500 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Grade {filterGrades.length > 0 && `(${filterGrades.length})`}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {gradeDropdownOpen && (
                  <div className="absolute top-full mt-1 bg-slate-800 border border-slate-600 rounded-lg p-2 z-10 min-w-[150px]">
                    {Object.entries(GRADES).map(([key, grade]) => (
                      <label key={key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700 rounded cursor-pointer">
                        <input type="checkbox" checked={filterGrades.includes(key)} onChange={(e) => e.target.checked ? setFilterGrades([...filterGrades, key]) : setFilterGrades(filterGrades.filter(g => g !== key))} className="w-4 h-4 rounded" />
                        <span className={`w-3 h-3 rounded-full ${grade.color}`}></span>
                        <span className="text-slate-300 text-sm">{grade.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Filter */}
              <div className="relative">
                <button
                  onClick={() => { setCategoryDropdownOpen(!categoryDropdownOpen); setGradeDropdownOpen(false); }}
                  className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm hover:border-slate-500 transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                  Category {filterCategories.length > 0 && `(${filterCategories.length})`}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {categoryDropdownOpen && (
                  <div className="absolute top-full mt-1 bg-slate-800 border border-slate-600 rounded-lg p-2 z-10 min-w-[200px]">
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                      <label key={key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700 rounded cursor-pointer">
                        <input type="checkbox" checked={filterCategories.includes(key)} onChange={(e) => e.target.checked ? setFilterCategories([...filterCategories, key]) : setFilterCategories(filterCategories.filter(c => c !== key))} className="w-4 h-4 rounded" />
                        <span className="text-slate-300 text-sm">{cat.icon} {cat.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Requirement Filters */}
              <div className="flex items-center gap-4 px-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filterNoDiploma} onChange={(e) => setFilterNoDiploma(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-slate-300 text-sm flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />No Diploma</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filterNoLicense} onChange={(e) => setFilterNoLicense(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-slate-300 text-sm flex items-center gap-1"><Car className="w-3.5 h-3.5" />No License</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filterExpiringSoon} onChange={(e) => setFilterExpiringSoon(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-slate-300 text-sm flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Expiring Soon</span>
                </label>
              </div>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
                <option value="date">Sort by Date</option>
                <option value="grade">Sort by Grade</option>
                <option value="expiring">Sort by Expiring</option>
              </select>

              <div className="ml-auto text-slate-400 text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />{filteredJobs.length} jobs
              </div>
            </div>

            {/* Job List */}
            <div className="space-y-3">
              {initialLoad ? (
                <div className="text-center py-12 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />Loading...
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No jobs found matching your filters.</p>
                </div>
              ) : (
                filteredJobs.map(job => {
                  const days = getDaysUntilExpiration(job.expirationDate);
                  const grade = GRADES[job.grade] || GRADES.good;
                  const category = CATEGORIES[job.category] || CATEGORIES.other;
                  const frequentHirerInfo = job.frequentHirer ? FREQUENT_HIRERS[job.frequentHirer] : null;
                  const hasGuide = frequentHirerInfo && frequentHirers.some(h => h.slug === job.frequentHirer);

                  return (
                    <div key={job.id} className={`bg-slate-800 rounded-xl p-5 border ${days !== null && days <= 3 ? "border-red-500/50" : "border-slate-700"} hover:border-slate-600 transition-colors`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-2 h-full min-h-[60px] rounded-full ${grade.color}`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-white truncate">{job.title}</h3>
                              <p className="text-slate-400 flex items-center gap-2 flex-wrap">
                                {job.company}
                                {job.location && <span className="text-slate-500">• {job.location}</span>}
                                {hasGuide && (
                                  <button
                                    onClick={() => { setSelectedHirer(job.frequentHirer); setActiveTab("guides"); }}
                                    className="inline-flex items-center gap-1 text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full hover:bg-blue-600/50 transition-colors"
                                  >
                                    <BookOpen className="w-3 h-3" />
                                    View Guide
                                  </button>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${grade.bgLight} ${grade.textColor}`}>
                                {grade.label}
                              </span>
                              <span className="text-slate-500 text-sm">{category.icon}</span>
                            </div>
                          </div>

                          {job.gradeReason && (
                            <p className="text-sm text-slate-500 mt-2 line-clamp-2">{job.gradeReason}</p>
                          )}

                          <div className="flex items-center gap-4 mt-3 flex-wrap">
                            <div className="flex items-center gap-3 text-xs">
                              <span className={`flex items-center gap-1 px-2 py-1 rounded border ${job.requiresDiploma ? "bg-amber-500/20 border-amber-500 text-amber-400" : "border-slate-600 text-slate-500"}`}>
                                <GraduationCap className="w-3 h-3" />
                                {job.requiresDiploma ? "Diploma Required" : "No Diploma"}
                              </span>
                              <span className={`flex items-center gap-1 px-2 py-1 rounded border ${job.requiresLicense ? "bg-amber-500/20 border-amber-500 text-amber-400" : "border-slate-600 text-slate-500"}`}>
                                <Car className="w-3 h-3" />
                                {job.requiresLicense ? "License Required" : "No License"}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-slate-500 ml-auto">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Posted {new Date(job.datePosted).toLocaleDateString()}
                              </span>
                              {days !== null && (
                                <span className={`flex items-center gap-1 ${days <= 3 ? "text-red-400" : days <= 7 ? "text-amber-400" : "text-slate-500"}`}>
                                  <Clock className="w-3 h-3" />
                                  {days <= 0 ? "Expired" : `${days}d left`}
                                </span>
                              )}
                              {job.salary && job.salary !== "Not listed" && (
                                <span className="text-emerald-400">{job.salary}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <a
                              href={job.directUrl || job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                            >
                              <ExternalLink className="w-4 h-4" /> View Job
                            </a>
                            <button
                              onClick={() => setEditingJob(job)}
                              className="text-slate-400 hover:text-white text-sm flex items-center gap-1 ml-4"
                            >
                              <Edit3 className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(job.id)}
                              className="text-slate-400 hover:text-red-400 text-sm flex items-center gap-1 ml-2"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Edit Modal */}
        {editingJob && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Edit Job</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingJob.title}
                    onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Company</label>
                  <input
                    type="text"
                    value={editingJob.company}
                    onChange={(e) => setEditingJob({ ...editingJob, company: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Grade</label>
                  <select
                    value={editingJob.grade}
                    onChange={(e) => setEditingJob({ ...editingJob, grade: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  >
                    {Object.entries(GRADES).map(([key, grade]) => (
                      <option key={key} value={key}>{grade.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingJob.requiresDiploma}
                      onChange={(e) => setEditingJob({ ...editingJob, requiresDiploma: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-slate-300">Requires Diploma</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingJob.requiresLicense}
                      onChange={(e) => setEditingJob({ ...editingJob, requiresLicense: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-slate-300">Requires License</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleUpdateJob(editingJob)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingJob(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
