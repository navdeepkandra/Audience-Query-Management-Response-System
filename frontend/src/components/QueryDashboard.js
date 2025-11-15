import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import QueryInputForm from './QueryInputForm'; 

const API_URL = 'https://query-manager-backend.onrender.com/api/queries';
const SOCKET_URL = 'https://query-manager-backend.onrender.com';

const MOCK_AGENTS = [
    { name: 'Agent Alpha', display: 'Agent Alpha' },
    { name: 'Agent Beta', display: 'Agent Beta' },
    { name: 'Agent Charlie', display: 'Agent Charlie' },
];
const CURRENT_AGENT_NAME = 'Agent Alpha'; 

const STATUS_OPTIONS = ['New', 'In Progress', 'On Hold', 'Escalated', 'Resolved'];


const QueryDashboard = () => { 
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('My Queries'); 

    const [showForm, setShowForm] = useState(false); 

    const fetchQueries = useCallback(async () => {
        try {
            const response = await axios.get(API_URL);
            setQueries(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching queries:", error);
            setLoading(false);
        }
    }, []);

    const handleUpdate = async (queryId, updateData) => {
        try {
            const response = await axios.post(`${API_URL}/${queryId}/update`, updateData);
            
            setQueries(prevQueries => prevQueries.map(q => 
                q._id === queryId ? response.data : q
            ));
            
        } catch (error) {
            console.error("Error updating query:", error.response?.data || error.message);
        }
    };

    useEffect(() => {
        
        const socket = io(SOCKET_URL, {
            transports: ['polling', 'websocket'], 
            upgrade: true 
        });
        
        fetchQueries();

        socket.on('newQuery', (newQuery) => {
            console.log('Real-time new query received:', newQuery);
            setQueries(prevQueries => [newQuery, ...prevQueries]); 
        });
        
        socket.on('queryUpdated', (updatedQuery) => {
            console.log('Real-time query update received:', updatedQuery);
            setQueries(prevQueries => prevQueries.map(q => 
                q._id === updatedQuery._id ? updatedQuery : q 
            ));
        });

        return () => {
            socket.off('newQuery');
            socket.off('queryUpdated');
            socket.disconnect(); 
        };
    }, [fetchQueries]); 
    

    const filteredQueries = useMemo(() => {
        if (currentView === 'Unassigned') {
            return queries.filter(q => q.assignedTo === 'Unassigned');
        }
        if (currentView === 'My Queries') {
            return queries.filter(q => q.assignedTo === CURRENT_AGENT_NAME);
        }
        return queries; 
    }, [queries, currentView]);

    if (loading) {
        return <div className="p-8 text-center text-indigo-600 font-semibold">Loading Unified Inbox...</div>;
    }

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-inter">
            <h1 className="text-3xl font-bold mb-6 text-indigo-800 border-b pb-2">
                RapidQuest: Unified Inbox ({CURRENT_AGENT_NAME}) 📬
            </h1>
            
            <div className="md:flex md:space-x-4">
          
                <div className="md:w-1/3 mb-6 md:mb-0">
          
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition duration-150 mb-4 
                            ${showForm ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} shadow-lg`}
                    >
                        {showForm ? 'Hide Query Form ⬇️' : 'Show Manual Query Form ⬆️'} 
                    </button>

                    {showForm && (
                        <div className="transition-all duration-300 ease-in-out">
                            
                            <QueryInputForm onQuerySubmitted={fetchQueries} />
                        </div>
                    )}
                </div>
                
                <div className="md:w-2/3">
                    
                
                    <div className="flex justify-between items-center mb-4 p-4 bg-white rounded-xl shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700">
                            {currentView} ({filteredQueries.length})
                        </h2>
                        <select
                            value={currentView}
                            onChange={(e) => setCurrentView(e.target.value)}
                            className="p-2 border border-indigo-300 rounded-lg bg-indigo-50 text-indigo-700 font-medium"
                        >
                            <option value="All Queries" selected>All Queries</option>
                            <option value="Unassigned">Unassigned</option>
                            <option value="My Queries">My Queries</option>
                          
                        </select>
                    </div>

                    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                        {filteredQueries.length === 0 ? (
                            <div className="text-gray-500 p-6 bg-white rounded-xl shadow-md text-center">
                                No queries match the current view.
                            </div>
                        ) : (
                            filteredQueries.map((query) => (
                                <div 
                                    key={query._id} 
                                    className="bg-white p-4 border-l-4 border-indigo-400 rounded-xl shadow-lg hover:shadow-xl transition duration-200"
                                >
                                
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-600">
                                                Source: <span className="text-indigo-600">{query.sourceChannel}</span> 
                                            </p>
                                            <div className="mt-1 flex items-center space-x-2 flex-wrap">
                                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${
                                                    query.priority === 'Urgent' ? 'bg-red-500 text-white' : 
                                                    query.priority === 'High' ? 'bg-yellow-400 text-gray-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {query.priority}
                                                </span>
                                                {query.autoTags.map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                                                query.status === 'New' ? 'bg-blue-200 text-blue-800' : 
                                                query.status === 'Resolved' ? 'bg-green-200 text-green-800' : 
                                                query.status === 'In Progress' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-800'
                                            }`}>
                                                {query.status}
                                            </span>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(query.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                   
                                    <p className="mt-2 text-gray-800 font-medium">{query.rawText}</p>
                                    
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                                        
                                        <div className="flex items-center space-x-2">
                                            <span className="text-gray-600">Assign To:</span>
                                            <select
                                                className="p-1 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                                value={query.assignedTo === 'Unassigned' ? '' : query.assignedTo}
                                                onChange={(e) => handleUpdate(query._id, { 
                                                    assignedTo: e.target.value,
                                                    action: 'Assigned',
                                                    details: `Assigned to ${e.target.value || 'Unassigned'}`
                                                })}
                                            >
                                                <option value="">Unassigned</option> 
                                                {MOCK_AGENTS.map(agent => (
                                                    <option key={agent.name} value={agent.name}>
                                                        {agent.display}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        {/* Status Dropdown */}
                                        <div className="flex items-center space-x-2">
                                            <span className="text-gray-600">Change Status:</span>
                                            <select
                                                className="p-1 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                                value={query.status}
                                                onChange={(e) => handleUpdate(query._id, { 
                                                    status: e.target.value,
                                                    action: 'Status Changed',
                                                    details: `Status set to ${e.target.value}`
                                                })}
                                            >
                                                {STATUS_OPTIONS.map(status => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueryDashboard;