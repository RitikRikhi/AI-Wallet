import sys
import json
import os
import re
import numpy as np

# Suppress HuggingFace/transformers warnings for clean stdout
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3" 
import warnings
warnings.filterwarnings("ignore")

try:
    from sentence_transformers import SentenceTransformer
    import faiss
except ImportError:
    print("Error: Missing required libraries. Did you pip install -r requirements.txt?", file=sys.stderr)
    sys.exit(1)

# Paths
DIR_PATH = os.path.dirname(os.path.realpath(__file__))
DATA_FILE = os.path.join(DIR_PATH, "data.json")

def load_data():
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def build_index(model, data_dict):
    keys = list(data_dict.keys())
    values = list(data_dict.values())
    
    if not keys:
        return None, [], []

    # Create embeddings for all keys (the reasons)
    embeddings = model.encode(keys)
    
    # Initialize FAISS Index (L2 distance)
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    
    return index, keys, values

def parse_reason_string(reason_str):
    """
    Extracts generic rule vs dynamic context from node.
    Example Input: "High amount [Context: $15000]"
    Returns: ("High amount", "Context: $15000")
    """
    match = re.search(r'\[(.*?)\]', reason_str)
    if match:
        context = match.group(1)
        base_rule = re.sub(r'\s*\[.*?\]\s*', '', reason_str).strip()
        return base_rule, context
    return reason_str.strip(), None

def main():
    # 1. Get input query (Reasons string from Node.js)
    if len(sys.argv) < 2:
        print("No reasons provided to RAG system.")
        sys.exit(0)
        
    query = sys.argv[1]
    
    if not query.strip():
        print("Transaction looks safe, no explanation needed.")
        sys.exit(0)

    # 2. Load the model (Lightweight for CPU)
    try:
        model = SentenceTransformer('all-MiniLM-L6-v2')
    except Exception as e:
        print(f"Error loading model: {e}", file=sys.stderr)
        sys.exit(1)

    # 3. Load dataset and build FAISS index
    data = load_data()
    index, keys, values = build_index(model, data)
    
    if not index:
        print("Knowledge base is empty.")
        sys.exit(0)

    # 4. Search and Retrieve
    query_reasons = [r.strip() for r in query.split(',') if r.strip()]
    explanations = []
    
    for r in query_reasons:
        base_rule, context = parse_reason_string(r)
        
        # We query the vector database strictly with the base rule 
        # so the Context ($15,000) doesn't pollute the FAISS matching string
        query_vector = model.encode([base_rule])
        distances, indices = index.search(query_vector, 1)
        
        nearest_idx = indices[0][0]
        
        if distances[0][0] < 5.0: # arbitrary confidence threshold
            matched_explanation = values[nearest_idx]
            # Context-Aware Injection!
            if context:
                 explanations.append(f"Regarding '{base_rule}' ({context}): {matched_explanation}")
            else:
                 explanations.append(f"Regarding '{base_rule}': {matched_explanation}")
        else:
            if context:
                 explanations.append(f"We detected '{base_rule}' ({context}) but lack a specific explanation.")
            else:
                 explanations.append(f"We detected '{base_rule}' but lack a specific explanation.")

    # 5. Generate Output
    if not explanations:
        print("A transaction was flagged, but we could not find a distinct explanation.")
    else:
        # Combine retrieved text into a natural response
        response = "A transaction was flagged due to the following specific reasons:\n\n- "
        response += "\n\n- ".join(explanations)
        
        # Print simply so Node.js can capture stdout
        print(response)

if __name__ == "__main__":
    main()
