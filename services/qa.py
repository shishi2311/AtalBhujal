"""
TF-IDF based semantic search over markdown knowledge base sections.
"""
import os
import glob
import re
from typing import List, Dict, Tuple, Any
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Global cache
_KB_CACHE = {}


def build_index(kb_dir: str) -> Tuple[pd.DataFrame, TfidfVectorizer, Any]:
    """
    Walks the kb_dir, reads all .md files, splits into sections by '## ' subheadings.
    Returns (sections_df, vectorizer, matrix)
    """
    sections = []
    for md_path in glob.glob(os.path.join(kb_dir, '*.md')):
        with open(md_path, encoding='utf-8') as f:
            text = f.read()
        file = os.path.basename(md_path)
        # Split by '## ' but keep headings
        parts = re.split(r'(^## .*)', text, flags=re.MULTILINE)
        if len(parts) < 2:
            # No subheadings, treat whole file as one section
            sections.append({'file': file, 'heading': file, 'snippet': text.strip()})
        else:
            # parts[0] is before first heading
            for i in range(1, len(parts), 2):
                heading = parts[i].strip()
                snippet = parts[i+1].strip() if i+1 < len(parts) else ''
                sections.append({'file': file, 'heading': heading, 'snippet': snippet})
    df = pd.DataFrame(sections)
    if df.empty:
        # Handle empty KB
        df = pd.DataFrame([{'file': '', 'heading': '', 'snippet': ''}])
    vectorizer = TfidfVectorizer(stop_words='english')
    matrix = vectorizer.fit_transform(df['snippet'].fillna(''))
    # Cache
    _KB_CACHE['df'] = df
    _KB_CACHE['vectorizer'] = vectorizer
    _KB_CACHE['matrix'] = matrix
    return df, vectorizer, matrix


def search(query: str, k: int = 5) -> List[Dict[str, Any]]:
    """
    Search the cached KB index for top-k relevant sections.
    Returns list of dicts: {score, snippet, heading, file}
    """
    if not _KB_CACHE:
        raise RuntimeError('KB index not built. Call build_index first.')
    vec = _KB_CACHE['vectorizer'].transform([query])
    sims = cosine_similarity(vec, _KB_CACHE['matrix']).flatten()
    df = _KB_CACHE['df']
    top_idx = sims.argsort()[::-1][:k]
    results = []
    for idx in top_idx:
        if not df.iloc[idx]['snippet'].strip():
            continue
        results.append({
            'score': float(sims[idx]),
            'snippet': df.iloc[idx]['snippet'],
            'heading': df.iloc[idx]['heading'],
            'file': df.iloc[idx]['file']
        })
    return results