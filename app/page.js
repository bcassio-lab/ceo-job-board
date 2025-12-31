"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Plus, ExternalLink, Trash2, RefreshCw, Calendar, Award, AlertCircle, CheckCircle, Users, Briefcase, ChevronDown, ChevronUp, Share2, Check, GraduationCap, Car, Clock } from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const JOB_EXPIRY_DAYS = 21;

const EXPERIENCE_CATEGORIES = {
  construction: { label: 'Construction/Trades', color: 'bg-orange-100 text-orange-800', icon: '🔨' },
  warehouse: { label: 'Warehouse/Logistics', color: 'bg-blue-100 text-blue-800', icon: '📦' },
  transportation: { label: 'Transportation/CDL', color: 'bg-purple-100 text-purple-800', icon: '🚛' },
  foodservice: { label: 'Food Service', color: 'bg-green-100 text-green-800', icon: '🍽️' },
  hospitality: { label: 'Hospitality', color: 'bg-pink-100 text-pink-800', icon: '🏨' },
  custodial: { label: 'Custodial/Maintenance', color: 'bg-teal-100 text-teal-800', icon: '🧹' },
  other: { label: 'Other Entry-Level', color: 'bg-gray-100 text-gray-800', icon: '💼' }
};

const GRADE_INFO = {
  best: { label: 'Best', color: 'bg-emerald-500', textColor: 'text-emerald-700', desc: 'Fair Chance Encouraged', stars: 5 },
  better: { label: 'Better', color: 'bg-green-400', textColor: 'text-green-700', desc: 'Public EEO Statement', stars: 4 },
  good: { label: 'Good', color: 'bg-yellow-400', textColor: 'text-yellow-700', desc: 'No Background Check Mentioned', stars: 3 },
  fair: { label: 'Fair', color: 'bg-orange-400', textColor: 'text-orange-700', desc: 'Background Check - Some Felonies OK', stars: 2 },
  poor: { label: 'Poor', color: 'bg-red-400', textColor: 'text-red-700', desc: 'Not Recommended for Backgrounds', stars: 1 }
};

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [url, setUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [errorLog, setErrorLog] = useState([]);
  const [showErrorLog, setShowErrorLog] = useState(false);
  const [success, setSuccess] = useState('');
  const [filterGrades, setFilterGrades] = useState([]);
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterNoDiploma, setFilterNoDiploma] = useState(false);
  const [filterNoLicense, setFilterNoLicense] = useState(false);
  const [filterExpiringSoon, setFilterExpiringSoon] = useState(false);
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [expandedJob, setExpandedJob] = useState(null);
  const [copied, setCopied] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    loadJobs();
    // Set up real-time subscription
    const channel = supabase
      .channel('jobs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        loadJobs();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.grade-dropdown') && !e.target.closest('.category-dropdown')) {
        setGradeDropdownOpen(false);
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadJobs = async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - JOB_EXPIRY_DAYS);
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .gte('date_posted', cutoffDate.toISOString().split('T')[0])
        .order('date_posted', { ascending: false });

      if (error) throw error;
      
      const formattedJobs = data.map(job => ({
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
        needsReview: job.needs_review
      }));
      
      setJobs(formattedJobs);
    } catch (e) {
      console.error('Error loading jobs:', e);
    }
    setInitialLoad(false);
  };

  const saveJob = async (job) => {
    try {
      const { error } = await supabase.from('jobs').insert({
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
        expiration_date: job.expirationDate,
        submitted_at: job.submittedAt,
        submitted_by: job.submittedBy,
        needs_review: job.needsReview
      });
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error saving job:', e);
      return false;
    }
  };

  const analyzeJobUrl = async (jobUrl, existingUrls) => {
    try { new URL(jobUrl); } catch {
      return { error: 'Invalid URL format', url: jobUrl, troubleshoot: 'Make sure the URL includes https://' };
    }
    if (existingUrls.some(u => u === jobUrl)) {
      return { error: 'Duplicate URL', url: jobUrl, troubleshoot: 'This job has already been added' };
    }
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl })
      });
      if (!response.ok) {
        return { error: 'API request failed', url: jobUrl, troubleshoot: `Server returned ${response.status}. Try again.` };
      }
      const data = await response.json();
      if (data.error) {
        return { error: data.error, url: jobUrl, troubleshoot: data.troubleshoot || 'Unknown error', canAddAnyway: data.canAddAnyway };
      }
      return { success: true, job: data.job };
    } catch (e) {
      return { error: 'Network error', url: jobUrl, troubleshoot: 'Check your internet connection' };
    }
  };

  const analyzeJob = async () => {
    if (bulkMode) {
      const urls = bulkUrls.split(/[\n,]+/).map(u => u.trim()).filter(u => u.length > 0);
      if (urls.length === 0) { setError('Please enter at least one URL'); return; }
      setAnalyzing(true); setError(''); setSuccess(''); setErrorLog([]);
      setAnalyzeProgress({ current: 0, total: urls.length });
      const existingUrls = jobs.flatMap(j => [j.url, j.directUrl]);
      const newJobs = []; const errors = [];
      for (let i = 0; i < urls.length; i++) {
        setAnalyzeProgress({ current: i + 1, total: urls.length });
        const result = await analyzeJobUrl(urls[i], [...existingUrls, ...newJobs.map(j => j.url)]);
        if (result.success) {
          const saved = await saveJob(result.job);
          if (saved) newJobs.push(result.job);
        } else {
          errors.push({ url: result.url, error: result.error, troubleshoot: result.troubleshoot, canAddAnyway: result.canAddAnyway });
        }
      }
      setBulkUrls(''); setAnalyzing(false);
      if (errors.length > 0) { setErrorLog(errors); setShowErrorLog(true); }
      if (newJobs.length > 0 && errors.length === 0) {
        setSuccess(`Successfully added ${newJobs.length} job${newJobs.length > 1 ? 's' : ''}`);
      } else if (newJobs.length > 0) {
        setSuccess(`Added ${newJobs.length} job${newJobs.length > 1 ? 's' : ''}. ${errors.length} failed.`);
      } else if (errors.length > 0) {
        setError(`All ${errors.length} URLs failed - see error log.`);
      }
      loadJobs();
    } else {
      if (!url.trim()) { setError('Please enter a job URL'); return; }
      setAnalyzing(true); setError(''); setSuccess(''); setErrorLog([]);
      const existingUrls = jobs.flatMap(j => [j.url, j.directUrl]);
      const result = await analyzeJobUrl(url, existingUrls);
      if (result.success) {
        const saved = await saveJob(result.job);
        if (saved) {
          setUrl('');
          setSuccess(`Successfully added: ${result.job.title} at ${result.job.company}`);
          loadJobs();
        }
      } else {
        setErrorLog([{ url: result.url, error: result.error, troubleshoot: result.troubleshoot, canAddAnyway: result.canAddAnyway }]);
        setShowErrorLog(true);
        setError(`Failed: ${result.error}`);
      }
      setAnalyzing(false);
    }
  };

  const removeJob = async (jobId) => {
    await supabase.from('jobs').delete().eq('id', jobId);
    loadJobs();
  };

  const addJobManually = async (errorItem) => {
    const newJob = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      url: errorItem.url, directUrl: errorItem.url,
      title: 'Unknown Position - Needs Review', company: 'Unknown Company',
      location: 'Location not specified', grade: 'good',
      gradeReason: 'Unable to analyze - added manually', category: 'other',
      ceoMatch: 'Manual review needed', salary: 'Not listed',
      requiresDiploma: false, requiresLicense: false,
      datePosted: new Date().toISOString().split('T')[0], expirationDate: null,
      submittedAt: new Date().toISOString(), submittedBy: 'CEO Fresno Staff', needsReview: true
    };
    await saveJob(newJob);
    setErrorLog(errorLog.filter(e => e.url !== errorItem.url));
    if (errorLog.length <= 1) setShowErrorLog(false);
    setSuccess(`Added for manual review`);
    loadJobs();
  };

  const markAsReviewed = async (jobId) => {
    await supabase.from('jobs').update({ needs_review: false }).eq('id', jobId);
    loadJobs();
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDaysRemaining = (datePosted) => {
    const posted = new Date(datePosted);
    const now = new Date();
    const daysPassed = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
    return JOB_EXPIRY_DAYS - daysPassed;
  };

  const filteredJobs = jobs
    .filter(job => filterGrades.length === 0 || filterGrades.includes(job.grade))
    .filter(job => filterCategories.length === 0 || filterCategories.includes(job.category))
    .filter(job => !filterNoDiploma || !job.requiresDiploma)
    .filter(job => !filterNoLicense || !job.requiresLicense)
    .filter(job => !filterExpiringSoon || getDaysRemaining(job.datePosted) <= 7)
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.datePosted) - new Date(a.datePosted);
      if (sortBy === 'grade') {
        const order = ['best', 'better', 'good', 'fair', 'poor'];
        return order.indexOf(a.grade) - order.indexOf(b.grade);
      }
      if (sortBy === 'expiring') return getDaysRemaining(a.datePosted) - getDaysRemaining(b.datePosted);
      return 0;
    });

  const GradeBadge = ({ grade }) => {
    const info = GRADE_INFO[grade] || GRADE_INFO.good;
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white ${info.color}`}>
        {'★'.repeat(info.stars)}<span className="ml-1">{info.label}</span>
      </div>
    );
  };

  const CategoryBadge = ({ category }) => {
    const cat = EXPERIENCE_CATEGORIES[category] || EXPERIENCE_CATEGORIES.other;
    return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cat.color}`}>{cat.icon} {cat.label}</span>;
  };

  const ExpiryBadge = ({ datePosted }) => {
    const daysRemaining = getDaysRemaining(datePosted);
    let colorClass = 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    let label = `${daysRemaining}d left`;
    if (daysRemaining <= 3) { colorClass = 'bg-red-500/20 text-red-400 border-red-500/30'; label = daysRemaining <= 0 ? 'Expiring today' : `${daysRemaining}d left`; }
    else if (daysRemaining <= 7) { colorClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30'; }
    return <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border ${colorClass}`}><Clock className="w-3 h-3" />{label}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 px-4 py-2 rounded-full mb-3">
            <Award className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-medium text-sm">Fair Chance Employment</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">CEO Fresno Job Board</h1>
          <p className="text-slate-400 text-sm">Curated opportunities for returning citizens • Updated live</p>
          <button onClick={copyShareLink} className="mt-3 inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Link copied!' : 'Share this board'}
          </button>
        </div>

        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-5 mb-6 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />Submit {bulkMode ? 'Multiple Jobs' : 'a Job'}
            </h2>
            <button onClick={() => setBulkMode(!bulkMode)} className={`text-xs px-3 py-1.5 rounded-full transition-colors ${bulkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
              {bulkMode ? '← Single URL' : 'Bulk Upload →'}
            </button>
          </div>
          {bulkMode ? (
            <div className="space-y-3">
              <textarea value={bulkUrls} onChange={(e) => setBulkUrls(e.target.value)} placeholder="Paste multiple job URLs (one per line or comma-separated)..." rows={4} className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none font-mono text-sm" />
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">{bulkUrls.split(/[\n,]+/).filter(u => u.trim()).length} URLs detected</span>
                <button onClick={analyzeJob} disabled={analyzing} className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                  {analyzing ? <><RefreshCw className="w-4 h-4 animate-spin" />Analyzing {analyzeProgress.current}/{analyzeProgress.total}...</> : <><Search className="w-4 h-4" />Analyze All</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste job posting URL here..." className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" onKeyPress={(e) => e.key === 'Enter' && analyzeJob()} />
              <button onClick={analyzeJob} disabled={analyzing} className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
                {analyzing ? <><RefreshCw className="w-4 h-4 animate-spin" />Analyzing...</> : <><Search className="w-4 h-4" />Analyze</>}
              </button>
            </div>
          )}
          {error && <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg"><AlertCircle className="w-4 h-4" />{error}</div>}
          {success && <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 px-3 py-2 rounded-lg"><CheckCircle className="w-4 h-4" />{success}</div>}
          {errorLog.length > 0 && (
            <div className="mt-3 bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
              <button onClick={() => setShowErrorLog(!showErrorLog)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800/50">
                <span className="text-red-400 text-sm font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4" />Error Log ({errorLog.length})</span>
                {showErrorLog ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {showErrorLog && (
                <div className="border-t border-slate-700 max-h-64 overflow-y-auto">
                  {errorLog.map((err, idx) => (
                    <div key={idx} className="px-3 py-3 border-b border-slate-700/50 last:border-b-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-red-400 text-xs font-semibold bg-red-500/20 px-1.5 py-0.5 rounded">{err.error}</span>
                        {err.canAddAnyway && <button onClick={() => addJobManually(err)} className="text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-2 py-1 rounded flex items-center gap-1"><Plus className="w-3 h-3" />Add Anyway</button>}
                      </div>
                      <a href={err.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 text-xs mt-1 block truncate hover:text-slate-300">{err.url}</a>
                      <div className="mt-2 flex items-start gap-2 text-xs"><span className="text-amber-400 font-medium">💡 Fix:</span><span className="text-slate-400">{err.troubleshoot}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-800/30 rounded-xl p-4 mb-6 border border-slate-700/50">
          <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Fair Chance Rating Guide</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(GRADE_INFO).map(([key, info]) => (
              <div key={key} className="flex items-center gap-2 text-xs"><GradeBadge grade={key} /><span className="text-slate-500">{info.desc}</span></div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative grade-dropdown">
            <button onClick={() => { setGradeDropdownOpen(!gradeDropdownOpen); setCategoryDropdownOpen(false); }} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 flex items-center gap-2 min-w-[140px]">
              <span>{filterGrades.length === 0 ? 'All Grades' : `${filterGrades.length} Grade${filterGrades.length > 1 ? 's' : ''}`}</span>
              <ChevronDown className="w-4 h-4 ml-auto" />
            </button>
            {gradeDropdownOpen && (
              <div className="absolute z-20 mt-1 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl">
                <div className="p-2 border-b border-slate-700"><button onClick={() => setFilterGrades([])} className="text-xs text-slate-400 hover:text-emerald-400">Clear all</button></div>
                {Object.entries(GRADE_INFO).map(([key, info]) => (
                  <label key={key} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-700/50 cursor-pointer">
                    <input type="checkbox" checked={filterGrades.includes(key)} onChange={(e) => e.target.checked ? setFilterGrades([...filterGrades, key]) : setFilterGrades(filterGrades.filter(g => g !== key))} className="w-4 h-4 rounded" />
                    <span className={`${info.color} text-white text-xs px-1.5 py-0.5 rounded`}>{'★'.repeat(info.stars)}</span>
                    <span className="text-slate-300 text-sm">{info.desc}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="relative category-dropdown">
            <button onClick={() => { setCategoryDropdownOpen(!categoryDropdownOpen); setGradeDropdownOpen(false); }} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 flex items-center gap-2 min-w-[160px]">
              <span>{filterCategories.length === 0 ? 'All Categories' : `${filterCategories.length} Categor${filterCategories.length > 1 ? 'ies' : 'y'}`}</span>
              <ChevronDown className="w-4 h-4 ml-auto" />
            </button>
            {categoryDropdownOpen && (
              <div className="absolute z-20 mt-1 w-56 bg-slate-800 border border-slate-600 rounded-lg shadow-xl">
                <div className="p-2 border-b border-slate-700"><button onClick={() => setFilterCategories([])} className="text-xs text-slate-400 hover:text-emerald-400">Clear all</button></div>
                {Object.entries(EXPERIENCE_CATEGORIES).map(([key, cat]) => (
                  <label key={key} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-700/50 cursor-pointer">
                    <input type="checkbox" checked={filterCategories.includes(key)} onChange={(e) => e.target.checked ? setFilterCategories([...filterCategories, key]) : setFilterCategories(filterCategories.filter(c => c !== key))} className="w-4 h-4 rounded" />
                    <span className="text-slate-300 text-sm">{cat.icon} {cat.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
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
          <div className="ml-auto text-slate-400 text-sm flex items-center gap-2"><Users className="w-4 h-4" />{filteredJobs.length} jobs</div>
        </div>

        <div className="space-y-3">
          {initialLoad ? (
            <div className="text-center py-12 text-slate-400"><RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />Loading...</div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No jobs found</p>
            </div>
          ) : filteredJobs.map(job => (
            <div key={job.id} className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <GradeBadge grade={job.grade} />
                      <CategoryBadge category={job.category} />
                      {job.needsReview && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30"><AlertCircle className="w-3 h-3" />Needs Review</span>}
                    </div>
                    <h3 className="text-white font-semibold text-lg truncate">{job.title}</h3>
                    <p className="text-slate-400 text-sm">{job.company} • {job.location}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Posted {new Date(job.datePosted).toLocaleDateString()}</span>
                      <ExpiryBadge datePosted={job.datePosted} />
                      {job.salary !== 'Not listed' && <span className="text-emerald-400">{job.salary}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <label className="flex items-center gap-1.5 text-xs">
                        <span className={`flex items-center justify-center w-4 h-4 rounded border ${job.requiresDiploma ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-slate-600 text-slate-600'}`}>{job.requiresDiploma && <Check className="w-3 h-3" />}</span>
                        <span className={job.requiresDiploma ? 'text-amber-400' : 'text-slate-500'}><GraduationCap className="w-3 h-3 inline mr-1" />Diploma/GED</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs">
                        <span className={`flex items-center justify-center w-4 h-4 rounded border ${job.requiresLicense ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-slate-600 text-slate-600'}`}>{job.requiresLicense && <Check className="w-3 h-3" />}</span>
                        <span className={job.requiresLicense ? 'text-amber-400' : 'text-slate-500'}><Car className="w-3 h-3 inline mr-1" />License</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={job.directUrl} target="_blank" rel="noopener noreferrer" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1">Apply <ExternalLink className="w-3 h-3" /></a>
                    <button onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)} className="p-2 text-slate-400 hover:text-white">
                      {expandedJob === job.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {expandedJob === job.id && (
                  <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                    {job.needsReview && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm">
                        <p className="text-amber-400 font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4" />Manual Review Required</p>
                        <p className="text-slate-400 text-xs mt-1">Click "Apply" to verify details, then "Mark Reviewed" when done.</p>
                      </div>
                    )}
                    <div><h4 className="text-emerald-400 text-xs uppercase tracking-wider mb-1">Fair Chance Rating Reason</h4><p className="text-slate-300 text-sm">{job.gradeReason}</p></div>
                    <div><h4 className="text-emerald-400 text-xs uppercase tracking-wider mb-1">CEO Participant Match</h4><p className="text-slate-300 text-sm">{job.ceoMatch}</p></div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-slate-500 text-xs">Submitted {new Date(job.submittedAt).toLocaleDateString()}</span>
                      <div className="flex items-center gap-3">
                        {job.needsReview && <button onClick={() => markAsReviewed(job.id)} className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />Mark Reviewed</button>}
                        <button onClick={() => removeJob(job.id)} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"><Trash2 className="w-3 h-3" />Remove</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-slate-500 text-xs">
          <p>Center for Employment Opportunities • Fresno, CA</p>
          <p className="mt-1">Jobs expire after 3 weeks • Shared list updates in real-time</p>
        </div>
      </div>
    </div>
  );
}
