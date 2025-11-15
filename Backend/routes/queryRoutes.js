const express = require('express');
const router = express.Router();
const Query = require('../models/Query');
const axios = require('axios');
const mongoose = require('mongoose');

const CLASSIFICATION_API = 'http://localhost:5001/classify'; 


router.get('/', async (req, res) => {
    try {

        const queries = await Query.find().sort({ createdAt: -1 });
        res.json(queries);
    } catch (err) {
        console.error("GET /api/queries error:", err.message); 
        res.status(500).send('Server Error fetching queries.');
    }
});


router.post('/ingest', async (req, res) => {
    const { sourceChannel, sourceId, rawText } = req.body;

    if (!rawText) {
        return res.status(400).json({ msg: 'Raw text is required for query ingestion.' });
    }

    
    let tags = [];
    let priority = 'Medium'; 
    
    try {
        const nlpResponse = await axios.post(CLASSIFICATION_API, { text: rawText });
        
    
        tags = nlpResponse.data.tags && Array.isArray(nlpResponse.data.tags) 
               ? nlpResponse.data.tags 
               : ['Classification Failed'];
               
        priority = nlpResponse.data.priority || 'Medium'; 

    } catch (nlpError) {
        console.error("Error calling NLP service. Defaulting tags/priority.", nlpError.message);
        tags = ['Classification Failed'];
        priority = 'Low';
    }
    
    try {

        const newQuery = new Query({
            sourceChannel,
            sourceId: sourceId || `${sourceChannel}_${Date.now()}`,
            rawText,
            autoTags: tags,      
            priority: priority,  
            history: [{ action: 'Query Ingested', details: `Received from ${sourceChannel}` }]
        });
        
        await newQuery.save();


        const io = req.app.get('socketio'); 
        io.emit('newQuery', newQuery); 

        res.status(201).json({ msg: 'Query ingested and classified successfully.', query: newQuery });
    } catch (err) {
        console.error("Database or IO error:", err.message);
        res.status(500).send('Server Error during ingestion.');
    }
});



router.post('/:id/update', async (req, res) => {

    const { status, assignedTo, action, details } = req.body; 
    const queryId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(queryId)) {
        return res.status(400).json({ msg: 'Invalid Query ID format' });
    }

    try {
        const query = await Query.findById(queryId);
        if (!query) return res.status(404).json({ msg: 'Query not found' });

        const historyEntry = { action: action || 'Update', details: details || 'Status/Assignment change' };
        let updatedFields = {};

        
        if (status && status !== query.status) {
            updatedFields.status = status;
            historyEntry.action = 'Status Changed';
            
            if (query.status === 'New' && status === 'In Progress' && !query.responseMetrics.firstResponseTime) {
                const timeDiff = (Date.now() - query.createdAt.getTime()) / 1000; 
                updatedFields['responseMetrics.firstResponseTime'] = timeDiff;
                historyEntry.details += ` (First response time recorded: ${timeDiff.toFixed(2)}s)`;
            }
            
          
            if (status === 'Resolved' && !query.responseMetrics.resolutionTime) {
                const timeDiff = (Date.now() - query.createdAt.getTime()) / 1000;
                updatedFields['responseMetrics.resolutionTime'] = timeDiff;
                historyEntry.details += ` (Resolution time recorded: ${timeDiff.toFixed(2)}s)`;
            }
        }
        
      
        if (assignedTo !== undefined && assignedTo !== query.assignedTo) {
            
            
            const newAssignment = assignedTo || 'Unassigned'; 

            updatedFields.assignedTo = newAssignment;
            historyEntry.action = (newAssignment !== 'Unassigned') ? 'Assigned' : 'Unassigned';
            historyEntry.details = (newAssignment !== 'Unassigned') 
                ? `Assigned to: ${newAssignment}`
                : `Unassigned`;
        }
        
        const updatedQuery = await Query.findByIdAndUpdate(
            queryId, 
            { $set: updatedFields, $push: { history: historyEntry } },
            { new: true, runValidators: true }
        );
        
        const io = req.app.get('socketio');
        io.emit('queryUpdated', updatedQuery); 

        res.json(updatedQuery);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error during query update.');
    }
});

module.exports = router;