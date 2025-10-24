import React, { useState, useEffect } from 'react';
import { BookOpen, Code, Coffee, Heart, Github, Mail, Sparkles, Terminal, Zap, Star, Eye } from 'lucide-react';

export const DeveloperShowcase = () => {
  const [currentSkill, setCurrentSkill] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [hoverEffect, setHoverEffect] = useState(false);
  
  const skills = ['Full-Stack Developer', 'AI/ML Enthusiast', 'React Specialist', 'Problem Solver', 'Community Leader'];
  const codeLines = [
    "const developer = 'Abdullah Al Noman';",
    "const university = 'JUST CSE Student';",
    "const passion = ['React', 'AI/ML', 'Community'];",
    "while(coding) { drinkCoffee(); buildDreams(); }",
    "console.log('Available for projects ✨');"
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(false);
      setTimeout(() => {
        setCurrentSkill((prev) => (prev + 1) % skills.length);
        setIsTyping(true);
      }, 500);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-xl p-6 mb-8 relative overflow-hidden group">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-3 right-3 animate-pulse">
          <Sparkles className="h-4 w-4 text-green-400" />
        </div>
        <div className="absolute bottom-3 left-3 animate-bounce delay-1000">
          <Code className="h-3 w-3 text-blue-400" />
        </div>
        <div className="absolute top-1/2 right-1/4 animate-pulse delay-500">
          <Terminal className="h-3 w-3 text-yellow-400" />
        </div>
        <div className="absolute top-1/4 left-1/3 animate-ping delay-700">
          <Zap className="h-2 w-2 text-purple-400" />
        </div>
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Developer Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div 
                  className="w-12 h-12 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center transform transition-all duration-300 hover:scale-110"
                  onMouseEnter={() => setHoverEffect(true)}
                  onMouseLeave={() => setHoverEffect(false)}
                >
                  <Code className={`h-6 w-6 text-white transition-all duration-300 ${hoverEffect ? 'animate-spin' : ''}`} />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-white text-lg flex items-center gap-2">
                  Abdullah Al Noman
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </h4>
                <div className="h-6 overflow-hidden">
                  <p className={`text-green-400 text-sm font-mono transition-all duration-500 ${isTyping ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                    {'>'} {skills[currentSkill]}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Code Terminal */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-600 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-400 text-xs ml-2">developer-portfolio.js</span>
              </div>
              <div className="space-y-1">
                {codeLines.map((line, index) => (
                  <code key={index} className="block text-xs text-green-400 font-mono">
                    <span className="text-gray-500 mr-2">{index + 1}</span>
                    {line}
                  </code>
                ))}
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-4">
              CSE Student at JUST • Assistant Treasurer of Robo Society Club ✨
              <br />
              <span className="text-green-400 text-xs">
                "Building innovative solutions • Participating in hackathons • Leading tech communities"
              </span>
            </p>

            {/* Tech Stack */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['React', 'FastAPI', 'Python', 'PostgreSQL', 'JavaScript', 'AI/ML', 'Node.js', 'MongoDB'].map((tech) => (
                <span key={tech} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full border border-gray-600 hover:bg-green-600 hover:text-white transition-colors cursor-default">
                  {tech}
                </span>
              ))}
            </div>
          </div>
          
          {/* Contact & Stats */}
          <div className="flex flex-col gap-4">
            {/* Contact Links */}
            <div className="flex flex-wrap gap-3">
              <a 
                href="mailto:nomanstine@gmail.com"
                className="group flex items-center gap-2 bg-gray-700 hover:bg-green-600 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                <Mail className="h-4 w-4 text-gray-300 group-hover:text-white" />
                <span className="text-sm text-gray-300 group-hover:text-white">Email</span>
              </a>
              <a
                href="https://github.com/nomanstine"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 bg-gray-700 hover:bg-purple-600 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                <Github className="h-4 w-4 text-gray-300 group-hover:text-white" />
                <span className="text-sm text-gray-300 group-hover:text-white">GitHub</span>
              </a>
              <a
                href="https://nomanstine.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 bg-gray-700 hover:bg-blue-600 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                <Star className="h-4 w-4 text-gray-300 group-hover:text-white" />
                <span className="text-sm text-gray-300 group-hover:text-white">Portfolio</span>
              </a>
            </div>

            {/* Developer Page Link */}
            <div className="mt-4">
              <a
                href="/developer"
                className="group flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-white text-sm font-medium"
              >
                <Code className="h-4 w-4" />
                <span>Learn More About Me</span>
              </a>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-700/50 rounded-lg p-3 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-white">8+</div>
                  <div className="text-xs text-gray-400">Projects</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">6+</div>
                  <div className="text-xs text-gray-400">Competitions</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center mt-2">
                <div>
                  <div className="text-lg font-bold text-white">2.80</div>
                  <div className="text-xs text-gray-400">CGPA</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white flex items-center justify-center gap-1">
                    <Coffee className="h-4 w-4" />∞
                  </div>
                  <div className="text-xs text-gray-400">Coffee Cups</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Fun Footer Stats */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-600">
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>Clean Code</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-red-400" />
              <span>Made with Love</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-400" />
              <span>Fast & Responsive</span>
            </div>
          </div>
          <div className="text-xs">
            <span className="text-gray-500">Status: </span>
            <span className="text-green-400 animate-pulse">● Available for projects</span>
          </div>
        </div>

      </div>
    </div>
  );
};

const EnhancedFooter = () => {
  return (
    <footer className="bg-gray-900 text-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Developer Showcase Section */}
        <DeveloperShowcase />
        
        {/* Original Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div className="sm:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-green-400 to-green-600 p-2 rounded-full">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold">বই আড্ডা</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md text-sm sm:text-base">
              জ্ঞান ভাগাভাগির মাধ্যমে JUST-এ শিক্ষিত ও সচেতন সমাজ গড়ার প্ল্যাটফর্ম।
            </p>
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">দ্রুত লিঙ্ক</h3>
            <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base">
              <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">সুবিধাসমূহ</a></li>
              <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">কিভাবে কাজ করে</a></li>
              <li><a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">রিভিউ</a></li>
              <li><a href="#community" className="text-gray-400 hover:text-white transition-colors">কমিউনিটি</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">সাপোর্ট</h3>
            <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base">
              <li><span className="text-gray-400">হেল্প সেন্টার</span></li>
              <li><span className="text-gray-400">যোগাযোগ</span></li>
              <li><span className="text-gray-400">প্রাইভেসি পলিসি</span></li>
              <li><span className="text-gray-400">নিয়মাবলী</span></li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-800 pt-6 sm:pt-8 text-center">
          <p className="text-gray-500 text-xs sm:text-sm">
            © ২০২৫ বই আড্ডা। সকল অধিকার সংরক্ষিত।
            <span className="text-green-400 ml-2">♥</span> দিয়ে তৈরি JUST-এ
          </p>
          <div className="mt-2">
            <a
              href="/developer"
              className="text-gray-400 hover:text-green-400 text-xs transition-colors duration-300"
            >
              About the Developer
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default EnhancedFooter;