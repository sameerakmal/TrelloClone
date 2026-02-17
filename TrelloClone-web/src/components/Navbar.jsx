import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import { useState, useEffect } from "react";
import { useSearch } from "../context/SearchContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const { searchQuery, setSearchQuery } = useSearch();

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    setSearchQuery("");
  }, [location.pathname]);

  const fetchUser = async () => {
    try {
      const res = await api.get("/profile");
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout");
      navigate("/login");
    } catch (err) {
      console.error(err);
      navigate("/login");
    }
  };

  const isOnBoards = location.pathname === "/boards" || location.pathname === "/";
  const isOnBoardPage = location.pathname.startsWith("/board/");
  const showSearch = isOnBoards || isOnBoardPage;

  const getSearchPlaceholder = () => {
    if (isOnBoards) return "Search boards...";
    if (isOnBoardPage) return "Search tasks...";
    return "Search...";
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 
              className="text-2xl font-bold text-white cursor-pointer hover:opacity-80 transition"
              onClick={() => navigate("/boards")}
            >
              Hintro
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {showSearch && (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={getSearchPlaceholder()}
                  className="w-64 pl-10 pr-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition"
                />
                <svg 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            <div className="text-white">
              <span className="text-sm font-light">Welcome, </span>
              <span className="font-semibold">{user?.name || "User"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
