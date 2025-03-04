import sqlite3
import bcrypt
import sqlitecloud

def run_db():
    def hash_password(password):
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed

    try:
        connection = sqlite3.connect('dev.db')

        with open('schema.sql') as f:
            connection.executescript(f.read())

        cur = connection.cursor()
        print("here")

        cur.execute("INSERT INTO hackers (teamID, firstName, lastName, password, email, school, discord, confirmationNumber, isConfirmed, isAdmin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (None, 'Daniel', 'Pasion', hash_password('MeQuieroMatar'), 'dnpaxion@gmail.com', 'Cal Poly Pomona','.theDaniel', 666420, True, True ))

        connection.commit()
        connection.close()
        print("Complete")
    except Exception as e:
        print(e)
run_db()


