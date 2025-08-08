import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BlogPostEditor from '../components/BlogPostEditor';
import { blogApi } from '../services/api';

export const AdminBlogManagement = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    // Check admin authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    fetchPosts();
  }, [navigate]);

  const fetchPosts = async () => {
    try {
      const data = await blogApi.admin.getPosts();
      console.log('Blog posts fetched:', data);
      // Log the first post to see the structure
      if (data.length > 0) {
        console.log('First post structure:', data[0]);
        console.log('First post isPublished:', data[0].isPublished);
        console.log('First post publishedAt:', data[0].publishedAt);
      }
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    setEditingPost(null);
    setShowEditor(true);
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowEditor(true);
  };

  const handleSavePost = async (postData) => {
    setOperationLoading(true);
    try {
      if (editingPost) {
        await blogApi.admin.updatePost(editingPost.id, postData);
      } else {
        await blogApi.admin.createPost(postData);
      }
      
      await fetchPosts(); // Refresh the posts list
      setShowEditor(false);
      setEditingPost(null);
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setOperationLoading(false);
    }
  };

  const handlePublishPost = async (postId) => {
    try {
      await blogApi.admin.publishPost(postId);
      await fetchPosts();
    } catch (error) {
      console.error('Error publishing post:', error);
    }
  };

  const handleUnpublishPost = async (postId) => {
    try {
      await blogApi.admin.unpublishPost(postId);
      await fetchPosts();
    } catch (error) {
      console.error('Error unpublishing post:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await blogApi.admin.deletePost(postId);
      await fetchPosts();
    } catch (error) {
        console.error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleCancelEdit = () => {
    setShowEditor(false);
    setEditingPost(null);
  };

  // Helper function to check if a post is published - handles any field name inconsistencies
  const isPostPublished = (post) => {
    // Check both possible field names to handle any backend inconsistencies
    return post.isPublished === true || post.published === true || !!post.publishedAt;
  };

  const togglePostSelection = (postId) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const selectAllPosts = () => {
    setSelectedPosts(selectedPosts.length === posts.length ? [] : posts.map(p => p.id));
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedPosts.length === 0) return;

    try {
      setOperationLoading(true);
      
      if (bulkAction === 'publish') {
        await Promise.all(
          selectedPosts.map(postId => blogApi.admin.publishPost(postId))
        );
      } else if (bulkAction === 'unpublish') {
        await Promise.all(
          selectedPosts.map(postId => blogApi.admin.unpublishPost(postId))
        );
      } else if (bulkAction === 'delete') {
        if (window.confirm(`Are you sure you want to delete ${selectedPosts.length} posts? This action cannot be undone.`)) {
          await Promise.all(
            selectedPosts.map(postId => blogApi.admin.deletePost(postId))
          );
        }
      }

      await fetchPosts();
      setSelectedPosts([]);
      setBulkAction('');
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      setOperationLoading(false);
    }
  };

  if (showEditor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8">
        <div className="container mx-auto px-6">
          <BlogPostEditor
            post={editingPost}
            onSave={handleSavePost}
            onCancel={handleCancelEdit}
            loading={operationLoading}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
              <p className="text-gray-600 mt-1">Create and manage your blog posts</p>
            </div>
            <button
              onClick={handleCreatePost}
              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Post
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  {posts.filter(p => isPostPublished(p)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {posts.filter(p => !isPostPublished(p)).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {posts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPosts.length === posts.length && posts.length > 0}
                      onChange={selectAllPosts}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Select All ({selectedPosts.length} selected)
                    </span>
                  </label>
                </div>
                
                {selectedPosts.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select Action</option>
                      <option value="publish">Publish Selected</option>
                      <option value="unpublish">Unpublish Selected</option>
                      <option value="delete">Delete Selected</option>
                    </select>
                    <button
                      onClick={handleBulkAction}
                      disabled={!bulkAction || operationLoading}
                      className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-4 py-1 rounded-md text-sm transition-colors"
                    >
                      {operationLoading ? 'Processing...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Posts List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Posts</h2>
          </div>
          
          {posts.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first blog post.</p>
              <button
                onClick={handleCreatePost}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Create First Post
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {posts.map((post) => (
                <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={() => togglePostSelection(post.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 mr-3">
                            {post.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            isPostPublished(post)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {isPostPublished(post) ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      
                      <p className="text-gray-600 mb-2 line-clamp-2">
                        {post.summary || post.content?.substring(0, 150) + '...'}
                      </p>
                      
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>By {post.authorName}</span>
                        <span>•</span>
                        <span>{post.category}</span>
                        <span>•</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        {post.publishedAt && (
                          <>
                            <span>•</span>
                            <span>Published: {new Date(post.publishedAt).toLocaleDateString()}</span>
                          </>
                        )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditPost(post)}
                        className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                        title="Edit Post"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      
                      {isPostPublished(post) ? (
                        <button
                          onClick={() => handleUnpublishPost(post.id)}
                          className="flex items-center px-3 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded-md transition-colors"
                          title="Unpublish Post"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                          Unpublish
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePublishPost(post.id)}
                          className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors shadow-sm"
                          title="Publish Post"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Publish
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Post"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBlogManagement;