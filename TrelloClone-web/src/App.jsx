import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import './index.css'
import Login from './pages/Login'
import Boards from './pages/Boards'
import { BASE_URL } from './utils/constants';
import { useEffect } from 'react';
import axios from 'axios';
import BoardPage from './pages/BoardPage';
import Navbar from './components/Navbar';
import { SearchProvider } from './context/SearchContext';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const fetchBoards = async() => {
    try{
      await axios.get(BASE_URL + "/boards", {withCredentials : true});
    }
    catch(err){
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
