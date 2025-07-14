import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';

function App() {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'dashboard'
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSwitchToRegister = () => {
    setCurrentView('register');
  };

  const handleSwitchToLogin = () => {
    setCurrentView('login');
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('login');
  };

  // If user is authenticated, show dashboard
  if (isAuthenticated || currentView === 'dashboard') {
    return <Dashboard onLogout={handleLogout} />;
  }

  // Show login or register based on current view
  if (currentView === 'register') {
    return <Register onSwitchToLogin={handleSwitchToLogin} onRegisterSuccess={handleLogin} />;
  }

  return <Login onSwitchToRegister={handleSwitchToRegister} onLoginSuccess={handleLogin} />;
}

export default App;