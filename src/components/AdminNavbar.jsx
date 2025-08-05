import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
    setIsProfileMenuOpen(false);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-primary-800 to-primary-900 shadow-lg border-b-2 border-secondary-300">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center py-4">
          {/* Logo/Brand */}
          <Link to="/admin/dashboard" className="text-2xl font-bold text-white hover:text-secondary-200 transition-colors">
            <div className="flex items-center">
              <svg className="w-8 h-8 mr-3 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="bg-gradient-to-r from-white to-secondary-200 bg-clip-text text-transparent">
                Admin Portal
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/admin/dashboard" 
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/admin/dashboard')
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-gray-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </Link>
            
            <Link 
              to="/admin/blog" 
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/admin/blog')
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-gray-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Blog Management
            </Link>

            <a 
              href="/" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 rounded-lg font-medium text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Site
            </a>
          </div>

          {/* Admin Profile Menu */}
          <div className="relative">
            <button
              onClick={toggleProfileMenu}
              className="flex items-center space-x-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-sm"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {adminUser.firstName?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-white font-medium text-sm">
                  {adminUser.firstName} {adminUser.lastName}
                </div>
                <div className="text-gray-300 text-xs">Administrator</div>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-300 transform transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 backdrop-blur-sm">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="text-sm font-medium text-gray-900">
                    {adminUser.firstName} {adminUser.lastName}
                  </div>
                  <div className="text-sm text-gray-600">{adminUser.email}</div>
                  <div className="text-xs text-primary-600 font-semibold mt-1">Administrator</div>
                </div>
                
                <div className="py-1">
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/blog"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Blog Management
                  </Link>
                </div>

                <div className="border-t border-gray-200 py-1">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isProfileMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsProfileMenuOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default AdminNavbar;