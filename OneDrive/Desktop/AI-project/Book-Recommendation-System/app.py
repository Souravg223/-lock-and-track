from flask import Flask, render_template, request, redirect, url_for, session, flash, g
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

# AI Recommender import
try:
    from recommender import get_recommendations_for_user, refresh_recommender
    AI_ENABLED = True
except ImportError:
    AI_ENABLED = False

app = Flask(__name__)
app.secret_key = 'super_secret_key_for_flask_session_management'
DATABASE = 'database.db'

# ---- Startup Database Migration Check ----
try:
    import sqlite3
    conn = sqlite3.connect(DATABASE)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS read_books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            book_id INTEGER NOT NULL,
            read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(book_id) REFERENCES books(id)
        )
    ''')
    conn.commit()
    conn.close()
    print("Database check completed: read_books table ensured.")
except Exception as e:
    print(f"Startup Database Migration Check failed: {e}")


# ---- Database Setup ----

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    get_db().commit()
    return (rv[0] if rv else None) if one else rv

# ---- Decorators ----

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('is_admin') != 1:
            flash('Admin access required.', 'danger')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

# ---- Context Processors ----

@app.context_processor
def inject_user():
    user = None
    if 'user_id' in session:
        user = query_db('SELECT * FROM users WHERE id = ?', (session['user_id'],), one=True)
    return dict(current_user=user)

# ---- Auth Routes ----

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        existing_user = query_db('SELECT * FROM users WHERE username = ? OR email = ?', (username, email), one=True)
        if existing_user:
            flash('Username or email already exists.', 'danger')
            return redirect(url_for('register'))
        
        hashed_password = generate_password_hash(password)
        query_db('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', (username, email, hashed_password))
        
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
        
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = query_db('SELECT * FROM users WHERE username = ?', (username,), one=True)
        
        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['is_admin'] = user['is_admin']
            flash('Logged in successfully!', 'success')
            if user['is_admin']:
                return redirect(url_for('admin_dashboard'))
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password.', 'danger')
            
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

# ---- Public Routes ----

@app.route('/')
def index():
    featured_books = query_db('SELECT * FROM books ORDER BY rating DESC LIMIT 4')
    recent_books = query_db('SELECT * FROM books ORDER BY id DESC LIMIT 4')
    return render_template('index.html', featured_books=featured_books, recent_books=recent_books)

@app.route('/books')
def books():
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    language = request.args.get('language', '')
    
    query = 'SELECT * FROM books WHERE 1=1'
    args = []
    
    if search:
        query += ' AND (title LIKE ? OR author LIKE ?)'
        args.extend([f'%{search}%', f'%{search}%'])
        
    if category:
        query += ' AND category = ?'
        args.append(category)
        
    if language:
        query += ' AND language = ?'
        args.append(language)
        
    all_books = query_db(query, args)
    categories = query_db('SELECT DISTINCT category FROM books')
    languages = query_db('SELECT DISTINCT language FROM books WHERE language IS NOT NULL')
    
    return render_template('books.html', books=all_books, categories=categories, languages=languages, search=search, selected_category=category, selected_language=language)

@app.route('/book/<int:book_id>')
def book_details(book_id):
    book = query_db('SELECT * FROM books WHERE id = ?', (book_id,), one=True)
    if not book:
        flash('Book not found.', 'danger')
        return redirect(url_for('books'))
        
    reviews = query_db('''
        SELECT r.*, u.username FROM reviews r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.book_id = ? ORDER BY r.id DESC
    ''', (book_id,))
    
    # Add to history if logged in
    if 'user_id' in session:
        query_db('INSERT INTO history (user_id, book_id) VALUES (?, ?)', (session['user_id'], book_id))
        
        # Check if favorite
        is_favorite = query_db('SELECT id FROM favorites WHERE user_id = ? AND book_id = ?', 
                               (session['user_id'], book_id), one=True)
                               
        # Check if read
        is_read = query_db('SELECT id FROM read_books WHERE user_id = ? AND book_id = ?',
                           (session['user_id'], book_id), one=True)
    else:
        is_favorite = False
        is_read = False
        
    # Similar books (same category)
    similar_books = query_db('SELECT * FROM books WHERE category = ? AND id != ? LIMIT 3', 
                             (book['category'], book_id))
                             
    return render_template('book_details.html', book=book, reviews=reviews, is_favorite=is_favorite, is_read=is_read, similar_books=similar_books)

@app.route('/read/<int:book_id>')
def read_book(book_id):
    book = query_db('SELECT * FROM books WHERE id = ?', (book_id,), one=True)
    if not book:
        flash('Book not found.', 'danger')
        return redirect(url_for('books'))
    
    # Check if we have a PDF for it, for now we will use a dummy PDF or a generic viewer.
    # We will pass the book data to the reader template which will handle the interactive UI.
    return render_template('reader.html', book=book)

# ---- User Routes ----

@app.route('/dashboard')
@login_required
def dashboard():
    user_id = session['user_id']
    history = query_db('''
        SELECT b.*, h.viewed_at FROM history h 
        JOIN books b ON h.book_id = b.id 
        WHERE h.user_id = ? 
        GROUP BY b.id ORDER BY h.viewed_at DESC LIMIT 5
    ''', (user_id,))
    
    favorites = query_db('''
        SELECT b.* FROM favorites f 
        JOIN books b ON f.book_id = b.id 
        WHERE f.user_id = ? LIMIT 5
    ''', (user_id,))
    
    read_books = query_db('''
        SELECT b.* FROM read_books r 
        JOIN books b ON r.book_id = b.id 
        WHERE r.user_id = ? ORDER BY r.read_at DESC LIMIT 10
    ''', (user_id,))
    
    return render_template('dashboard.html', history=history, favorites=favorites, read_books=read_books)

@app.route('/favorites')
@login_required
def favorites():
    user_id = session['user_id']
    fav_books = query_db('''
        SELECT b.* FROM favorites f 
        JOIN books b ON f.book_id = b.id 
        WHERE f.user_id = ?
    ''', (user_id,))
    return render_template('favorites.html', books=fav_books)

@app.route('/favorites/toggle/<int:book_id>', methods=['POST'])
@login_required
def toggle_favorite(book_id):
    user_id = session['user_id']
    existing = query_db('SELECT id FROM favorites WHERE user_id = ? AND book_id = ?', (user_id, book_id), one=True)
    
    if existing:
        query_db('DELETE FROM favorites WHERE id = ?', (existing['id'],))
        flash('Removed from favorites.', 'info')
    else:
        query_db('INSERT INTO favorites (user_id, book_id) VALUES (?, ?)', (user_id, book_id))
        flash('Added to favorites!', 'success')
        
    return redirect(request.referrer or url_for('book_details', book_id=book_id))

@app.route('/read_books/toggle/<int:book_id>', methods=['POST'])
@login_required
def toggle_read(book_id):
    user_id = session['user_id']
    existing = query_db('SELECT id FROM read_books WHERE user_id = ? AND book_id = ?', (user_id, book_id), one=True)
    
    if existing:
        query_db('DELETE FROM read_books WHERE id = ?', (existing['id'],))
        flash('Removed from Already Read list.', 'info')
    else:
        query_db('INSERT INTO read_books (user_id, book_id) VALUES (?, ?)', (user_id, book_id))
        flash('Marked as Read!', 'success')
        
    return redirect(request.referrer or url_for('book_details', book_id=book_id))

@app.route('/review/add/<int:book_id>', methods=['POST'])
@login_required
def add_review(book_id):
    rating = int(request.form.get('rating', 0))
    review_text = request.form.get('review', '')
    user_id = session['user_id']
    
    if rating < 1 or rating > 5:
        flash('Invalid rating.', 'danger')
        return redirect(url_for('book_details', book_id=book_id))
        
    query_db('INSERT INTO reviews (user_id, book_id, rating, review) VALUES (?, ?, ?, ?)',
             (user_id, book_id, rating, review_text))
             
    # Update book average rating
    avg_rating = query_db('SELECT AVG(rating) as avg FROM reviews WHERE book_id = ?', (book_id,), one=True)['avg']
    query_db('UPDATE books SET rating = ? WHERE id = ?', (round(avg_rating, 1), book_id))
             
    flash('Review added successfully!', 'success')
    return redirect(url_for('book_details', book_id=book_id))

@app.route('/recommendations')
@login_required
def recommendations():
    user_id = session['user_id']
    ai_powered = False
    books_with_reasons = []

    # ---- AI-Powered Recommendation (3 Models) ----
    if AI_ENABLED:
        try:
            results = get_recommendations_for_user(user_id, top_n=8)
            if results:
                books_with_reasons = results
                ai_powered = True
        except Exception as e:
            print(f'AI Recommender error: {e}')

    # ---- Fallback: Simple Category-Based ----
    if not books_with_reasons:
        fav_cats = query_db('''
            SELECT DISTINCT b.category FROM favorites f
            JOIN books b ON f.book_id = b.id
            WHERE f.user_id = ?
        ''', (user_id,))
        categories = [cat['category'] for cat in fav_cats]

        fallback_books = []
        if categories:
            placeholders = ','.join(['?'] * len(categories))
            query = f'''
                SELECT * FROM books
                WHERE category IN ({placeholders})
                AND id NOT IN (SELECT book_id FROM favorites WHERE user_id = ?)
                ORDER BY rating DESC LIMIT 8
            '''
            fallback_books = query_db(query, categories + [user_id])

        if len(fallback_books) < 3:
            fallback_books = query_db('''
                SELECT * FROM books
                WHERE id NOT IN (SELECT book_id FROM favorites WHERE user_id = ?)
                ORDER BY rating DESC LIMIT 8
            ''', (user_id,))

        books_with_reasons = [
            (dict(b), 'জনপ্রিয় বই') for b in fallback_books
        ]

    return render_template(
        'recommendations.html',
        books_with_reasons=books_with_reasons,
        ai_powered=ai_powered
    )

# ---- Admin Routes ----

@app.route('/admin')
@admin_required
def admin_dashboard():
    total_users = query_db('SELECT COUNT(*) as count FROM users', one=True)['count']
    total_books = query_db('SELECT COUNT(*) as count FROM books', one=True)['count']
    total_reviews = query_db('SELECT COUNT(*) as count FROM reviews', one=True)['count']
    
    books = query_db('SELECT * FROM books ORDER BY id DESC')
    return render_template('admin.html', total_users=total_users, total_books=total_books, 
                           total_reviews=total_reviews, books=books)

@app.route('/admin/add_book', methods=['GET', 'POST'])
@admin_required
def add_book():
    if request.method == 'POST':
        title = request.form['title']
        author = request.form['author']
        category = request.form['category']
        description = request.form['description']
        image = request.form['image']
        year = request.form['year']
        
        query_db('''INSERT INTO books (title, author, category, description, image, year) 
                    VALUES (?, ?, ?, ?, ?, ?)''', 
                 (title, author, category, description, image, year))
                 
        flash('Book added successfully!', 'success')
        return redirect(url_for('admin_dashboard'))
        
    return render_template('add_book.html')

@app.route('/admin/delete_book/<int:book_id>', methods=['POST'])
@admin_required
def delete_book(book_id):
    query_db('DELETE FROM books WHERE id = ?', (book_id,))
    query_db('DELETE FROM favorites WHERE book_id = ?', (book_id,))
    query_db('DELETE FROM reviews WHERE book_id = ?', (book_id,))
    query_db('DELETE FROM history WHERE book_id = ?', (book_id,))
    
    flash('Book deleted successfully.', 'success')
    return redirect(url_for('admin_dashboard'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
