from flask import Flask, jsonify, request
import sqlite3
import uuid
import random
import bcrypt
import string


app = Flask(__name__)

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def get_hacker_by_id(hacker_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT UUID, teamID, firstName, lastName, email, school, discord, confirmationNumber, isConfirmed FROM hackers WHERE UUID = ?", (hacker_id,))
    hacker = cursor.fetchone()
    conn.close()
    if hacker:
        return dict(hacker)
    return None

def hash_password(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed

def generate_confirmation_number():
    return random.randint(100000, 999999)

@app.route("/")
def index():
    return "<p>Server is Running :)</p>"

########## Hackers ##########
@app.route("/hacker", methods=['POST'])
def create_hacker():
    try:
        data = request.get_json()

        required_fields = ['firstName', 'lastName', 'password', 'email', 'school']
        for field in required_fields:
            if field not in data:
                return jsonify(status=400, message=f"Missing {field}")

        firstName = data['firstName']
        lastName = data['lastName']
        password = hash_password(data['password'])
        email = data['email']
        school = data['school']
        discord = data.get('discord', None)
        teamID = None
        confirmationNumber = generate_confirmation_number()
        isConfirmed = False
    
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM hackers WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify(status=409, message="Email already in use")

        if discord:
            cursor.execute("SELECT * FROM hackers WHERE discord = ?", (discord,))
            if cursor.fetchone():
                conn.close()
                return jsonify(status=409, message="Discord already in use")
        
        cursor.execute("INSERT INTO hackers (teamID, firstName, lastName, password, email, school, discord, confirmationNumber, isConfirmed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
               (teamID, firstName, lastName, password, email, school, discord, confirmationNumber, isConfirmed))
        conn.commit()

        hacker_id = cursor.lastrowid
        new_hacker = get_hacker_by_id(hacker_id)
        conn.close()


        return jsonify(status=201, message="Hacker created successfully", hacker=new_hacker)
    except Exception as e:
        return jsonify(status=500, message=str(e))
    
    
@app.route("/hacker", methods=['GET'])
def getOneHacker():
    # get req param from url
    uuid = request.args.get('uuid')
    try:
        int(uuid)
    except:
        return jsonify(status=422, message="Unprocessable Entity (wrong data type for paramters)")
    
    try:
        conn = get_db_connection()
        hacker = conn.execute('SELECT UUID, teamID, firstName, lastName, email, school, discord, confirmationNumber, isConfirmed FROM hackers WHERE UUID=?', (uuid,)).fetchall()
        conn.close
        
        hacker_list = [dict(row) for row in hacker]
        if len(hacker_list) == 0:
            return jsonify(status=404, message="Hacker Not Found")
        else:
            return jsonify(status=200, message="Hacker Found", hacker=next(iter(hacker_list)))
    except Exception as e:
        return jsonify(status=400, message=str(e))
    

@app.route("/hackers",  methods=['GET'])
def urmom():
    try:
        conn = get_db_connection() 
        posts = conn.execute('SELECT * FROM hackers').fetchall()
        conn.close()
        posts_list = []

        for row in posts:
            hacker = dict(row)
            del hacker["password"]
            # hacker['password'] = hacker['password'].decode('utf-8')  # Convert bytes to string
            posts_list.append(hacker)
        
        return jsonify(status=200,message="succes",hackers=posts_list)
    except Exception as e:
        return jsonify(status=400,message=str(e))
    
@app.route("/hacker", methods=['PUT'])
def update_hacker():
    try:
        data = request.get_json()
        # check if data is empty
        if not data:
            return jsonify(status=404, error="no data provided")
        
        UUID = data.get('UUID', None)
        first_name = data.get('firstName', None)
        last_name = data.get('lastName', None)
        school = data.get('school', None)
        discord = data.get('discord', None)

        try:
            int(UUID)
        except:
            return jsonify(status=422, message="Unprocessable Entity (wrong data type for: uuid)")
        password = data.get('password', None)
        if password:
            password = hash_password(data['password'])

        uuid = int(UUID)
        conn = get_db_connection()
        cursor = conn.cursor()
        if not uuid:
            return jsonify(status=404, message="uuid not provided")
        else:
            # check if uuid exists in database
            cursor.execute("SELECT * FROM hackers WHERE uuid = ?", (uuid,))
            hacker = cursor.fetchone()
            if hacker is None:
                return jsonify({"error": "uuid not found"}), 404
            
            # update hacker info
            if first_name:
                cursor.execute("UPDATE hackers SET firstName = ? WHERE uuid = ?", (first_name, uuid))
            if last_name:
                cursor.execute("UPDATE hackers SET lastName = ? WHERE uuid = ?", (last_name, uuid))
            if password:
                cursor.execute("UPDATE hackers SET password = ? WHERE uuid = ?", (password, uuid))
            if school:
                cursor.execute("UPDATE hackers SET school = ? WHERE uuid = ?", (school, uuid))
            if discord:
                cursor.execute("UPDATE hackers SET discord = ? WHERE uuid = ?", (discord, uuid))
                cursor.execute("SELECT * FROM hackers WHERE discord = ?", (discord,))
                if cursor.fetchone():
                    conn.close()
                    return jsonify(status=409, message="Discord already in use")
        conn.commit()

        cursor.execute('SELECT UUID, teamID, firstName, lastName, email, school, discord, confirmatioNumber, isConfirmed FROM hackers WHERE uuid = ?', (uuid,))
        updated_hacker = cursor.fetchone()

        return jsonify(status=200, message="successfully updated hacker", hacker=updated_hacker)

    except Exception as e:
        return jsonify(status=500, error=str(e))
    finally:
        conn.close()