import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import './index.css'
import Login from './pages/Login'
import Boards from './pages/Boards'
import { useEffect, useState } from 'react';
import api from './api/axios';
import BoardPage from './pages/BoardPage';
import Navbar from './components/Navbar';
import { SearchProvider } from './context/SearchContext';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  const fetchBoards = async() => {
    try{
      await api.get("/boards");
      setIsLoading(false);
    }
    catch(err){
      setIsLoading(false);
      if(err.status === 401){
        navigate("/login");
      }
      console.error(err);
    }
  }
  
  useEffect(() => {
    fetchBoards();
  }, [])

  // Don't show navbar on login page
  const showNavbar = location.pathname !== '/login';

  if (isLoading && location.pathname !== '/login') {
    return <LoadingScreen />;
  }

  return (
    <SearchProvider>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Boards/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/boards" element={<Boards />} />
        <Route path="/board/:id" element={<BoardPage />} />
      </Routes>
    </SearchProvider>
  )
}
export default App
