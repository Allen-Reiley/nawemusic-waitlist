import sqlite3

# Update 'database.db' if your filename is different (check with 'ls')
db_file = "database.db" 
email_to_remove = "allenreileyventures@gmail.com"

try:
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM user WHERE email = ?", (email_to_remove,))
    conn.commit()
    
    if cursor.rowcount > 0:
        print(f"✅ Successfully deleted {email_to_remove}")
    else:
        print(f"❓ No user found with email {email_to_remove}")
        
    conn.close()
except Exception as e:
    print(f"❌ Error: {e}")