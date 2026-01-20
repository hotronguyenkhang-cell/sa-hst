import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import CompanyProfile from './pages/CompanyProfile';
import UploadPage from './pages/UploadPage';
import TenderDetail from './pages/TenderDetail';
import HistoryPage from './pages/HistoryPage';
import ComparisonPage from './pages/ComparisonPage';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';

import { Navigate } from 'react-router-dom';




// Create React Query client
const queryClient = new QueryClient();

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};


function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Router>
                    <div className="App">
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                            <Route path="/upload" element={<ProtectedRoute><Layout><UploadPage /></Layout></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><Layout><CompanyProfile /></Layout></ProtectedRoute>} />
                            <Route path="/tender/:id" element={<ProtectedRoute><Layout><TenderDetail /></Layout></ProtectedRoute>} />
                            <Route path="/history" element={<ProtectedRoute><Layout><HistoryPage /></Layout></ProtectedRoute>} />
                            <Route path="/compare" element={<ProtectedRoute><Layout><ComparisonPage /></Layout></ProtectedRoute>} />
                            <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
                        </Routes>


                        {/* Toast notifications */}
                        <Toaster />
                    </div>
                </Router>
            </AuthProvider>
        </QueryClientProvider>
    );
}


export default App;
