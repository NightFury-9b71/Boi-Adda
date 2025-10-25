import React, { useState, useEffect } from 'react';
import { 
  Code, 
  Coffee, 
  Heart, 
  Github, 
  Mail, 
  Phone,
  MapPin,
  Sparkles, 
  Terminal, 
  Zap, 
  ExternalLink,
  Calendar,
  Award,
  BookOpen,
  Users,
  ChevronRight,
  Download,
  Send,
  Trophy,
  GraduationCap,
  Briefcase,
  Smartphone,
  Globe,
  Bot,
  Cpu,
  Filter,
  ArrowUpRight,
  Menu,
  X
} from 'lucide-react';

const DeveloperPage = () => {
  const [activeTab, setActiveTab] = useState('about');
  const [projectFilter, setProjectFilter] = useState('all');
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const skills = ['Full-Stack Developer', 'React Specialist', 'AI/ML Enthusiast', 'Problem Solver', 'Community Leader'];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(false);
      setTimeout(() => {
        setCurrentSkillIndex((prev) => (prev + 1) % skills.length);
        setIsTyping(true);
      }, 500);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const projects = [
    {
      id: 1,
      title: "Boi Adda",
      description: "A full-stack book sharing platform where users can share, exchange, and discover books. Features user authentication, book listings, search functionality, and community interactions.",
      category: "web",
      status: "live",
      year: "2024",
      role: "Full-Stack Developer",
      tech: ["React", "FastAPI", "SQLModel", "PostgreSQL", "JWT", "Tailwind CSS"],
      liveUrl: "https://boi-adda.onrender.com/",
      sourceUrl: "https://github.com/nightfury-9b71/boi-adda",
      featured: true
    },
    {
      id: 2,
      title: "Science Point",
      description: "Comprehensive coaching management system for educational institutions. Includes student enrollment, attendance tracking, course management, payment processing, and performance analytics.",
      category: "web",
      status: "live",
      year: "2024",
      role: "Full-Stack Developer",
      tech: ["React", "FastAPI", "SQLModel", "PostgreSQL", "Redux", "Material-UI"],
      liveUrl: "https://science-point.onrender.com/",
      sourceUrl: "https://github.com/nightfury-9b71/science-point",
      featured: true
    },
    {
      id: 3,
      title: "FakeNewsDetection",
      description: "Intelligent fake news detection system using BERT model and web scraping. Analyzes news articles, extracts features, and classifies content authenticity with high accuracy.",
      category: "ai",
      status: "complete",
      year: "2024",
      role: "Full-Stack Developer",
      tech: ["Python", "BERT", "Flask", "Beautiful Soup", "TensorFlow", "React", "NLP"],
      sourceUrl: "https://github.com/nightfury-9b71/fake-news-detection",
      featured: true
    },
    {
      id: 4,
      title: "AutoDocs",
      description: "Automated certificate generation website that streamlines the process of creating and distributing certificates for events, competitions, and courses. Supports bulk generation and customization.",
      category: "web",
      status: "live",
      year: "2024",
      role: "Frontend Developer",
      tech: ["React", "Node.js", "Canvas API", "PDF Generation", "Express"],
      liveUrl: "https://auto-docs.onrender.com",
    },
    {
      id: 5,
      title: "NewsPlus BD",
      description: "AI-powered news summarizer that aggregates news from multiple Bangladeshi sources and provides concise summaries. Features categorization, trending topics, and personalized feeds.",
      category: "ai",
      status: "complete",
      year: "2023",
      role: "Backend Developer",
      tech: ["Python", "Flask", "NLP", "Web Scraping", "Beautiful Soup", "MongoDB"],
      sourceUrl: "https://github.com/nightfury-9b71/newspulse-bd",
    },
    {
      id: 6,
      title: "Bit-Talker",
      description: "Desktop messaging application built with PyQt featuring real-time chat, file sharing, group conversations, and end-to-end encryption. Cross-platform support for Windows, Linux, and macOS.",
      category: "desktop",
      status: "complete",
      year: "2023",
      role: "Full-Stack Developer",
      tech: ["Python", "PyQt5", "Socket.io", "SQLite", "Threading"],
      sourceUrl: "https://github.com/nightfury-9b71/bit-talker",
    },
    {
      id: 7,
      title: "Chess Playing Robotic Arm",
      description: "IoT project featuring a robotic arm designed to play chess. Includes computer vision for piece detection, path planning algorithms, and servo motor control. A learning experience in hardware-software integration.",
      category: "iot",
      status: "experimental",
      year: "2023",
      role: "Hardware & Software Developer",
      tech: ["Arduino", "Python", "OpenCV", "Servo Motors", "Computer Vision"],
      sourceUrl: "https://github.com/nightfury-9b71/chess-robot",
    }
  ];

  const achievements = [
    {
      title: "Datathon - Khulna University",
      rank: "6th out of 120 participants",
      year: "2024",
      type: "Competition",
      description: "Competed in a data science competition focusing on real-world problem solving with data analysis and machine learning techniques."
    },
    {
      title: "Hackathon - Green University",
      rank: "41st out of 247 participants",
      year: "2024",
      type: "Competition",
      description: "Participated in a 24-hour hackathon building innovative solutions with a team of developers."
    },
    {
      title: "CTF Competition - BUET",
      rank: "52nd out of 70 participants",
      year: "2024",
      type: "Competition",
      description: "Capture The Flag cybersecurity competition organized by BUET, solving challenges in cryptography, web security, and reverse engineering."
    }
  ];

  const filteredProjects = projects.filter(project => 
    projectFilter === 'all' || project.category === projectFilter
  );

  const ProjectCard = ({ project }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden group">
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
          <div className="text-green-600 text-lg font-semibold">{project.title}</div>
        </div>
        {project.featured && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
            Featured
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/95 hover:bg-white text-gray-700 hover:text-green-600 p-2 rounded-full transition-all shadow-sm"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {project.sourceUrl && (
            <a
              href={project.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/95 hover:bg-white text-gray-700 hover:text-green-600 p-2 rounded-full transition-all shadow-sm"
            >
              <Github className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
            {project.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            {project.year}
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            {project.role}
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            project.status === 'live' ? 'bg-green-100 text-green-700' :
            project.status === 'complete' ? 'bg-blue-100 text-blue-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {project.status}
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {project.description}
        </p>
        
        <div className="flex flex-wrap gap-2">
          {project.tech.slice(0, 4).map((tech) => (
            <span key={tech} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              {tech}
            </span>
          ))}
          {project.tech.length > 4 && (
            <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
              +{project.tech.length - 4} more
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrollY > 50 ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-full transition-all duration-300 ${
                  scrollY > 50 ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-white/20 backdrop-blur-sm'
                }`}
              >
                <Code className="h-6 w-6 text-white" />
              </div>
              <span
                className={`text-2xl font-bold transition-colors duration-300 ${
                  scrollY > 50
                    ? 'bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent'
                    : 'text-white'
                }`}
              >
                Portfolio
              </span>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {[
                { id: 'about', label: 'About' },
                { id: 'projects', label: 'Projects' },
                { id: 'achievements', label: 'Achievements' },
                { id: 'contact', label: 'Contact' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    document.getElementById(tab.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`transition-colors font-medium ${
                    scrollY > 50 ? 'text-gray-700 hover:text-green-600' : 'text-white/90 hover:text-white'
                  } ${activeTab === tab.id ? 'text-green-600' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`transition-colors ${
                  scrollY > 50 ? 'text-gray-700 hover:text-green-600' : 'text-white hover:text-green-300'
                }`}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 shadow-md">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {[
                  { id: 'about', label: 'About' },
                  { id: 'projects', label: 'Projects' },
                  { id: 'achievements', label: 'Achievements' },
                  { id: 'contact', label: 'Contact' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                      document.getElementById(tab.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-green-600 transition-colors"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white min-h-screen flex items-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 animate-pulse">
            <Sparkles className="h-8 w-8 text-green-400" />
          </div>
          <div className="absolute bottom-10 left-10 animate-bounce">
            <Code className="h-6 w-6 text-blue-400" />
          </div>
          <div className="absolute top-1/2 right-1/4 animate-pulse">
            <Terminal className="h-6 w-6 text-yellow-400" />
          </div>
          <div className="absolute top-1/4 left-1/3 animate-ping">
            <Zap className="h-4 w-4 text-purple-400" />
          </div>
        </div>

        <div className="absolute inset-0 bg-black opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-green-600 mx-auto mb-6 transform hover:scale-110 transition-all duration-300 shadow-xl overflow-hidden">
                <img
                  src="/me.jpg"
                  alt="Abdullah Al Noman"
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                Hello, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-200 to-white">Abdullah Al Noman</span>
              </h1>
              <div className="h-8 overflow-hidden mb-6">
                <p className={`text-xl sm:text-2xl text-green-300 font-mono transition-all duration-500 ${isTyping ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                  {'>'} {skills[currentSkillIndex]}
                </p>
              </div>
              <p className="text-lg sm:text-xl text-green-100 max-w-3xl mx-auto mb-8 leading-relaxed">
                Computer Science Student & Full-Stack Developer at Jashore University of Science and Technology. 
                Passionate about AI, web development, and competitive programming.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <a
                href="mailto:nomanstine@gmail.com"
                className="flex items-center gap-2 bg-white text-green-700 px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
              >
                <Mail className="h-5 w-5" />
                Get In Touch
              </a>
              <a
                href="/resume.pdf"
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border-2 border-white text-white px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 hover:bg-white hover:text-green-700 font-semibold"
              >
                <Download className="h-5 w-5" />
                View Resume
              </a>
              <a
                href="https://github.com/nightfury-9b71"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border-2 border-white text-white px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 hover:bg-white hover:text-green-700 font-semibold"
              >
                <Github className="h-5 w-5" />
                GitHub
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-white flex items-center justify-center gap-1">
                  8+ <BookOpen className="h-6 w-6" />
                </div>
                <div className="text-sm text-green-200">Projects</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white flex items-center justify-center gap-1">
                  6+ <Trophy className="h-6 w-6" />
                </div>
                <div className="text-sm text-green-200">Competitions</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white flex items-center justify-center gap-1">
                  <Coffee className="h-6 w-6" />∞
                </div>
                <div className="text-sm text-green-200">Coffee Cups</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* About Section */}
        <section id="about" className="py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-4">About Me</h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Specialized in modern web technologies with a focus on scalable, performance-optimized solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-8 shadow-md border border-green-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-green-600" />
                Education
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Bachelor of Science in Computer Science & Engineering</h4>
                  <p className="text-gray-600">Jashore University of Science and Technology (JUST)</p>
                  <p className="text-sm text-gray-500">2020 - Present • CGPA: 2.80</p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-2">Relevant Coursework</h5>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Data Structures & Algorithms', 'Database Management Systems', 'Machine Learning',
                      'Web Technologies', 'Software Engineering', 'Computer Networks',
                      'Operating Systems', 'Artificial Intelligence'
                    ].map((course) => (
                      <span key={course} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {course}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-8 shadow-md border border-green-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Users className="h-6 w-6 text-green-600" />
                Leadership
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Assistant Treasurer & Member</h4>
                  <p className="text-gray-600">Robo Society Club - JUST</p>
                  <p className="text-sm text-gray-500">2022 - Present</p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-2">Key Achievements</h5>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-green-600" />
                      Successfully organized 2 major technical events (Cubical 1.0 & 2.0)
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-green-600" />
                      Volunteered in 5+ national-level competitions
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-green-600" />
                      Managed club finances ensuring transparent budget allocation
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-green-600" />
                      Contributed to growing club membership by 40%
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">My Journey</h3>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              I'm a Computer Science & Engineering student at Jashore University of Science and Technology with a passion for building innovative software solutions. My journey includes participating in multiple CTFs, datathons, and hackathons across Bangladesh.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              As an active member and Assistant Treasurer of the Robo Society Club at JUST, I've organized national-level events including competitive programming competitions, robotics challenges, and tech workshops. I believe in learning by building and sharing knowledge with the community.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              My technical expertise spans full-stack web development, machine learning, desktop applications, and IoT. I've worked on diverse projects from AI-powered news detection systems to coaching management platforms, always focusing on creating practical solutions to real-world problems.
            </p>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-green-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-4">Featured Projects</h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                A collection of projects showcasing my expertise in web development, AI/ML, and software engineering.
              </p>
            </div>

            {/* Project Filters */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {[
                { id: 'all', label: 'All Projects', icon: <Globe className="h-4 w-4" /> },
                { id: 'web', label: 'Web Apps', icon: <Globe className="h-4 w-4" /> },
                { id: 'ai', label: 'AI & ML', icon: <Bot className="h-4 w-4" /> },
                { id: 'desktop', label: 'Desktop Apps', icon: <Smartphone className="h-4 w-4" /> },
                { id: 'iot', label: 'IoT & Robotics', icon: <Cpu className="h-4 w-4" /> }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setProjectFilter(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all transform hover:scale-105 ${
                    projectFilter === filter.id
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-green-50 shadow-sm'
                  }`}
                >
                  {filter.icon}
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Filter className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-600">No projects found for the selected filter.</p>
              </div>
            )}
          </div>
        </section>

        {/* Achievements Section */}
        <section id="achievements" className="py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-4">Competitive Achievements</h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Participated in various national-level competitions, earning recognition in CTFs, datathons, and hackathons across Bangladesh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {achievements.map((achievement, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-md">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{achievement.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {achievement.year}
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                    <p className="text-sm font-semibold text-orange-800">{achievement.rank}</p>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 text-center border border-green-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Competition Summary</h3>
            <div className="flex flex-wrap justify-center gap-12">
              <div>
                <div className="text-3xl font-bold text-green-600">5</div>
                <div className="text-sm text-gray-600">Total Competitions</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">2</div>
                <div className="text-sm text-gray-600">Hackathons</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">2</div>
                <div className="text-sm text-gray-600">Datathons</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">1</div>
                <div className="text-sm text-gray-600">CTF Events</div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-green-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-4">Let's Connect</h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                I'm always open to discussing new opportunities, interesting projects, or just having a chat about technology. Let's create something amazing together.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Get In Touch</h3>
                  <div className="space-y-4">
                    <a
                      href="mailto:nomanstine@gmail.com"
                      className="flex items-center gap-4 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all group border border-green-200"
                    >
                      <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 group-hover:from-green-500 group-hover:to-green-700 rounded-lg shadow-md transition-all">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Email</div>
                        <div className="text-gray-600">nomanstine@gmail.com</div>
                      </div>
                    </a>
                    
                    <a
                      href="tel:+8801838974363"
                      className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all group border border-blue-200"
                    >
                      <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 group-hover:from-blue-500 group-hover:to-blue-700 rounded-lg shadow-md transition-all">
                        <Phone className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Phone</div>
                        <div className="text-gray-600">+880 18389 743638</div>
                      </div>
                    </a>
                    
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg shadow-md">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Location</div>
                        <div className="text-gray-600">Jashore, Khulna</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Social Links</h3>
                  <div className="flex gap-4">
                    <a
                      href="https://github.com/nightfury-9b71"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-12 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all transform hover:scale-110 shadow-md"
                    >
                      <Github className="h-6 w-6" />
                    </a>
                    <a
                      href="https://linkedin.com/in/nomanstine"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all transform hover:scale-110 shadow-md"
                    >
                      <ArrowUpRight className="h-6 w-6" />
                    </a>
                    <a
                      href="https://nomanstine.vercel.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all transform hover:scale-110 shadow-md"
                    >
                      <Globe className="h-6 w-6" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Send a Quick Message</h3>
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Message sent! (Demo)'); }}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                      placeholder="Tell me about your project or just say hi!"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg transition-all transform hover:scale-105 font-semibold shadow-md"
                  >
                    <Send className="h-5 w-5" />
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Available for projects</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Heart className="h-4 w-4 text-red-400" />
                <span>Made with passion</span>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              © 2024 Abdullah Al Noman. Crafted with precision and care.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DeveloperPage;