import React, { useState } from "react";
import api from "../api/axios";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const Task = ({ task, boardMembers = [], onTaskDeleted, onTaskUpdated }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [loading, setLoading] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEdit = async () => {
    if (!editTitle.trim()) return;

    setLoading(true);
    try {
      await api.patch(`/task/edit/${task._id}`, { title: editTitle });
      setShowEditModal(false);
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/task/del/${task._id}`);
      setShowDeleteModal(false);
      if (onTaskDeleted) onTaskDeleted();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (userId) => {
    setLoading(true);
    try {
      await api.patch(`/task/${task._id}/assign`, { userId });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className="bg-white p-3 rounded-lg shadow hover:shadow-md 
                   transition-shadow border border-gray-200 group"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <p 
            {...listeners}
            className="text-gray-800 font-medium flex-1 cursor-grab active:cursor-grabbing"
          >
            {task.title}
          </p>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAssignModal(true);
            }}
            className="p-1 hover:bg-green-100 rounded transition cursor-pointer"
            title="Assign Users"
          >
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditTitle(task.title);
              setShowEditModal(true);
            }}
            className="p-1 hover:bg-blue-100 rounded transition cursor-pointer"
            title="Edit"
          >
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteModal(true);
            }}
            className="p-1 hover:bg-red-100 rounded transition cursor-pointer"
            title="Delete"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        </div>

        {task.assignedUsers && task.assignedUsers.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {task.assignedUsers.map((user) => (
              <div 
                key={user._id} 
                className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full"
                title={user.email}
              >
                <span>{user.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Edit Task</h3>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Task title"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={loading || !editTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Delete Task</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete "<span className="font-semibold">{task.title}</span>"? This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-60"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Assign Users</h3>
            
            {task.assignedUsers && task.assignedUsers.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Currently Assigned:</h4>
                <div className="flex gap-2 flex-wrap">
                  {task.assignedUsers.map((user) => (
                    <div 
                      key={user._id} 
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                    >
                      <span>{user.name}</span>
                      <span className="text-xs text-gray-600">({user.email})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium text-gray-700">Board Members:</h4>
              {boardMembers.length > 0 ? (
                boardMembers.map((member) => {
                  const isAssigned = task.assignedUsers?.some(u => u._id === member._id);
                  return (
                    <button
                      key={member._id}
                      onClick={() => {
                        handleAssignUser(member._id);
                        setShowAssignModal(false);
                      }}
                      disabled={isAssigned || loading}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        isAssigned 
                          ? "bg-gray-100 border-gray-300 cursor-not-allowed opacity-60" 
                          : "bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer"
                      }`}
                    >
                      <div className="font-medium text-gray-800">{member.name}</div>
                      <div className="text-sm text-gray-600">{member.email}</div>
                      {isAssigned && <div className="text-xs text-green-600 mt-1">✓ Assigned</div>}
                    </button>
                  );
                })
              ) : (
                <p className="text-gray-500 text-sm">No board members available</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Task;
