import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/queries/ingest';

const QueryInputForm = ({ onQuerySubmitted }) => {
    const [rawText, setRawText] = useState('');
    const [sourceChannel, setSourceChannel] = useState('Manual');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!rawText.trim()) return;
        setLoading(true);
        setMessage('');

        try {
            const payload = {
                sourceChannel: sourceChannel,
                rawText: rawText.trim(),
                sourceId: `${sourceChannel}_${Date.now()}`
            };

            await axios.post(API_URL, payload);
            setRawText('');
            setMessage('Query submitted successfully!');
            
            if (onQuerySubmitted) onQuerySubmitted(); 
            
        } catch (error) {
            console.error("Manual ingestion failed:", error.response?.data || error.message);
            setMessage(`Error: ${error.response?.data?.msg || 'Failed to connect to backend.'}`);
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(''), 3000); 
        }
    };

    return (
        <form onSubmit={handleSubmit} className="sticky top-0 p-6 bg-white rounded-xl shadow-lg border border-indigo-200">
            <h2 className="text-xl font-semibold mb-4 text-indigo-700">Manual Query Injection</h2>
            
            <div className="mb-4">
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">Source Channel</label>
                <select
                    id="source"
                    value={sourceChannel}
                    onChange={(e) => setSourceChannel(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="Manual">Manual</option>
                    <option value="Simulated">Simulated API</option>
                    <option value="Twitter">Twitter</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Twitter DM">Twitter DM</option>
                    <option value="Facebook Messenger">Facebook Messenger</option>
                    <option value="Community Forum">Community Forum</option>
                    <option value="Internal Feedback">Internal Feedback</option>
                </select>
            </div>

            <div className="mb-4">
                <label htmlFor="queryText" className="block text-sm font-medium text-gray-700 mb-1">Query Text</label>
                <textarea
                    id="queryText"
                    rows="4"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Enter the query text here (e.g., 'I have an urgent problem with my account. Please call me.')"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 rounded-lg font-semibold transition duration-150 ${
                    loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
                }`}
            >
                {loading ? 'Submitting...' : 'Ingest Query'}
            </button>
            
            {message && (
                <p className={`mt-3 text-center text-sm font-medium ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                    {message}
                </p>
            )}
        </form>
    );
};

export default QueryInputForm;