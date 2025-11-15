from flask import Flask, request, jsonify
from flask_cors import CORS
import re

app = Flask(__name__)
CORS(app) 

def classify_query(text):
    """
    Analyzes raw text to assign tags and priority based on keyword matching.
    """
    text = text.lower()
    tags = []
    priority = 'Low'
    
    if re.search(r'complaint|problem|broken|error|issue|unhappy|not working|failed', text):
        tags.append('Complaint')
    
    if re.search(r'question|how to|where is|can i get|what is', text):
        tags.append('Question')
        
    if re.search(r'feature|suggest|request|wish|idea|should add', text):
        tags.append('Feature Request')
        
    if re.search(r'login|password|account|billing|charge|invoice', text):
        tags.append('Account/Billing')
        
    if 'urgent' in text or 'immediate' in text or 'security issue' in text or 'cannot login' in text:
        priority = 'Urgent'
    elif 'complaint' in tags or 'error' in text or 'broken' in text:
        priority = 'High'
    elif 'feature request' in tags or 'question' in tags:
        priority = 'Medium'
    else:
        priority = 'Low'

    
    tags = list(set(tags))
    
    
    if not tags: 
        tags.append('General Inquiry')

    return tags, priority

@app.route('/classify', methods=['POST'])
def classify():
    """
    Handles POST requests from the Node.js backend.
    """
    try:
        data = request.get_json()
        raw_text = data.get('text', '')

        if not raw_text:
            return jsonify({'error': 'No text provided for classification'}), 400

        tags, priority = classify_query(raw_text)

        print(f"Classified text: '{raw_text[:40]}...' -> Tags: {tags}, Priority: {priority}")

        return jsonify({
            'tags': tags,
            'priority': priority
        })

    except Exception as e:
        print(f"Classification error: {e}")
        return jsonify({'error': f'Internal classification error: {e}'}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)