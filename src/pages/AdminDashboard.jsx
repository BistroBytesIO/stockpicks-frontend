import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscribers: 0,
    totalPosts: 0,
    publishedPosts: 0
  });
  const [users, setUsers] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [nonSubscribers, setNonSubscribers] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');

    if (!token || !user) {
      navigate('/admin/login');
      return;
    }

    try {
      setAdminUser(JSON.parse(user));
      fetchDashboardData();
    } catch (error) {
      console.error('Error parsing admin user:', error);
      navigate('/admin/login');
    }
  }, [navigate]);

  // Auto refresh when page gets focus (when navigating back from other admin pages)
  useEffect(() => {
    const handleFocus = () => {
      if (!loading && adminUser) {
        fetchDashboardData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loading, adminUser]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch all data in parallel
      const [usersRes, subscribersRes, nonSubscribersRes, blogPostsRes, filesRes] = await Promise.all([
        fetch('http://localhost:8080/api/admin/users', { headers }),
        fetch('http://localhost:8080/api/admin/users/subscribers', { headers }),
        fetch('http://localhost:8080/api/admin/users/non-subscribers', { headers }),
        fetch('http://localhost:8080/api/blog/admin/posts', { headers }),
        fetch('http://localhost:8080/api/admin/files', { headers })
      ]);

      let usersData = [];
      let subscribersData = [];
      let nonSubscribersData = [];
      let blogPostsData = [];
      let filesData = [];

      if (usersRes.ok) {
        usersData = await usersRes.json();
        setUsers(usersData);
      } else {
        console.error('Failed to fetch users:', usersRes.status, usersRes.statusText);
      }

      if (subscribersRes.ok) {
        subscribersData = await subscribersRes.json();
        setSubscribers(subscribersData);
      } else {
        console.error('Failed to fetch subscribers:', subscribersRes.status, subscribersRes.statusText);
      }

      if (nonSubscribersRes.ok) {
        nonSubscribersData = await nonSubscribersRes.json();
        setNonSubscribers(nonSubscribersData);
      } else {
        console.error('Failed to fetch non-subscribers:', nonSubscribersRes.status, nonSubscribersRes.statusText);
      }

      if (blogPostsRes.ok) {
        blogPostsData = await blogPostsRes.json();
        console.log('AdminDashboard - Blog posts fetched:', blogPostsData);
        // Log the first post to see the structure
        if (blogPostsData.length > 0) {
          console.log('AdminDashboard - First post structure:', blogPostsData[0]);
          console.log('AdminDashboard - First post isPublished:', blogPostsData[0].isPublished);
          console.log('AdminDashboard - First post publishedAt:', blogPostsData[0].publishedAt);
          console.log('AdminDashboard - isPostPublished result:', isPostPublished(blogPostsData[0]));
        }
        setBlogPosts(blogPostsData);
      } else {
        console.error('Failed to fetch blog posts:', blogPostsRes.status, blogPostsRes.statusText);
      }

      if (filesRes.ok) {
        filesData = await filesRes.json();
        setFiles(filesData);
      } else {
        console.error('Failed to fetch files:', filesRes.status, filesRes.statusText);
      }

      // Calculate stats using the fetched data (not state which might be stale)
      setStats({
        totalUsers: usersData.length,
        activeSubscribers: subscribersData.length,
        totalPosts: blogPostsData.length,
        publishedPosts: blogPostsData.filter(post => isPostPublished(post)).length
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  // Helper function to check if a post is published - handles any field name inconsistencies
  const isPostPublished = (post) => {
    // Check both possible field names to handle any backend inconsistencies
    return post.isPublished === true || post.published === true || !!post.publishedAt;
  };

  // File upload functionality
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    const description = prompt('Enter a description for this file:');
    if (!description) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);

      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:8080/api/admin/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const newFile = await response.json();
        setFiles([newFile, ...files]);
        alert('File uploaded successfully!');
      } else {
        const error = await response.text();
        alert('Upload failed: ' + error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleFileDownload = async (fileId, filename) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:8080/api/admin/files/${fileId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        // Get the file blob
        const blob = await response.blob();
        
        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary anchor element to trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:8080/api/admin/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setFiles(files.filter(file => file.id !== fileId));
        alert('File deleted successfully!');
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <span className="ml-4 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {adminUser?.role}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {adminUser?.firstName} {adminUser?.lastName}
              </span>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
              >
                {refreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'users', name: 'Users', icon: '👥' },
              { id: 'subscribers', name: 'Subscribers', icon: '💳' },
              { id: 'blog', name: 'Blog Posts', icon: '📝' },
              { id: 'files', name: 'Files', icon: '📎' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Stats Cards */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Subscribers</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeSubscribers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Posts</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalPosts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Published Posts</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.publishedPosts}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Dashboard Overview</h2>
              <p className="text-gray-600">
                Welcome to the Stock Picks Pro admin dashboard. Use the tabs above to manage users, 
                subscribers, and blog posts.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Recent Activity</h3>
                  <p className="text-sm text-gray-600">View and manage user activities</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Content Management</h3>
                  <p className="text-sm text-gray-600">Create and manage blog posts</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">All Users</h2>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  {users.length} total users
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'subscribers' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Subscribers</h2>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  {subscribers.length} active subscribers
                </span>
              </div>
              {/* Subscriber table similar to users */}
              <p className="text-gray-600">Subscriber management interface coming soon...</p>
            </div>
          )}

          {activeTab === 'blog' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Blog Posts</h2>
                <button 
                  onClick={() => window.location.href = '/admin/blog'}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Manage Blog Posts
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogPosts.slice(0, 6).map((post) => (
                  <div key={post.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                        {post.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ml-2 ${
                        isPostPublished(post)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isPostPublished(post) ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {post.summary || post.content?.substring(0, 100) + '...'}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{post.category}</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              {blogPosts.length === 0 && (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts yet</h3>
                  <p className="text-gray-600 mb-4">Get started by creating your first blog post.</p>
                  <button 
                    onClick={() => window.location.href = '/admin/blog'}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Create First Post
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">File Management</h2>
                <div className="flex items-center space-x-4">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {files.length} files
                  </span>
                  <label className={`bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {uploading ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload Excel File
                      </>
                    )}
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {files.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">File Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Size</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Uploaded</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {files.map((file) => (
                        <tr key={file.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="font-medium text-gray-900">{file.originalFilename}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{file.description}</td>
                          <td className="py-3 px-4 text-gray-600">{formatFileSize(file.fileSize)}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleFileDownload(file.id, file.originalFilename)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                              >
                                Download
                              </button>
                              <button
                                onClick={() => handleDeleteFile(file.id)}
                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded yet</h3>
                  <p className="text-gray-600 mb-4">Upload Excel files for users to download on their dashboard.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;