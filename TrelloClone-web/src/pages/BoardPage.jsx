import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import List from "../components/List";
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import io from "socket.io-client";
import { useSearch } from "../context/SearchContext";

const BoardPage = () => {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState({});
  const [newListTitle, setNewListTitle] = useState("");
  const [showAddList, setShowAddList] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [activities, setActivities] = useState([]);
  const { searchQuery } = useSearch();


  const fetchBoard = async () => {
    try {
      const res = await api.get(`/board/${id}`);
      setBoard(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await api.get(`/activity/${id}`);
      setActivities(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLists = async () => {
    try {
      const res = await api.get(`/lists/${id}`);
      setLists(res.data);

      const taskObj = {};
      for (let list of res.data) {
        const t = await api.get(`/tasks/${list._id}`);
        taskObj[list._id] = t.data;
      }

      setTasks(taskObj);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBoard();
    fetchLists();
    fetchActivities();

    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    const socket = io("http://localhost:4000", {
      withCredentials: true,
      auth: { token }
    });

    socket.on("connect", () => {
      console.log("Connected to socket for activities");
      socket.emit("joinBoard", id);
    });

    socket.on("activityAdded", (newActivity) => {
      console.log("New activity received:", newActivity);
      setActivities(prev => [newActivity, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  const addMember = async () => {
    if (!memberEmail.trim()) return;

    setMemberLoading(true);
    try {
      await api.post(`/board/${id}/addMember`, { email: memberEmail });
      setMemberEmail("");
      fetchBoard();
      alert("Member added successfully!");
    } catch (err) {
      alert(err.response?.data || "Error adding member");
    } finally {
      setMemberLoading(false);
    }
  };

  const removeMember = async (userId) => {
    if (!confirm("Remove this member from the board?")) return;

    try {
      await api.delete(`/board/${id}/removeMember/${userId}`);
      fetchBoard();
    } catch (err) {
      alert(err.response?.data || "Error removing member");
    }
  };

   const createList = async () => {
    if (!newListTitle.trim()) return;

    try {
      await api.post("/list/create", {
        title: newListTitle,
        boardId: id,
        order: lists.length
      });

      setNewListTitle("");
      setShowAddList(false);
      fetchLists();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const taskId = active.id;
    
    for (const listId in tasks) {
      const task = tasks[listId]?.find(t => t._id === taskId);
      if (task) {
        setActiveTask(task);
        break;
      }
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const newListId = over.id;

    let sourceListId = null;
    for (const listId in tasks) {
      if (tasks[listId]?.find(t => t._id === taskId)) {
        sourceListId = listId;
        break;
      }
    }

    if (sourceListId === newListId) return;

    const taskToMove = tasks[sourceListId]?.find(t => t._id === taskId);
    if (taskToMove) {
      setTasks(prev => ({
        ...prev,
        [sourceListId]: prev[sourceListId]?.filter(t => t._id !== taskId) || [],
        [newListId]: [...(prev[newListId] || []), taskToMove]
      }));
    }

    try {
      await api.patch(`/task/edit/${taskId}`, { listId: newListId });
    } catch (err) {
      console.error(err);
      fetchLists();
    }
  };

  const getFilteredTasks = (listId) => {
    if (!searchQuery) return tasks[listId] || [];
    
    return (tasks[listId] || []).filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <DndContext 
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800">{board?.title || "Loading..."}</h2>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowActivity(!showActivity);
                  if (!showActivity) fetchActivities();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition shadow"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Activity
              </button>

              <button
                onClick={() => setShowMembersModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition shadow"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Members ({board?.members?.length || 0})
              </button>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4">
            {lists.map(list => (
              <List 
                key={list._id} 
                list={list} 
                tasks={getFilteredTasks(list._id)} 
                boardMembers={board?.members || []}
                onTaskAdded={fetchLists}
                onListUpdated={fetchLists}
                onListDeleted={fetchLists}
              />
            ))}

          <div className="min-w-[280px] bg-white/60 rounded-lg p-4 shadow-md flex-shrink-0 hover:bg-white/80 hover:shadow-xl transition-all">

            {showAddList ? (
                <>
                <input
                    type="text"
                    placeholder="Enter list title"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                />

                <button
                    onClick={createList}
                    className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                >
                    Add
                </button>

                <button
                    onClick={() => setShowAddList(false)}
                    className="text-gray-500"
                >
                    Cancel
                </button>
                </>
            ) : (
                <button className="w-full text-left text-gray-600 hover:text-gray-800 text-sm font-medium px-2 py-2 rounded hover:bg-gray-200 transition" onClick={() => setShowAddList(true)}>
                + Add a list
                </button>
            )}

          </div>

          </div>
        </div>
      </div>
      
      <DragOverlay>
        {activeTask && (
          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-300 opacity-90 cursor-grabbing">
            <p className="text-gray-800 font-medium">{activeTask.title}</p>
          </div>
        )}
      </DragOverlay>

      {showMembersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowMembersModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Board Members</h3>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Current Members:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {board?.members?.map((member) => {
                  const isOwner = board?.owner === member._id;
                  return (
                    <div 
                      key={member._id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 flex items-center gap-2">
                          {member.name}
                          {isOwner && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Owner</span>}
                        </div>
                        <div className="text-sm text-gray-600">{member.email}</div>
                      </div>
                      {!isOwner && (
                        <button
                          onClick={() => removeMember(member._id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded transition"
                          title="Remove member"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Member:</h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter member's email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addMember}
                  disabled={memberLoading || !memberEmail.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {memberLoading ? "Adding..." : "Add"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Enter the email of a registered user to add them to this board</p>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowMembersModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showActivity && (
        <div 
          className="fixed top-0 right-0 h-screen w-96 bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform"
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">Activity Log</h3>
            <button
              onClick={() => setShowActivity(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-3">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No activities yet</p>
            ) : (
              activities.map((activity) => {
                const timeAgo = new Date(activity.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div 
                    key={activity._id} 
                    className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {activity.userId?.name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 break-words">
                          {activity.action}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </DndContext>
  );
};

export default BoardPage;
