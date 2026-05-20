import sqlite3
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

DATABASE = 'database.db'

def get_recommendations_for_user(user_id, top_n=8):
    """
    Returns a list of tuples: (book_dict, reason_string)
    Uses Collaborative Filtering based on reviews/ratings.
    """
    try:
        conn = sqlite3.connect(DATABASE)
        
        # Load reviews/ratings
        reviews_df = pd.read_sql_query("SELECT user_id, book_id, rating FROM reviews", conn)
        
        if reviews_df.empty or len(reviews_df) < 5:
            conn.close()
            return [] # Not enough data, fallback to category

        # Create User-Item Matrix
        user_item_matrix = reviews_df.pivot_table(index='user_id', columns='book_id', values='rating').fillna(0)
        
        if user_id not in user_item_matrix.index:
            conn.close()
            return [] # Cold start problem

        # Calculate Cosine Similarity
        user_sim = cosine_similarity(user_item_matrix)
        user_sim_df = pd.DataFrame(user_sim, index=user_item_matrix.index, columns=user_item_matrix.index)
        
        # Get similar users
        similar_users = user_sim_df[user_id].sort_values(ascending=False).index[1:] # Exclude self
        
        # Find books rated highly by similar users
        # Fetch both read books and reviewed books to exclude them
        user_reviewed = set(reviews_df[reviews_df['user_id'] == user_id]['book_id'])
        
        # Also exclude explicitly marked "Read" books
        read_books_df = pd.read_sql_query(f"SELECT book_id FROM read_books WHERE user_id = {user_id}", conn)
        user_explicit_read = set(read_books_df['book_id']) if not read_books_df.empty else set()
        
        user_read_or_reviewed = user_reviewed.union(user_explicit_read)
        
        recommendations = {}
        for sim_user in similar_users:
            sim_user_ratings = reviews_df[(reviews_df['user_id'] == sim_user) & (reviews_df['rating'] >= 4)]
            for _, row in sim_user_ratings.iterrows():
                b_id = row['book_id']
                if b_id not in user_read_or_reviewed:
                    if b_id not in recommendations:
                        recommendations[b_id] = 0
                    # Score based on similarity and rating
                    recommendations[b_id] += row['rating'] * user_sim_df.loc[user_id, sim_user]
                    
        # Sort recommendations
        recommended_book_ids = sorted(recommendations, key=recommendations.get, reverse=True)[:top_n]
        
        if not recommended_book_ids:
            conn.close()
            return []
            
        # Fetch book details
        placeholders = ','.join(['?'] * len(recommended_book_ids))
        query = f"SELECT * FROM books WHERE id IN ({placeholders})"
        
        cur = conn.cursor()
        cur.execute(query, recommended_book_ids)
        
        # Maintain order
        books_raw = cur.fetchall()
        books_dict = {b[0]: dict(zip([column[0] for column in cur.description], b)) for b in books_raw}
        
        final_recs = []
        for b_id in recommended_book_ids:
            if b_id in books_dict:
                final_recs.append((books_dict[b_id], "Based on readers with similar tastes (AI)"))
                
        conn.close()
        return final_recs
        
    except Exception as e:
        print(f"Error in AI Recommender: {e}")
        return []

def refresh_recommender():
    pass