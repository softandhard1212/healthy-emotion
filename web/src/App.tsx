import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { supabase } from "./lib/supabase";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import Journal from "./pages/Journal";
import Trends from "./pages/Trends";
import "./App.css";

function AppShell() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading…</div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Chat
        </NavLink>
        <NavLink to="/journal" className={({ isActive }) => (isActive ? "active" : "")}>
          Journal
        </NavLink>
        <NavLink to="/trends" className={({ isActive }) => (isActive ? "active" : "")}>
          Trends
        </NavLink>
        <button
          type="button"
          className="link sign-out"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </nav>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
