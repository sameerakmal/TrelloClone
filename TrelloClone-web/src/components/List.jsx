import { useState } from "react";
import Task from "./Task";
import api from "../api/axios";
import { useDroppable } from "@dnd-kit/core";

const List = ({ list, tasks, boardMembers = [], onTaskAdded, onListUpdated, onListDeleted }) => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const [loading, setLoading] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: list._id,
  });

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;

    setLoading(true);
    try {
      await api.post("/task/create", {
        title: newTaskTitle,
        listId: list._id,
        order: tasks?.length || 0
      });

      setNewTaskTitle("");
      setShowAddTask(false);
      if (onTaskAdded) onTaskAdded();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditList = async () => {
    if (!editTitle.trim()) return;

    setLoading(true);
    try {
      await api.patch(`/list/edit/${list._id}`, { title: editTitle });
      setShowEditModal(false);
      if (onListUpdated) onListUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteList = async () => {
    setLoading(true);
    try {
      await api.delete(`/list/del/${list._id}`);
      setShowDeleteModal(false);
      if (onListDeleted) onListDeleted();
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
        className={`min-w-[280px] bg-gray-100 rounded-lg p-4 shadow-md flex-shrink-0 transition-colors ${
          isOver ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-4 group">
          <h4 className="text-lg font-semibold text-gray-800">{list.title}</h4>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                setEditTitle(list.title);
                setShowEditModal(true);
              }}
              className="p-1 hover:bg-blue-100 rounded transition"
              title="Edit list"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-1 hover:bg-red-100 rounded transition"
              title="Delete list"
            >
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {tasks?.map(task => (
            <Task 
              key={task._id} 
              task={task} 
              boardMembers={boardMembers}
              onTaskDeleted={onTaskAdded}
              onTaskUpdated={onTaskAdded}
            />
          ))}
        </div>

        {showAddTask ? (
          <div className="mt-4">
            <input
              type="text"
              placeholder="Enter task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={createTask}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
              >
                {loading ? "Adding..." : "Add"}
              </button>
              <button
                onClick={() => {
                  setShowAddTask(false);
                  setNewTaskTitle("");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddTask(true)}
            className="mt-4 w-full text-left text-gray-600 hover:text-gray-800 text-sm font-medium px-2 py-2 rounded hover:bg-gray-200 transition"
          >
            + Add a task
          </button>
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Edit List</h3>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="List title"
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
                onClick={handleEditList}
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
            <h3 className="text-xl font-semibold mb-4">Delete List</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete "<span className="font-semibold">{list.title}</span>"? All tasks in this list will also be deleted. This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteList}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-60"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default List;
