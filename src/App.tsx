import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Users, 
  GraduationCap, 
  DollarSign, 
  User, 
  FileText, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Star,
  Clock,
  Building,
  Target,
  Award,
  TrendingUp,
  Loader2,
  RefreshCw,
  X,
  BookOpen, // New icon for courses
  Globe, // New icon for platform
  Clock4, // New icon for duration
  MonitorPlay, // New icon for educator
  Smile, // New icon for rating
  Trophy, // New icon for difficulty
  Tags // New icon for skills
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// --- Interfaces ---
interface CourseRecommendation {
  course_name: string;
  platform: string;
  duration: string;
  link: string;
  educator: string;
  skill_covered: string;
  difficulty_level: string;
  rating: string;
}

// UPDATED: BackendJob now includes a recommendations array
interface BackendJob {
  ncspjobid: string;
  title: string;
  match_percentage: number;
  similarity_score: number;
  keywords: string;
  description: string;
  date: string;
  organizationid: number;
  organization_name: string;
  numberofopenings: number;
  industryname: string;
  sectorname: string;
  functionalareaname: string;
  functionalrolename: string;
  aveexp: number;
  avewage: number;
  gendercode: string;
  highestqualification: string;
  statename: string;
  districtname: string;
  recommendations: CourseRecommendation[]; 
}

// UPDATED: Main API response now returns an array of jobs directly
interface ApiResponse {
  jobs: BackendJob[];
  // Global recommendations are no longer at the top level
}

interface ProcessedJob extends BackendJob {
  skillsArray: string[];
  genderText: string;
  experienceText: string;
  salaryText: string;
}

// --- Component Definition ---
const App: React.FC = () => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const inputRef = useRef<HTMLDivElement>(null);

  const [jobs, setJobs] = useState<ProcessedJob[]>([]);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [searchTrigger, setSearchTrigger] = useState<number>(0);

  const allSkills = useMemo(() => [
    'React', 'Python', 'JavaScript', 'SQL', 'Power BI', 'Machine Learning', 'Excel', 'Tableau', 'Node.js',
    'CSS', 'HTML', 'Data Analysis', 'Data Visualization', 'Redux', 'AWS', 'Docker', 'Kubernetes',
    'Java', 'C++', 'C#', 'TypeScript', 'Angular', 'Vue.js', 'MongoDB', 'PostgreSQL', 'Django',
    'Flask', 'Spring Boot', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch'
  ], []);

  const suggestions = useMemo(() => {
    if (!inputValue) return allSkills.slice(0, 8);
    return allSkills.filter(skill =>
      skill.toLowerCase().includes(inputValue.toLowerCase()) && !selectedSkills.includes(skill)
    ).slice(0, 8);
  }, [inputValue, allSkills, selectedSkills]);

  const addSkill = (skill: string) => {
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSelectedSkills(selectedSkills.filter(skill => skill !== skillToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();
      addSkill(inputValue);
    }
  };

  const handleSearchClick = () => {
    if (selectedSkills.length > 0) {
      setSearchTrigger(prev => prev + 1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // UPDATED: Process job data
  const processJobData = (backendJobs: BackendJob[]): ProcessedJob[] => {
    return backendJobs.map(job => ({
      ...job,
      skillsArray: job.keywords.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0),
      genderText: job.gendercode === 'A' ? 'Any' : job.gendercode === 'M' ? 'Male' : job.gendercode === 'F' ? 'Female' : 'Any',
      experienceText: job.aveexp ? `${job.aveexp} years` : 'Any',
      salaryText: job.avewage ? `₹${(job.avewage / 1000).toFixed(0)}K per month` : 'Not specified'
    }));
  };

  const fetchJobs = async (skills: string[]) => {
    setLoading(true);
    setError('');
    setJobs([]); // Clear previous jobs
    setExpandedJobs(new Set()); // Collapse all cards

    try {
      if (skills.length === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }
      
      console.log('Sending to backend:', { skills: skills, limit: 15 });

      const response = await fetch('http://localhost:8000/search_jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skills: skills,
          limit: 15 // Limit to 15 jobs
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // UPDATED: Handle the new response structure
      const data: ApiResponse = await response.json();
      console.log('Received jobs:', data.jobs);
      const processedJobs = processJobData(data.jobs || []);
      setJobs(processedJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to connect to backend. Showing demo data.');
      
      // UPDATED: Mock data now includes recommendations per job
      const mockJobs: BackendJob[] = [
        {
          ncspjobid: "20T85-2334143805041J",
          title: "Data Analyst",
          match_percentage: 95.0,
          similarity_score: 0.42050665616989136,
          keywords: "MS Excel,Power BI,Python,SQL",
          description: "Should speak Hindi. Python coding using Pandas & Lambda Expressions. Knowledge in MS SQL Server. Should have scored minimum 80% in Engineering. Looking for candidates with strong analytical skills and ability to work with large datasets.",
          date: "2025-07-30",
          organizationid: 6530846,
          organization_name: "Apna",
          numberofopenings: 80,
          industryname: "IT and Communication",
          sectorname: "Company",
          functionalareaname: "Data Analytics",
          functionalrolename: "Data Analyst",
          aveexp: 6.0,
          avewage: 15000.0,
          gendercode: "A",
          highestqualification: "Graduate",
          statename: "Andhra Pradesh",
          districtname: "Visakhapatnam",
          recommendations: [
            {
              course_name: "Python for Data Science",
              platform: "Coursera",
              duration: "6 weeks",
              link: "https://www.coursera.org/specializations/machine-learning-introduction",
              educator: "University of Michigan",
              skill_covered: "Python, Pandas, Data Analysis",
              difficulty_level: "Intermediate",
              rating: "4.8/5"
            },
            {
              course_name: "SQL for Data Science",
              platform: "Coursera",
              duration: "4 weeks",
              link: "https://www.coursera.org/learn/sql-for-data-science",
              educator: "University of California",
              skill_covered: "SQL",
              difficulty_level: "Beginner",
              rating: "4.7/5"
            }
          ]
        },
        {
          ncspjobid: "20T84-2340232902092J",
          title: "Senior Data Analyst",
          match_percentage: 88.0,
          similarity_score: 0.38050665616989136,
          keywords: "Python,SQL,Tableau,Data Visualization",
          description: "Experience with data visualization tools like Tableau or Power BI. Strong Python programming skills with libraries like Pandas, NumPy. Experience in SQL query optimization and database management.",
          date: "2025-07-29",
          organizationid: 6530847,
          organization_name: "TechCorp Solutions",
          numberofopenings: 5,
          industryname: "IT and Communication",
          sectorname: "Company",
          functionalareaname: "Data Analytics",
          functionalrolename: "Senior Data Analyst",
          aveexp: 8.0,
          avewage: 25000.0,
          gendercode: "A",
          highestqualification: "Post Graduate",
          statename: "Karnataka",
          districtname: "Bangalore",
          recommendations: [
            {
              course_name: "Advanced Tableau Course",
              platform: "Udemy",
              duration: "30 hours",
              link: "https://www.udemy.com/topic/tableau/",
              educator: "Various Instructors",
              skill_covered: "Tableau, Data Visualization",
              difficulty_level: "Advanced",
              rating: "4.6/5"
            }
          ]
        },
        {
          ncspjobid: "20T83-2340232902093J",
          title: "Frontend Developer",
          match_percentage: 82.0,
          similarity_score: 0.35050665616989136,
          keywords: "React,JavaScript,HTML,CSS,Node.js",
          description: "Looking for React developers with experience in modern frontend development. Should be proficient in JavaScript, HTML5, CSS3, and have knowledge of state management libraries like Redux.",
          date: "2025-07-28",
          organizationid: 6530848,
          organization_name: "WebTech Innovations",
          numberofopenings: 12,
          industryname: "IT and Communication",
          sectorname: "Company",
          functionalareaname: "Software Development",
          functionalrolename: "Frontend Developer",
          aveexp: 4.0,
          avewage: 18000.0,
          gendercode: "A",
          highestqualification: "Graduate",
          statename: "Maharashtra",
          districtname: "Pune",
          recommendations: [
            {
              course_name: "React - The Complete Guide",
              platform: "Udemy",
              duration: "40.5 hours",
              link: "https://www.udemy.com/course/react-the-complete-guide-incl-hooks-react-router-redux/",
              educator: "Maximilian Schwarzmüller",
              skill_covered: "React, Hooks, Redux",
              difficulty_level: "All Levels",
              rating: "4.7/5"
            },
            {
              course_name: "Complete JavaScript Course",
              platform: "Jonas Schmedtmann",
              duration: "69 hours",
              link: "https://www.udemy.com/course/the-complete-javascript-course-2023/",
              educator: "Jonas Schmedtmann",
              skill_covered: "JavaScript, ES6+",
              difficulty_level: "Beginner to Intermediate",
              rating: "4.8/5"
            }
          ]
        }
      ];
      
      const processedJobs = processJobData(mockJobs);
      setJobs(processedJobs);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTrigger > 0) {
      fetchJobs(selectedSkills);
    }
  }, [searchTrigger]);

  const handleApplyJob = (job: ProcessedJob) => {
    setNotification({
      message: `Successfully applied for ${job.title} at ${job.organization_name}!`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const toggleJobExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const getMatchScoreColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    if (score >= 40) return 'text-blue-700 bg-blue-50 border-blue-200';
    return 'text-slate-700 bg-slate-50 border-slate-200';
  };

  const getMatchScoreBadgeColor = (score: number): string => {
    if (score >= 80) return 'bg-gradient-to-r from-emerald-500 to-teal-500';
    if (score >= 60) return 'bg-gradient-to-r from-amber-500 to-orange-500';
    if (score >= 40) return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    return 'bg-gradient-to-r from-slate-500 to-gray-500';
  };

  const getMatchScoreIcon = (score: number) => {
    if (score >= 80) return <Award className="h-4 w-4" />;
    if (score >= 60) return <Star className="h-4 w-4" />;
    if (score >= 40) return <Target className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };
  
  // --- Main JSX Return ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans text-slate-900">
      
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 p-4 rounded-xl shadow-lg border backdrop-blur-md"
            role="alert"
          >
            <div className={`flex items-center gap-2 ${notification.type === 'success' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-700 bg-slate-50 border-slate-200'}`}>
                {notification.type === 'success' && <Award className="h-5 w-5" />}
                <span className="font-medium">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Indian emblem + Ministry logo */}
            <div className="flex items-center space-x-4">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/d/d4/Ministry_of_Labour_and_Employment.png"
                alt="Indian Emblem"
                className="h-12 w-auto object-contain"
              />
            </div>
            {/* Right Side - G20 logo */}
            <div>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3KvIDJaZXcLi0Xf7WZICZPhxdrNwaSZtPtw&s"
                alt="G20 Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
        <div className="relative py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Discover Your Dream Job
              </h2>
              <p className="text-xl text-indigo-100 mb-2">
                Enter your skills and let AI find the perfect matches
              </p>
              <p className="text-indigo-200">
                Our intelligent system analyzes your skills and recommends the best opportunities
              </p>
            </div>
            
            {/* Multi-Tag Input Component with Search Button */}
            <div className="relative z-40" ref={inputRef}>
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl -z-10"></div>
              <div className="relative bg-white/90 backdrop-blur-md rounded-2xl p-2 shadow-2xl flex flex-wrap items-center gap-2">
                
                {/* Render selected skills as tags */}
                {selectedSkills.map(skill => (
                  <motion.div
                    key={skill}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-1 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => removeSkill(skill)}
                      className="text-indigo-500 hover:text-indigo-800 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}

                {/* Input field for new skills */}
                <div className="flex-1 min-w-[150px] relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={selectedSkills.length === 0 ? "Enter your skills (e.g., React, Python, SQL...)" : ""}
                    className="w-full px-2 py-1 text-lg bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-slate-500"
                    disabled={loading}
                  />
                  {/* Autocomplete suggestions */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50"
                      >
                        {suggestions.map((skill) => (
                          <button
                            key={skill}
                            onClick={() => addSkill(skill)}
                            className="w-full text-left px-4 py-3 text-slate-700 hover:bg-indigo-50 transition-colors flex items-center gap-2"
                          >
                            <Target className="h-4 w-4 text-indigo-500" />
                            {skill}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Search Button */}
                <button
                  onClick={handleSearchClick}
                  disabled={loading || selectedSkills.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="h-6 w-6" />
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 text-center">
                <div className="bg-red-100/80 backdrop-blur-sm text-red-700 px-4 py-3 rounded-lg inline-flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {error} (Showing demo data)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {searchTrigger > 0 && selectedSkills.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {loading ? 'Searching...' : 'Recommended Jobs'}
                </h3>
                <p className="text-slate-600">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Finding best matches for "{selectedSkills.join(', ')}"
                    </span>
                  ) : (
                    `${jobs.length} jobs matching "${selectedSkills.join(', ')}"`
                  )}
                </p>
              </div>
              {jobs.length > 0 && !loading && (
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <Star className="h-4 w-4" />
                  <span>Sorted by match score</span>
                </div>
              )}
            </div>
          </div>
        )}

        {(selectedSkills.length === 0 || searchTrigger === 0) && !loading && (
          <div className="text-center py-20">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Start Your Job Search</h3>
              <p className="text-slate-600 text-lg">
                Enter your skills in the search bar above, then click the search button to discover personalized job recommendations.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {jobs.map((job) => (
            <div key={job.ncspjobid} className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/20">
              {/* Job Header */}
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-gradient-to-r from-slate-100 to-slate-200 p-4 rounded-xl">
                        <Building className="h-8 w-8 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-2xl font-bold text-slate-900">{job.title}</h4>
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getMatchScoreColor(job.match_percentage)}`}>
                            <div className="flex items-center gap-2">
                              {getMatchScoreIcon(job.match_percentage)}
                              {job.match_percentage}% Match
                            </div>
                          </span>
                        </div>
                        <p className="text-lg font-medium text-slate-700 mb-1">{job.organization_name}</p>
                        <p className="text-slate-600">{job.functionalrolename} • {job.numberofopenings} openings</p>
                      
                      </div>
                    </div>
                  </div>
                  <div className={`w-20 h-20 rounded-2xl ${getMatchScoreBadgeColor(job.match_percentage)} flex items-center justify-center text-white shadow-lg`}>
                    <div className="text-center">
                      <div className="text-xl font-bold">{Math.round(job.match_percentage)}%</div>
                      <div className="text-xs opacity-90">MATCH</div>
                    </div>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="flex items-center gap-3 p-4 bg-slate-50/80 rounded-xl">
                    <MapPin className="h-5 w-5 text-indigo-500" />
                    <div>
                      <div className="text-sm text-slate-500">Location</div>
                      <div className="font-semibold text-slate-700">{job.districtname}, {job.statename}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50/80 rounded-xl">
                    <Clock className="h-5 w-5 text-emerald-500" />
                    <div>
                      <div className="text-sm text-slate-500">Experience</div>
                      <div className="font-semibold text-slate-700">{job.experienceText}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50/80 rounded-xl">
                    <DollarSign className="h-5 w-5 text-amber-500" />
                    <div>
                      <div className="text-sm text-slate-500">Salary</div>
                      <div className="font-semibold text-slate-700">{job.salaryText}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50/80 rounded-xl">
                    <GraduationCap className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="text-sm text-slate-500">Education</div>
                      <div className="font-semibold text-slate-700">{job.highestqualification}</div>
                    </div>
                  </div>
                </div>

                {/* Skills Tags */}
                <div className="mb-6">
                  <h5 className="text-sm font-semibold text-slate-600 mb-3">Required Skills</h5>
                  <div className="flex flex-wrap gap-2">
                    {job.skillsArray.map((skill, index) => {
                      const isMatched = selectedSkills.some(term => 
                        term.toLowerCase() === skill.toLowerCase()
                      );
                      return (
                        <span 
                          key={index} 
                          className={`px-4 py-2 rounded-full text-sm font-medium border ${
                            isMatched 
                              ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200' 
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {skill}
                          {isMatched && <Star className="inline h-3 w-3 ml-1" />}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleJobExpansion(job.ncspjobid)}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                  >
                    <FileText className="h-4 w-4" />
                    {expandedJobs.has(job.ncspjobid) ? 'Hide Details' : 'View Details'}
                    {expandedJobs.has(job.ncspjobid) ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                    }
                  </button>
                  <div className="flex gap-3">
                    <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105">
                      Save Job
                    </button>
                    <button
                      onClick={() => handleApplyJob(job)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 shadow-lg"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Details */}
              {expandedJobs.has(job.ncspjobid) && (
                <div className="border-t border-slate-200 bg-slate-50/80 backdrop-blur-sm">
                  <div className="p-8">
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-6">
                        <div className="bg-white/60 p-6 rounded-xl">
                          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-indigo-500" />
                            Job Details
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Industry:</span>
                              <span className="font-medium text-slate-900">{job.industryname}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Sector:</span>
                              <span className="font-medium text-slate-900">{job.sectorname}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Functional Area:</span>
                              <span className="font-medium text-slate-900">{job.functionalareaname}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Posted Date:</span>
                              <span className="font-medium text-slate-900">{formatDate(job.date)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Gender:</span>
                              <span className="font-medium text-slate-900">{job.genderText}</span>
                            </div>
                           
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-white/60 p-6 rounded-xl">
                          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Target className="h-5 w-5 text-emerald-500" />
                            Match Analysis
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 text-sm">Overall Match</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-slate-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${job.match_percentage >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : job.match_percentage >= 60 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                                    style={{ width: `${job.match_percentage}%` }}
                                  ></div>
                                </div>
                                <span className="font-bold text-slate-900">{Math.round(job.match_percentage)}%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 text-sm">Similarity Score</span>
                              <span className="font-medium text-slate-900">{(job.similarity_score * 100).toFixed(1)}%</span>
                            </div>
                            <div className="text-xs text-slate-500">
                              Based on skills, experience, and role relevance
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/60 p-6 rounded-xl mb-6">
                      <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-500" />
                        Job Description
                      </h4>
                      <p className="text-slate-700 leading-relaxed">{job.description}</p>
                    </div>

                    {/* NEW: Course Recommendations Section within the job details */}
                    {job.recommendations.length > 0 && (
                      <div className="bg-white/60 p-6 rounded-xl mb-6">
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-indigo-500" />
                          Recommended Courses
                        </h4>
                        <p className="text-sm text-slate-600 mb-4">
                          These courses can help you acquire the skills needed for this role.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                          {job.recommendations.map((course, index) => (
                            <a
                              key={index}
                              href={course.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block bg-slate-50/80 rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                  <BookOpen className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    {course.course_name}
                                  </h5>
                                  <p className="text-sm text-slate-700 mt-1">{course.platform}</p>
                                </div>
                                <ExternalLink className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                              </div>
                              <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                  <Tags className="h-4 w-4" />
                                  <span>{course.skill_covered}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock4 className="h-4 w-4" />
                                  <span>{course.duration}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Trophy className="h-4 w-4" />
                                  <span>{course.difficulty_level}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Smile className="h-4 w-4" />
                                  <span>{course.rating}</span>
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                      <div className={`px-6 py-3 rounded-xl border ${getMatchScoreColor(job.match_percentage)}`}>
                        <div className="flex items-center gap-2">
                          {getMatchScoreIcon(job.match_percentage)}
                          <span className="font-bold">Match Score: {Math.round(job.match_percentage)}%</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => toggleJobExpansion(job.ncspjobid)}
                          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors duration-200"
                        >
                          Collapse Details
                        </button>
                        <button
                          onClick={() => handleApplyJob(job)}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105 shadow-lg"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Apply for This Job
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {jobs.length === 0 && searchTrigger > 0 && !loading && (
          <div className="text-center py-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-slate-400 to-slate-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">No Jobs Found</h3>
              <p className="text-slate-600 text-lg mb-6">
                We couldn't find any jobs matching "{selectedSkills.join(', ')}". Try adjusting your search terms or explore different skills.
              </p>
              <div className="space-y-4">
                <p className="text-sm text-slate-500 mb-4">Try searching for:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Data Analysis', 'Python', 'SQL', 'Machine Learning', 'React', 'JavaScript'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => addSkill(suggestion)}
                      className="bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-700 px-4 py-2 rounded-full text-sm transition-all duration-200 hover:scale-105"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Searching for Jobs...</h3>
              <p className="text-slate-600 text-lg">
                Our AI is analyzing your skills and finding the best matches. This won't take long!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
