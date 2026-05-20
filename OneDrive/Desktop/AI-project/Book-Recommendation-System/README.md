# Smart Book Recommendation System

A complete beginner-friendly, professional web application for managing and recommending books.

## Features
- **User Authentication**: Secure register and login system.
- **Book Management**: Browse, view details, search, and manage books.
- **Recommendation Engine**: Recommends books based on user favorites and overall ratings.
- **Interactive UI**: Modern design with dark/light themes, hover effects, and responsive layout.
- **Admin Panel**: Manage users and book database (add, edit, delete books).

## Setup Instructions

### 1. Python Installation
Make sure you have Python 3 installed. You can download it from [python.org](https://www.python.org/).

### 2. Create a Virtual Environment (Optional but recommended)
Open your terminal/command prompt and run:
```bash
python -m venv venv
```
Activate it:
- On Windows: `venv\Scripts\activate`
- On macOS/Linux: `source venv/bin/activate`

### 3. Install Requirements
Run the following command to install Flask and other dependencies:
```bash
pip install -r requirements.txt
```

### 4. Initialize Database
We have provided an initialization script that creates the database tables and populates it with sample data. Run:
```bash
python init_db.py
```
This will create a `database.db` file in the root folder.

### 5. Run the Application
Start the Flask server by running:
```bash
python app.py
```
The application will run on `http://0.0.0.0:5000`. You can access it in your browser at `http://localhost:5000`.

## Dummy Accounts
An admin account has been created by default:
- **Username**: admin
- **Password**: admin123
