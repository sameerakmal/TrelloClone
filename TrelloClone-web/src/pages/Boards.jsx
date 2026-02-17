import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../context/SearchContext";

const Boards = () => {
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState("");
  const navigate = useNavigate();
  const { searchQuery } = useSearch();

  const fetchBoards = async () => {
    try {
      const res = await api.get("/boards");
      setBoards(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const createBoard = async () => {
    try {
      await api.post("/board/create", { title });
      setTitle("");
      fetchBoards();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBoard = async (boardId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this board?")) return;
    
    try {
      await api.delete(`/board/del/${boardId}`);
      fetchBoards();
    } catch (err) {
      alert(err.response?.data || "Error deleting board");
    }
  };

  const filteredBoards = boards.filter(board =>
    board.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-800 mb-8">Your Boards</h2>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Create New Board</h3>
          <div className="flex gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter board name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={createBoard} 
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Create
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBoards.map((board) => (
            <div
              key={board._id}
              onClick={() => navigate(`/board/${board._id}`)}
              className="relative bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-6 cursor-pointer transform hover:scale-105 hover:shadow-xl transition-all duration-200"
            >
              <h3 className="text-xl font-semibold pr-8">{board.title}</h3>
              <button
                onClick={(e) => deleteBoard(board._id, e)}
                className="absolute top-5 right-3 p-1.5 hover:bg-white/20 rounded transition"
                title="Delete board"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {filteredBoards.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            {searchQuery ? (
              <p className="text-lg">No boards found matching "{searchQuery}"</p>
            ) : (
              <p className="text-lg">No boards yet. Create your first board to get started!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Boards;
