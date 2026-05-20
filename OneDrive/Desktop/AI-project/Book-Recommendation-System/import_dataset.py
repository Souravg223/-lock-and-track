"""
GoodBooks-10k Dataset Importer
================================
Kaggle GoodBooks-10k dataset থেকে বইয়ের data
SQLite database এ import করা হবে।

Dataset source: https://github.com/zygmuntz/goodbooks-10k
"""

import sqlite3
import urllib.request
import csv
import io
import random
import os

DATABASE = 'database.db'
DATASET_URL = 'https://raw.githubusercontent.com/zygmuntz/goodbooks-10k/master/books.csv'

# Categories mapping — author/title দিয়ে guess করা হবে
CATEGORIES = {
    'fiction': [
        'rowling', 'tolkien', 'king', 'gaiman', 'pratchett', 'martin',
        'meyer', 'collins', 'riordan', 'paolini', 'lewis', 'roth',
        'dashner', 'clare', 'maas', 'sanderson', 'jordan', 'goodkind',
        'rothfuss', 'orwell', 'huxley', 'vonnegut', 'palahniuk',
        'mcewan', 'ishiguro', 'fitzgerald', 'hemingway', 'steinbeck',
        'dickens', 'austen', 'bronte', 'hardy', 'forster', 'woolf',
        'novel', 'saga', 'tale', 'story', 'chronicles', 'twilight',
        'harry potter', 'hobbit', 'lord of the rings', 'hunger games',
        'game of thrones', 'divergent', 'maze runner', 'percy jackson'
    ],
    'mystery': [
        'christie', 'grisham', 'patterson', 'conan doyle', 'french',
        'larsson', 'stieg', 'flynn', 'hawkins', 'james', 'child',
        'cornwell', 'lehane', 'connelly', 'silence of the lambs',
        'girl with the dragon tattoo', 'gone girl', 'girl on the train',
        'murder', 'detective', 'mystery', 'crime', 'thriller', 'suspect',
        'investigation', 'clues', 'whodunit', 'forensic'
    ],
    'romance': [
        'sparks', 'steel', 'roberts', 'kinsella', 'weiner', 'moyes',
        'notebook', 'love', 'heart', 'kiss', 'dear john', 'wedding',
        'romance', 'passion', 'desire', 'affair', 'beloved', 'devoted',
        'pride and prejudice', 'sense and sensibility', 'jane eyre',
        'outlander', 'gabaldon', 'fifty shades'
    ],
    'science fiction': [
        'asimov', 'dick', 'heinlein', 'card', 'gibson', 'stephenson',
        'weir', 'cline', 'adams', 'herbert', 'brooks', 'clarke',
        'robot', 'android', 'space', 'galaxy', 'alien', 'future',
        'dystopia', 'utopia', 'mars', 'planet', 'cyberpunk', 'ai',
        'dune', 'foundation', 'ender', 'hitchhiker', 'ready player',
        'martian', 'brave new world', '1984', 'fahrenheit'
    ],
    'fantasy': [
        'tolkien', 'martin', 'jordan', 'sanderson', 'goodkind', 'rothfuss',
        'lewis', 'pullman', 'gaiman', 'pratchett', 'terry', 'feist',
        'magic', 'wizard', 'dragon', 'elf', 'dwarf', 'quest', 'sword',
        'kingdom', 'throne', 'dark tower', 'narnia', 'discworld',
        'mistborn', 'stormlight', 'wheel of time', 'kingkiller'
    ],
    'horror': [
        'king', 'koontz', 'poe', 'barker', 'stoker', 'shelley',
        'dracula', 'frankenstein', 'shining', 'it', 'carrie', 'misery',
        'haunted', 'ghost', 'demon', 'vampire', 'werewolf', 'zombie',
        'horror', 'terror', 'dread', 'fear', 'nightmare', 'dark',
        'salem', 'green mile', 'pet sematary'
    ],
    'biography': [
        'jobs', 'obama', 'mandela', 'einstein', 'darwin', 'marie',
        'lincoln', 'kennedy', 'churchill', 'gandhi', 'isaacson',
        'biography', 'memoir', 'autobiography', 'life of', 'story of',
        'malcolm gladwell', 'bossypants', 'yes please', 'tina fey',
        'amy poehler', 'david sedaris', 'jeannette walls', 'glass castle',
        'hillenbrand', 'unbroken', 'wild', 'eat pray love', 'angela'
    ],
    'self-help': [
        'carnegie', 'covey', 'gladwell', 'godin', 'ferriss', 'robbins',
        'habits', 'success', 'power of', 'art of', 'how to', 'thinking',
        'influence', 'friends', 'tipping point', 'outliers', 'blink',
        'freakonomics', 'quiet', 'who moved', 'secret', 'purpose',
        'self-help', 'motivation', 'productivity', 'mindset', 'leadership'
    ],
    'history': [
        'history', 'war', 'revolution', 'empire', 'civilization',
        'medieval', 'ancient', 'world war', 'holocaust', 'slavery',
        'mccullough', 'keegan', 'krakauer', 'bryson', 'diamond',
        'guns germs steel', 'sapiens', 'brief history', 'into thin air',
        'into the wild', 'devil in the white city', 'unbroken'
    ],
    'children': [
        'dr. seuss', 'seuss', 'dahl', 'rowling', 'milne', 'sendak',
        'silverstein', 'carle', 'numeroff', 'potter', 'paddington',
        'children', 'kids', 'little', 'young', 'bedtime', 'picture book',
        'where the wild things', 'goodnight moon', 'very hungry caterpillar',
        'charlie chocolate', 'matilda', 'bfg', 'james giant peach',
        'cat in the hat', 'green eggs', 'lorax', 'giving tree'
    ],
    'classics': [
        'shakespeare', 'dickens', 'austen', 'tolstoy', 'dostoevsky',
        'hugo', 'flaubert', 'zola', 'balzac', 'kafka', 'camus',
        'homer', 'dante', 'cervantes', 'goethe', 'dostoyevsky',
        'anna karenina', 'war and peace', 'brothers karamazov',
        'crime and punishment', 'les miserables', 'don quixote',
        'odyssey', 'iliad', 'hamlet', 'macbeth', 'othello'
    ]
}


def guess_category(title, author):
    """Title এবং Author দেখে category guess করা"""
    text = (title + ' ' + author).lower()

    scores = {}
    for cat, keywords in CATEGORIES.items():
        score = sum(1 for kw in keywords if kw in text)
        scores[cat] = score

    best_cat = max(scores, key=scores.get)
    if scores[best_cat] == 0:
        return 'fiction'  # default
    return best_cat


def generate_description(title, author, category, year):
    """বইয়ের জন্য একটি generic description তৈরি করা"""
    templates = {
        'fiction': f'"{title}" by {author} is a captivating work of fiction that takes readers on an unforgettable journey. Published in {int(year) if year else "unknown year"}, this compelling narrative explores themes of humanity, identity, and the human condition through richly drawn characters and vivid storytelling.',
        'mystery': f'"{title}" is a gripping mystery thriller by {author}. With unexpected twists and a masterfully crafted plot, this book keeps readers on the edge of their seats from the very first page to the shocking conclusion.',
        'romance': f'"{title}" by {author} is a heartfelt romance that will make you laugh, cry, and believe in love again. A beautifully told story about connection, healing, and the transformative power of love.',
        'science fiction': f'"{title}" by {author} is a thought-provoking science fiction novel that explores the boundaries of human imagination. Set in a meticulously crafted world, this book raises profound questions about technology, society, and what it means to be human.',
        'fantasy': f'"{title}" by {author} is an epic fantasy adventure filled with magic, mythical creatures, and heroic quests. Immerse yourself in a richly detailed world where anything is possible and the fate of kingdoms hangs in the balance.',
        'horror': f'"{title}" by {author} is a masterfully crafted horror story that will haunt your dreams long after you finish reading. With an atmosphere of dread and psychological depth, this book explores the darkest corners of human fear.',
        'biography': f'"{title}" is a fascinating biographical account that brings to life an extraordinary individual. {author} provides an intimate look at the experiences, challenges, and triumphs that shaped a remarkable life and legacy.',
        'self-help': f'"{title}" by {author} offers practical wisdom and life-changing insights to help you unlock your full potential. With evidence-based strategies and inspiring real-world examples, this book is an essential guide for personal growth.',
        'history': f'"{title}" by {author} is a meticulously researched historical work that illuminates the past with vivid detail and scholarly insight. Through compelling narrative, this book brings history alive and offers valuable lessons for the present.',
        'children': f'"{title}" by {author} is a delightful story that captures the imagination of young readers. With charming characters and a heartwarming message, this book has become a beloved classic for children of all ages.',
        'classics': f'"{title}" by {author} is a timeless literary masterpiece that has captivated readers for generations. This enduring classic explores universal themes with profound insight and beautiful prose that continues to resonate with modern audiences.',
    }
    return templates.get(category, templates['fiction'])


def download_and_import(limit=500):
    """Dataset download করে database এ import করা"""
    print(f"GoodBooks-10k dataset downloading...")
    print(f"URL: {DATASET_URL}")

    try:
        with urllib.request.urlopen(DATASET_URL, timeout=30) as response:
            content = response.read().decode('utf-8')
        print("Download complete!")
    except Exception as e:
        print(f"Download error: {e}")
        print("Please try manual dataset.")
        return 0

    # CSV parse করা
    reader = csv.DictReader(io.StringIO(content))

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # বিদ্যমান বই IDs পরীক্ষা করা
    existing = set(
        row[0] for row in cursor.execute('SELECT title FROM books').fetchall()
    )

    count = 0
    skipped = 0

    for row in reader:
        if count >= limit:
            break

        try:
            title = row.get('title', '').strip()
            author = row.get('authors', '').strip()
            rating_str = row.get('average_rating', '0').strip()
            year_str = row.get('original_publication_year', '0').strip()
            image_url = row.get('image_url', '').strip()

            if not title or not author:
                continue

            # Duplicate check
            if title in existing:
                skipped += 1
                continue

            # Rating
            try:
                rating = float(rating_str) if rating_str else 0.0
            except ValueError:
                rating = 0.0

            # Year
            try:
                year = int(float(year_str)) if year_str else 2000
                if year < 1000 or year > 2024:
                    year = 2000
            except (ValueError, OverflowError):
                year = 2000

            # Category guess
            category = guess_category(title, author)

            # Description generate
            description = generate_description(title, author, category, year)

            # Image URL fallback
            if not image_url or 'nophoto' in image_url:
                # Placeholder image (by category color)
                image_url = f'https://via.placeholder.com/200x300/667eea/ffffff?text={category.replace(" ", "+")}'

            cursor.execute(
                '''INSERT INTO books (title, author, category, description, image, rating, year)
                   VALUES (?, ?, ?, ?, ?, ?, ?)''',
                (title, author, category, description, image_url, rating, year)
            )

            existing.add(title)
            count += 1

            if count % 50 == 0:
                print(f"  {count} books imported...")

        except Exception as e:
            continue

    conn.commit()
    conn.close()

    print(f"\n Import complete!")
    print(f"   Total imported: {count} books")
    print(f"   Skipped (duplicate): {skipped}")
    return count


if __name__ == '__main__':
    import os
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    print("=" * 50)
    print("Book Dataset Importer")
    print("=" * 50)

    if not os.path.exists(DATABASE):
        print(f"Error: {DATABASE} not found!")
        print("Please run 'python init_db.py' first.")
    else:
        imported = download_and_import(limit=500)
        print(f"\nMODEL TEST:")
        
        # Quick test
        import sys
        sys.path.insert(0, '.')
        try:
            from recommender import get_recommendations_for_user
            print("Recommender import successful!")
        except Exception as e:
            print(f"Recommender test: {e}")
