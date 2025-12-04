
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { Task } from '../types';
import { CheckSquare, Square, Trash2, Plus, Calendar, Clock, AlertCircle } from 'lucide-react';

const DailyTasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = () => {
        mockService.getTasks().then(setTasks);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        await mockService.createTask(newTaskText, newTaskDueDate || undefined);
        setNewTaskText('');
        setNewTaskDueDate('');
        loadTasks();
    };

    const toggleTask = async (id: string) => {
        await mockService.toggleTask(id);
        loadTasks();
    };

    const handleDelete = async (id: string) => {
        await mockService.deleteTask(id);
        loadTasks();
    };

    const filteredTasks = tasks.filter(t => activeTab === 'pending' ? !t.is_completed : t.is_completed);

    const isOverdue = (dateString?: string) => {
        if (!dateString) return false;
        return new Date(dateString) < new Date();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">✅ Daily Tasks</h1>
                    <p className="text-sm text-gray-500">Track your daily work progress.</p>
                </div>
                <div className="text-right text-sm text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Input */}
            <form onSubmit={handleAdd} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="What needs to be done today?"
                    value={newTaskText}
                    onChange={e => setNewTaskText(e.target.value)}
                />
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Clock className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                            type="datetime-local"
                            className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-600"
                            value={newTaskDueDate}
                            onChange={e => setNewTaskDueDate(e.target.value)}
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 shadow-sm flex items-center justify-center"
                    >
                        <Plus className="h-5 w-5 mr-2" /> Add Task
                    </button>
                </div>
            </form>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'pending'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Pending ({tasks.filter(t => !t.is_completed).length})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'completed'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Completed ({tasks.filter(t => t.is_completed).length})
                    </button>
                </nav>
            </div>

            {/* List */}
            <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                {filteredTasks.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        No {activeTab} tasks.
                    </div>
                ) : (
                    filteredTasks.map(task => {
                        const overdue = isOverdue(task.due_date);
                        return (
                            <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 group transition-colors gap-3">
                                <div className="flex items-start flex-1 cursor-pointer" onClick={() => toggleTask(task.id)}>
                                    {task.is_completed ? (
                                        <CheckSquare className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <Square className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0 group-hover:text-indigo-500 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                        <span className={`text-base block ${task.is_completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                            {task.text}
                                        </span>
                                        {task.due_date && (
                                            <div className={`text-xs mt-1 flex items-center ${overdue && !task.is_completed ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                                {overdue && !task.is_completed && <AlertCircle className="h-3 w-3 mr-1" />}
                                                Due: {new Date(task.due_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(task.id)} className="text-gray-300 hover:text-red-500 p-2 self-end sm:self-center">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DailyTasks;