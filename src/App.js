import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState } from 'react';
import Login from './components/login';              
import UserLogin from './components/UserLogin';      
import UserRegistration from './components/UserRegistration';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/Dashboard'; 
import RegistrationSuccess from './components/RegistrationSuccess';
import SuperAdminLogin     from "./components/SuperAdminLogin";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import RegistrationFailed from "./components/RegistrationFailed";
import PaymentReturn from './components/PaymentReturn';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (data) => {
    setUser(data);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/userLogin" element={<UserLogin onLogin={handleLogin} />} />

        {/* ✅ fixed — match exactly what backend redirects to */}
        <Route path="/registrationSuccess" element={<RegistrationSuccess />} />
        <Route path="/registrationFailed"  element={<RegistrationFailed />} />

        <Route path="/super-admin/login"     element={<SuperAdminLogin />} />
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard user={user} />} />
        <Route path="/payment-return"        element={<PaymentReturn />} />

        <Route
          path="/register"
          element={
            <UserRegistration
              onRegister={(data) => {
                console.log("Registered:", data);
                setUser(data);
              }}
            />
          }
        />

        <Route path="/dashboard"     element={<AdminDashboard />} />
        <Route path="/userDashboard" element={<UserDashboard user={user} />} />
      </Routes>
    </Router>
  );
}

export default App;