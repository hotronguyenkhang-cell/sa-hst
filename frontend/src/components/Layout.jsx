import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LogOut,
    User,
    Shield,
    LayoutDashboard,
    History,
    BarChart3,
    FilePlus,
    Menu,
    X,
    Building2,
    Settings as SettingsIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
// import './Layout.css'; // Deprecated

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        toast.success('Đã đăng xuất');
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: 'Overview', icon: <LayoutDashboard size={18} /> },
        { path: '/upload', label: 'Upload Tender', icon: <FilePlus size={18} /> },
        { path: '/profile', label: 'Company Profile', icon: <Building2 size={18} /> },
        { path: '/history', label: 'History', icon: <History size={18} /> },
        { path: '/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
        ...(user?.role === 'ADMIN' ? [{ path: '/settings', label: 'Settings', icon: <SettingsIcon size={18} /> }] : [])
    ];

    const getRoleLabel = (role) => {
        switch (role) {
            case 'ADMIN': return 'Administrator';
            case 'TECHNICAL': return 'Technical Dept';
            case 'PROCUREMENT': return 'Procurement Dept';
            default: return role;
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background font-sans antialiased text-foreground">
            {/* Header / Navbar */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Left: Logo & Nav */}
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-all">
                                <Shield size={20} />
                            </div>
                            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                                SA-HST
                            </span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        location.pathname === item.path
                                            ? "bg-accent/80 text-primary font-semibold shadow-sm"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Right: User Profile & Mobile Toggle */}
                    <div className="flex items-center gap-4">
                        {/* User Dropdown (Simplified for now as hover) */}
                        <div className="hidden md:flex items-center gap-3 pl-4 border-l border-border/50 group relative cursor-pointer p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <div className="flex flex-col items-end mr-1">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none mb-1">{user?.name}</span>
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{getRoleLabel(user?.role)}</span>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-border flex items-center justify-center text-slate-500">
                                <User size={18} />
                            </div>

                            {/* Dropdown Menu */}
                            <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                <div className="p-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                    >
                                        <LogOut size={16} />
                                        <span>Log out</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Toggle */}
                        <button
                            className="md:hidden p-2 text-muted-foreground hover:bg-accent rounded-md"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-border bg-background/95 backdrop-blur animate-accordion-down">
                        <div className="container mx-auto px-4 py-4 space-y-1">
                            {navItems.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg",
                                        location.pathname === item.path
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-accent"
                                    )}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                            <div className="pt-4 mt-4 border-t border-border">
                                <div className="flex items-center gap-3 px-4 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{user?.name}</p>
                                        <p className="text-xs text-muted-foreground">{getRoleLabel(user?.role)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive font-medium hover:bg-destructive/10 rounded-lg"
                                >
                                    <LogOut size={18} />
                                    <span>Log out</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {children}
            </main>
        </div>
    );
};

export default Layout;
