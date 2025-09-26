import React, { useState, useEffect, useCallback } from 'react';
import { Search, Upload, FileText, User, LogOut, LogIn, UserPlus, Download, Trash2, Home, Database } from 'lucide-react';

const AnimatedBackground = () => {
  const [shapes, setShapes] = useState([]);

  useEffect(() => {
    const createShape = (id) => ({
      id,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 60 + 20,
      opacity: Math.random() * 0.5 + 0.1,
      rotation: Math.random() * 360,
      speed: Math.random() * 0.5 + 0.1,
      type: Math.random() > 0.5 ? 'circle' : 'square'
    });

    const initialShapes = Array.from({ length: 15 }, (_, i) => createShape(i));
    setShapes(initialShapes);

    const animateShapes = () => {
      setShapes(prevShapes => 
        prevShapes.map(shape => ({
          ...shape,
          y: shape.y <= -10 ? 110 : shape.y - shape.speed,
          rotation: shape.rotation + 0.5,
          x: shape.x + Math.sin(shape.y * 0.01) * 0.1
        }))
      );
    };

    const interval = setInterval(animateShapes, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {shapes.map(shape => (
        <div
          key={shape.id}
          className={`absolute transition-all duration-75 ${
            shape.type === 'circle' ? 'rounded-full' : 'rounded-lg'
          }`}
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            opacity: shape.opacity,
            background: `linear-gradient(${shape.rotation}deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))`,
            transform: `rotate(${shape.rotation}deg)`,
            backdropFilter: 'blur(1px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        />
      ))}
    </div>
  );
};

const API_BASE = 'http://localhost:8000'; // lodestone-api default url

const AuthForm = ({ 
  type, 
  loginForm, 
  setLoginForm, 
  registerForm, 
  setRegisterForm, 
  login, 
  register, 
  loading, 
  setCurrentView 
}) => (
  <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-8 border border-white/20">
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold text-gray-800">
        {type === 'login' ? 'Sign In' : 'Create Account'}
      </h2>
    </div>
    
    <div className="space-y-4">
      {type === 'register' && (
        <input
          type="email"
          placeholder="Email"
          value={registerForm.email}
          onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      )}
      <input
        type="text"
        placeholder="Username"
        value={type === 'login' ? loginForm.username : registerForm.username}
        onChange={(e) => {
          if (type === 'login') {
            setLoginForm({...loginForm, username: e.target.value});
          } else {
            setRegisterForm({...registerForm, username: e.target.value});
          }
        }}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={type === 'login' ? loginForm.password : registerForm.password}
        onChange={(e) => {
          if (type === 'login') {
            setLoginForm({...loginForm, password: e.target.value});
          } else {
            setRegisterForm({...registerForm, password: e.target.value});
          }
        }}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      />
      <button
        onClick={type === 'login' ? login : register}
        disabled={loading}
        className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Loading...' : (type === 'login' ? 'Sign In' : 'Create Account')}
      </button>
    </div>
    
    <div className="text-center mt-4">
      <button
        onClick={() => setCurrentView(type === 'login' ? 'register' : 'login')}
        className="text-blue-600 hover:text-blue-800"
      >
        {type === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  </div>
);

const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentView, setCurrentView] = useState('home');
  const [files, setFiles] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auth forms
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', username: '', password: '' });
  
  // Search form
  const [searchForm, setSearchForm] = useState({
    query: '',
    collection_name: '',
    max_results: 10,
    score_threshold: null
  });

  useEffect(() => {
    if (token) {
      fetchUserProfile();
      if (currentView === 'files') {
        fetchFiles();
      }
    }
  }, [token, currentView]);

  const apiCall = async (endpoint, options = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers }
    });
    
    if (!response.ok) {
      throw new Error(await response.text() || 'API call failed');
    }
    
    return response.json();
  };

  const fetchUserProfile = async () => {
    try {
      const userData = await apiCall('/api/v1/auth/me');
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      logout();
    }
  };

  const login = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('username', loginForm.username);
      formData.append('password', loginForm.password);
      
      const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Login failed');
      
      const data = await response.json();
      setToken(data.access_token);
      localStorage.setItem('token', data.access_token);
      setCurrentView('home');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [loginForm]);

  const register = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      await apiCall('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerForm)
      });
      
      // Auto login after registration
      const formData = new FormData();
      formData.append('username', registerForm.username);
      formData.append('password', registerForm.password);
      
      const loginResponse = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        body: formData
      });
      
      if (loginResponse.ok) {
        const data = await loginResponse.json();
        setToken(data.access_token);
        localStorage.setItem('token', data.access_token);
        setCurrentView('home');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [registerForm]);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setCurrentView('home');
  };

  const fetchFiles = async () => {
    try {
      const filesData = await apiCall('/api/v1/files/');
      setFiles(filesData);
    } catch (err) {
      setError('Failed to fetch files');
    }
  };

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/v1/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      
      fetchFiles(); // Refresh file list
    } catch (err) {
      setError('File upload failed');
    }
    setLoading(false);
  };

  const deleteFile = async (fileId) => {
    try {
      await apiCall(`/api/v1/files/${fileId}`, { method: 'DELETE' });
      fetchFiles(); // Refresh file list
    } catch (err) {
      setError('Failed to delete file');
    }
  };

  const downloadFile = async (fileId, filename) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/files/${fileId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Download failed');
    }
  };

  const performSearch = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const searchData = { ...searchForm };
      if (!searchData.score_threshold) delete searchData.score_threshold;
      if (!searchData.collection_name) delete searchData.collection_name;
      
      const results = await apiCall('/api/v1/semantic/query', {
        method: 'POST',
        body: JSON.stringify(searchData)
      });
      
      setSearchResults(results);
    } catch (err) {
      setError('Search failed');
    }
    setLoading(false);
  }, [searchForm, token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Content overlay */}
      <div className="relative z-10">{/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Database className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Lodestone</h1>
            </div>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('home')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'home' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </button>
                <button
                  onClick={() => setCurrentView('files')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'files' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Files
                </button>
                <button
                  onClick={() => setCurrentView('search')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'search' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </button>
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{user.username}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentView('login')}
                  className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">{error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
          </div>
        )}

        {currentView === 'home' && (
          <div className="text-center">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Lodestone</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                A powerful file management system with semantic search capabilities. Upload your documents and discover insights through intelligent search.
              </p>
            </div>
            
            {user ? (
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:bg-white/90">
                  <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Upload Files</h3>
                  <p className="text-gray-600 mb-4">Upload and manage your documents securely in the cloud.</p>
                  <button 
                    onClick={() => setCurrentView('files')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Manage Files
                  </button>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:bg-white/90">
                  <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Semantic Search</h3>
                  <p className="text-gray-600 mb-4">Find relevant content using natural language queries.</p>
                  <button 
                    onClick={() => setCurrentView('search')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Searching
                  </button>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:bg-white/90">
                  <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Document Library</h3>
                  <p className="text-gray-600 mb-4">Access and organize all your uploaded documents.</p>
                  <button 
                    onClick={() => setCurrentView('files')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Library
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-lg max-w-2xl mx-auto border border-white/20">
                <h3 className="text-2xl font-semibold mb-4">Get Started</h3>
                <p className="text-gray-600 mb-6">Sign in to access your files and start using semantic search.</p>
                <div className="flex justify-center space-x-4">
                  <button 
                    onClick={() => setCurrentView('login')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => setCurrentView('register')}
                    className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'login' && (
          <AuthForm 
            type="login" 
            loginForm={loginForm}
            setLoginForm={setLoginForm}
            registerForm={registerForm}
            setRegisterForm={setRegisterForm}
            login={login}
            register={register}
            loading={loading}
            setCurrentView={setCurrentView}
          />
        )}
        
        {currentView === 'register' && (
          <AuthForm 
            type="register" 
            loginForm={loginForm}
            setLoginForm={setLoginForm}
            registerForm={registerForm}
            setRegisterForm={setRegisterForm}
            login={login}
            register={register}
            loading={loading}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'files' && user && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-800">File Management</h2>
              <label className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Upload File
                <input type="file" onChange={uploadFile} className="hidden" />
              </label>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-white/20">
              {files.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No files uploaded yet. Upload your first file to get started.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {files.map((file) => (
                    <div key={file.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-800">{file.original_filename}</p>
                          <p className="text-sm text-gray-500">
                            {(file.file_size / 1024).toFixed(1)} KB • {file.upload_status}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => downloadFile(file.id, file.original_filename)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteFile(file.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'search' && user && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Semantic Search</h2>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-6 border border-white/20">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Query</label>
                  <input
                    type="text"
                    value={searchForm.query}
                    onChange={(e) => setSearchForm({...searchForm, query: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your search query..."
                    required
                  />
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Collection Name (Optional)</label>
                    <input
                      type="text"
                      value={searchForm.collection_name}
                      onChange={(e) => setSearchForm({...searchForm, collection_name: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Collection name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Results</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={searchForm.max_results}
                      onChange={(e) => setSearchForm({...searchForm, max_results: parseInt(e.target.value)})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Score Threshold (Optional)</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={searchForm.score_threshold || ''}
                      onChange={(e) => setSearchForm({...searchForm, score_threshold: e.target.value ? parseFloat(e.target.value) : null})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.0 - 1.0"
                    />
                  </div>
                </div>
                
                <button
                  onClick={performSearch}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {searchResults && Object.keys(searchResults).length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-4">Search Results</h3>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(searchResults, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </main>
      </div>
    </div>
  );
};

export default App;