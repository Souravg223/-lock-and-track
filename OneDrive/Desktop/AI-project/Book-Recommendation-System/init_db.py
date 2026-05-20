import sqlite3
from werkzeug.security import generate_password_hash
import os

# Create database file
DATABASE = 'database.db'

def init_db():
    print("Initializing database...")
    # Connect to the SQLite database
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # Read and execute the schema file
    with open(os.path.join('database', 'schema.sql'), 'r') as f:
        cursor.executescript(f.read())
    
    # Insert sample admin user
    admin_password = generate_password_hash('admin123')
    cursor.execute("INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)",
                   ('admin', 'admin@example.com', admin_password, 1))

    # Insert sample regular user
    user_password = generate_password_hash('user123')
    cursor.execute("INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)",
                   ('user', 'user@example.com', user_password, 0))

    # Dummy books data
    sample_books = [
        ('The Pragmatic Programmer', 'Andrew Hunt, David Thomas', 'Programming', 
         'A guide to becoming a better programmer and software engineer.', 
         'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400', 4.8, 1999),
        
        ('Clean Code', 'Robert C. Martin', 'Programming', 
         'A Handbook of Agile Software Craftsmanship.', 
         'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400', 4.7, 2008),
        
        ('Design Patterns', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', 'Programming', 
         'Elements of Reusable Object-Oriented Software.', 
         'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400', 4.5, 1994),
        
        ('Dune', 'Frank Herbert', 'Science Fiction', 
         'A science fiction novel about the desert planet Arrakis.', 
         'https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?w=400', 4.9, 1965),
         
        ('Foundation', 'Isaac Asimov', 'Science Fiction', 
         'The story of the Foundation, an institute to preserve the sum of human knowledge.', 
         'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400', 4.8, 1951),

        ('The Hobbit', 'J.R.R. Tolkien', 'Fantasy', 
         'A fantasy novel about the quest of home-loving hobbit Bilbo Baggins.', 
         'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?w=400', 4.9, 1937),
         
        ('Atomic Habits', 'James Clear', 'Self-Help', 
         'An Easy & Proven Way to Build Good Habits & Break Bad Ones.', 
         'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400', 4.8, 2018)
    ]

    for book in sample_books:
        cursor.execute('''INSERT INTO books (title, author, category, description, image, rating, year) 
                          VALUES (?, ?, ?, ?, ?, ?, ?)''', book)

    # Insert sample reviews
    cursor.execute("INSERT INTO reviews (user_id, book_id, rating, review) VALUES (?, ?, ?, ?)",
                   (2, 1, 5, 'Absolutely changed the way I write code!'))
    cursor.execute("INSERT INTO reviews (user_id, book_id, rating, review) VALUES (?, ?, ?, ?)",
                   (2, 4, 5, 'A masterpiece of science fiction.'))

    # Insert sample favorites
    cursor.execute("INSERT INTO favorites (user_id, book_id) VALUES (?, ?)", (2, 1))
    cursor.execute("INSERT INTO favorites (user_id, book_id) VALUES (?, ?)", (2, 4))

    conn.commit()
    conn.close()
    print("Database initialized successfully with sample data!")

if __name__ == '__main__':
    init_db()
