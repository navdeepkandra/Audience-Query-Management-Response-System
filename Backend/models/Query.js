const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema({
    sourceChannel: { 
        type: String, 
        required: true, 
        enum: [
            'Email', 
            'Twitter', 
            'Facebook', 
            'Manual', 
            'Simulated',
            'Twitter DM',      
            'Facebook Messenger', 
            'Community Forum',
            'Internal Feedback'    
        ], 
        default: 'Simulated' 
    },
    sourceId: { type: String, unique: true }, 
    rawText: { type: String, required: true },
   
    autoTags: [{ type: String }],
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },

    status: { type: String, enum: ['New', 'In Progress', 'On Hold', 'Resolved', 'Escalated'], default: 'New' },
    assignedTo: { type: String, default: 'Unassigned' }, 

    history: [{
        timestamp: { type: Date, default: Date.now },
        action: String, 
        details: String
    }],
    responseMetrics: {
        firstResponseTime: { type: Number, default: null }, 
        resolutionTime: { type: Number, default: null },
    }
}, { timestamps: true });

module.exports = mongoose.model('Query', QuerySchema);