"""
manage_users.py — User Management Tool for Kirloskar Chiller Selection Tool
=============================================================================
Run from the backend/ folder:

  python manage_users.py list                          → show all users
  python manage_users.py add <username> <password>     → add new user
  python manage_users.py delete <username>             → delete user
  python manage_users.py reset <username> <newpassword>→ change password
"""

import sys
import os
import sqlite3
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'users.db')


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT    UNIQUE NOT NULL,
            password TEXT    NOT NULL,
            role     TEXT    NOT NULL DEFAULT 'user'
        )
    """)
    conn.commit()
    return conn


def list_users():
    conn = get_conn()
    rows = conn.execute("SELECT id, username, role FROM users ORDER BY id").fetchall()
    conn.close()
    if not rows:
        print("No users found.")
        return
    print(f"\n{'ID':<5} {'Username':<20} {'Role'}")
    print("-" * 35)
    for r in rows:
        print(f"{r[0]:<5} {r[1]:<20} {r[2]}")
    print()


def add_user(username, password, role='user'):
    conn = get_conn()
    try:
        hashed = generate_password_hash(password)
        conn.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                     (username, hashed, role))
        conn.commit()
        print(f"✅ User '{username}' added with role '{role}'.")
    except sqlite3.IntegrityError:
        print(f"❌ User '{username}' already exists.")
    finally:
        conn.close()


def delete_user(username):
    conn = get_conn()
    cur = conn.execute("DELETE FROM users WHERE username = ?", (username,))
    conn.commit()
    conn.close()
    if cur.rowcount:
        print(f"✅ User '{username}' deleted.")
    else:
        print(f"❌ User '{username}' not found.")


def reset_password(username, new_password):
    conn = get_conn()
    hashed = generate_password_hash(new_password)
    cur = conn.execute("UPDATE users SET password = ? WHERE username = ?",
                       (hashed, username))
    conn.commit()
    conn.close()
    if cur.rowcount:
        print(f"✅ Password for '{username}' updated.")
    else:
        print(f"❌ User '{username}' not found.")


if __name__ == '__main__':
    args = sys.argv[1:]

    if not args or args[0] == 'list':
        list_users()

    elif args[0] == 'add' and len(args) >= 3:
        role = args[3] if len(args) > 3 else 'user'
        add_user(args[1], args[2], role)

    elif args[0] == 'delete' and len(args) >= 2:
        delete_user(args[1])

    elif args[0] == 'reset' and len(args) >= 3:
        reset_password(args[1], args[2])

    else:
        print(__doc__)
