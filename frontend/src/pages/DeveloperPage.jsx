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
  Star, 
  Eye,
  ExternalLink,
  Calendar,
  Award,
  BookOpen,
  Users,
  Target,
  ChevronRight,
  Download,
  Send,
  Trophy,
  GraduationCap,
  Briefcase,
  Database,
  Smartphone,
  Globe,
  Server,
  Bot,
  Cpu,
  Filter,
  ArrowUpRight
} from 'lucide-react';

const DeveloperPage = () => {
  const [activeTab, setActiveTab] = useState('about');
  const [projectFilter, setProjectFilter] = useState('all');
  const [skillHover, setSkillHover] = useState(null);
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

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
      sourceUrl: "https://github.com/nomanstine/boi-adda",
      image: "/api/placeholder/600/400",
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
      sourceUrl: "https://github.com/nomanstine/science-point",
      image: "/api/placeholder/600/400",
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
      sourceUrl: "https://github.com/nomanstine/fake-news-detection",
      image: "/api/placeholder/600/400",
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
      liveUrl: "https://autodocs.netlify.app/",
      sourceUrl: "https://github.com/nomanstine/autodocs",
      image: "/api/placeholder/600/400"
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
      sourceUrl: "https://github.com/nomanstine/newsplus-bd",
      image: "/api/placeholder/600/400"
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
      sourceUrl: "https://github.com/nomanstine/bit-talker",
      image: "/api/placeholder/600/400"
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
      sourceUrl: "https://github.com/nomanstine/chess-robot",
      image: "/api/placeholder/600/400"
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

  const skillCategories = [
    {
      name: "Frontend Development",
      level: "Advanced",
      experience: "2+ years",
      skills: ["React", "JavaScript", "HTML/CSS", "Tailwind CSS", "Redux", "Material-UI"],
      icon: <Globe className="h-6 w-6" />
    },
    {
      name: "Backend Development",
      level: "Advanced",
      experience: "2+ years",
      skills: ["Node.js", "Express", "Python", "FastAPI", "Flask", "JWT"],
      icon: <Server className="h-6 w-6" />
    },
    {
      name: "Database Management",
      level: "Intermediate",
      experience: "2+ years",
      skills: ["MongoDB", "MySQL", "PostgreSQL", "SQLite"],
      icon: <Database className="h-6 w-6" />
    },
    {
      name: "Machine Learning & AI",
      level: "Intermediate",
      experience: "1+ years",
      skills: ["Python", "BERT", "Scikit-learn", "TensorFlow", "NLP"],
      icon: <Bot className="h-6 w-6" />
    },
    {
      name: "Desktop Development",
      level: "Intermediate",
      experience: "1+ years",
      skills: ["PyQt", "Python", "GUI Design", "Cross-platform"],
      icon: <Smartphone className="h-6 w-6" />
    },
    {
      name: "IoT & Robotics",
      level: "Beginner",
      experience: "1+ years",
      skills: ["Arduino", "Raspberry Pi", "Servo Motors", "Computer Vision"],
      icon: <Cpu className="h-6 w-6" />
    }
  ];

  const filteredProjects = projects.filter(project => 
    projectFilter === 'all' || project.category === projectFilter
  );

  const ProjectCard = ({ project }) => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden group">
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="text-gray-400 text-lg font-semibold">{project.title}</div>
        </div>
        {project.featured && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            Featured
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full transition-colors shadow-sm"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <a
            href={project.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full transition-colors shadow-sm"
          >
            <Github className="h-4 w-4" />
          </a>
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

  const SkillCard = ({ skill, index }) => (
    <div
      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
      onMouseEnter={() => setSkillHover(index)}
      onMouseLeave={() => setSkillHover(null)}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br from-green-400 to-green-600 text-white ${
          skillHover === index ? 'scale-110' : ''
        } transition-transform duration-300`}>
          {skill.icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              skill.level === 'Advanced' ? 'bg-green-100 text-green-700' :
              skill.level === 'Intermediate' ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {skill.level}
            </span>
            <span>{skill.experience}</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {skill.skills.map((tech) => (
          <span key={tech} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-green-100 hover:text-green-700 transition-colors cursor-default">
            {tech}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 animate-pulse">
            <Sparkles className="h-8 w-8 text-green-400" />
          </div>
          <div className="absolute bottom-10 left-10 animate-bounce delay-1000">
            <Code className="h-6 w-6 text-blue-400" />
          </div>
          <div className="absolute top-1/2 right-1/4 animate-pulse delay-500">
            <Terminal className="h-6 w-6 text-yellow-400" />
          </div>
          <div className="absolute top-1/4 left-1/3 animate-ping delay-700">
            <Zap className="h-4 w-4 text-purple-400" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-all duration-300">
                <Code className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold mb-4">
                Hello, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">Abdullah Al Noman</span>
              </h1>
              <div className="h-8 overflow-hidden mb-6">
                <p className={`text-xl sm:text-2xl text-green-400 font-mono transition-all duration-500 ${isTyping ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                  {'>'} {skills[currentSkillIndex]}
                </p>
              </div>
              <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                Computer Science Student & Full-Stack Developer at Jashore University of Science and Technology. 
                Passionate about AI, web development, and competitive programming.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <a
                href="mailto:nomanstine@gmail.com"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                <Mail className="h-5 w-5" />
                Get In Touch
              </a>
              <button className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                <Download className="h-5 w-5" />
                View Resume
              </button>
              <a
                href="https://github.com/nomanstine"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
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
                <div className="text-sm text-gray-400">Projects</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white flex items-center justify-center gap-1">
                  6+ <Trophy className="h-6 w-6" />
                </div>
                <div className="text-sm text-gray-400">Competitions</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  2.80
                </div>
                <div className="text-sm text-gray-400">CGPA</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white flex items-center justify-center gap-1">
                  <Coffee className="h-6 w-6" />∞
                </div>
                <div className="text-sm text-gray-400">Coffee Cups</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto py-4">
            {[
              { id: 'about', label: 'About Me', icon: <Users className="h-4 w-4" /> },
              { id: 'projects', label: 'Projects', icon: <Code className="h-4 w-4" /> },
              { id: 'skills', label: 'Skills', icon: <Target className="h-4 w-4" /> },
              { id: 'achievements', label: 'Achievements', icon: <Award className="h-4 w-4" /> },
              { id: 'contact', label: 'Contact', icon: <Mail className="h-4 w-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-green-100 text-green-700 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* About Section */}
        {activeTab === 'about' && (
          <section className="space-y-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">About Me</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Specialized in modern web technologies with a focus on scalable, performance-optimized solutions.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-white rounded-xl p-8 shadow-lg">
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
                        <span key={course} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg">
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

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">My Journey</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                I'm a Computer Science & Engineering student at Jashore University of Science and Technology with a passion for building innovative software solutions. My journey includes participating in multiple CTFs, datathons, and hackathons across Bangladesh.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                As an active member and Assistant Treasurer of the Robo Society Club at JUST, I've organized national-level events including competitive programming competitions, robotics challenges, and tech workshops. I believe in learning by building and sharing knowledge with the community.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                My technical expertise spans full-stack web development, machine learning, desktop applications, and IoT. I've worked on diverse projects from AI-powered news detection systems to coaching management platforms, always focusing on creating practical solutions to real-world problems.
              </p>
            </div>
          </section>
        )}

        {/* Projects Section */}
        {activeTab === 'projects' && (
          <section className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Projects</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    projectFilter === filter.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
          </section>
        )}

        {/* Skills Section */}
        {activeTab === 'skills' && (
          <section className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Technical Expertise</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Specialized in modern web technologies with a focus on scalable, performance-optimized solutions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {skillCategories.map((skill, index) => (
                <SkillCard key={skill.name} skill={skill} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Achievements Section */}
        {activeTab === 'achievements' && (
          <section className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Competitive Achievements</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Participated in various national-level competitions, earning recognition in CTFs, datathons, and hackathons across Bangladesh.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {achievements.map((achievement, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
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
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-2 rounded-lg">
                      <p className="text-sm font-semibold text-orange-800">{achievement.rank}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm">
                    {achievement.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Competition Summary</h3>
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
        )}

        {/* Contact Section */}
        {activeTab === 'contact' && (
          <section className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Let's Connect</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                I'm always open to discussing new opportunities, interesting projects, or just having a chat about technology. Let's create something amazing together.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Get In Touch</h3>
                  <div className="space-y-4">
                    <a
                      href="mailto:nomanstine@gmail.com"
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors group"
                    >
                      <div className="p-3 bg-green-100 group-hover:bg-green-200 rounded-lg">
                        <Mail className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Email</div>
                        <div className="text-gray-600">nomanstine@gmail.com</div>
                      </div>
                    </a>
                    
                    <a
                      href="tel:+880 18389 743638"
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors group"
                    >
                      <div className="p-3 bg-blue-100 group-hover:bg-blue-200 rounded-lg">
                        <Phone className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Phone</div>
                        <div className="text-gray-600">+880 18389 743638</div>
                      </div>
                    </a>
                    
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <MapPin className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Location</div>
                        <div className="text-gray-600">Jashore, Khulna</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-8 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Social Links</h3>
                  <div className="flex gap-4">
                    <a
                      href="https://github.com/nomanstine"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-12 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
                    >
                      <Github className="h-6 w-6" />
                    </a>
                    <a
                      href="https://linkedin.com/in/nomanstine"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <ArrowUpRight className="h-6 w-6" />
                    </a>
                    <a
                      href="https://nomanstine.vercel.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <Globe className="h-6 w-6" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Send a Quick Message</h3>
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Tell me about your project or just say hi!"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    <Send className="h-5 w-5" />
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Status Footer */}
      <section className="bg-gray-900 text-white py-8">
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
      </section>
    </div>
  );
};

export default DeveloperPage;
