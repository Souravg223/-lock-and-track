import sqlite3

DATABASE = 'database.db'

def update_database():
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()
    
    # 1. Add language column to books if it doesn't exist
    try:
        cur.execute("ALTER TABLE books ADD COLUMN language TEXT DEFAULT 'English'")
        print("Added 'language' column to books.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("'language' column already exists.")
        else:
            print(f"Error adding language column: {e}")
            
    # 2. Create read_books table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS read_books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            book_id INTEGER NOT NULL,
            read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (book_id) REFERENCES books (id),
            UNIQUE(user_id, book_id)
        )
    ''')
    print("Created 'read_books' table.")
    
    # 3. Add some Bangla dummy books
    # Check if they exist first
    cur.execute("SELECT id FROM books WHERE title = 'Himu'")
    if not cur.fetchone():
        bangla_books = [
            ('Himu', 'Humayun Ahmed', 'Fiction', 'A famous character who wears yellow panjabi.', 'https://via.placeholder.com/150/FFD700', 1993, 'Bangla'),
            ('Misir Ali', 'Humayun Ahmed', 'Thriller', 'A brilliant psychiatrist who solves mysteries.', 'https://via.placeholder.com/150/000000', 1985, 'Bangla'),
            ('Pather Panchali', 'Bibhutibhushan Bandyopadhyay', 'Drama', 'A classic Bengali novel about Apu.', 'https://via.placeholder.com/150/228B22', 1929, 'Bangla'),
            ('Dipu Number Two', 'Muhammed Zafar Iqbal', 'Children', 'A popular teen adventure novel.', 'https://via.placeholder.com/150/4169E1', 1984, 'Bangla')
        ]
        cur.executemany('''
            INSERT INTO books (title, author, category, description, image, year, language) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', bangla_books)
        print("Added mock Bangla books.")
    
    conn.commit()
    conn.close()
    print("Database update complete.")

if __name__ == '__main__':
    update_database()
