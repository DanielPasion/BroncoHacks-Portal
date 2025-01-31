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

def generate_team_id():
    return str(random.randint(100000, 999999))

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
        return jsonify(status=400,message=str(e))
    
@app.route("/hacker", methods=['GET'])
def getOneHacker():
    # get req param from url
    uuid = request.args.get('uuid')

    if uuid is None:
        return jsonify(status=400, message=f"Missing uuid in query paramter")
    
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

########## Team ##########

@app.route("/team", methods=['GET'])
def get_users_team():
    #grab uuid from get request
    uuid = request.args.get("uuid")

    if uuid is None:
        return jsonify(status=400, message=f"Missing uuid in query paramter")
    
    try:
        int(uuid)
    except:
        return jsonify(status=422, message="Unprocessable Entity (wrong data type for paramters)")

    try:
        conn = get_db_connection()
        #find a team based on the uuid of one of the members
        team = conn.execute("SELECT * FROM teams WHERE owner = ? OR teamMember1 = ? OR teamMember2 = ? OR teamMember3 = ?", (uuid, uuid, uuid, uuid)).fetchone()

        #if no team pops up, throw an error
        if not team:
            return jsonify(message= "hacker is not in a team", status=406)
        
        owner = conn.execute("SELECT uuid, firstName, lastName, email, school FROM hackers WHERE uuid = ?", (team["owner"],)).fetchone()
        team_member_1 = conn.execute("SELECT uuid, firstName, lastName, email, school FROM hackers WHERE uuid = ?", (team["teamMember1"],)).fetchone()
        team_member_2 = conn.execute("SELECT uuid, firstName, lastName, email, school FROM hackers WHERE uuid = ?", (team["teamMember2"],)).fetchone()
        team_member_3 = conn.execute("SELECT uuid, firstName, lastName, email, school FROM hackers WHERE uuid = ?", (team["teamMember3"],)).fetchone()
        
        #otherwise, return the team id and the team name
        return jsonify({
            "message": "success, we got them",
            "team": {
                "teamID" : team["teamID"],
                "teamName" : team["teamName"] 
            },
            "owner" : {
                "uuid" : owner["uuid"] if owner else None,
                "firstName" : owner["firstName"] if owner else None,
                "lastName" : owner["lastName"] if owner else None,
                "email": owner["email"] if owner else None,
                "school": owner["school"] if owner else None,
            },
            "teamMember1" : {
                "uuid" : team_member_1["uuid"] if team_member_1 else None,
                "firstName" : team_member_1["firstName"] if team_member_1 else None,
                "lastName" : team_member_1["lastName"] if team_member_1 else None,
                "email": team_member_1["email"] if team_member_1 else None,
                "school": team_member_1["school"] if team_member_1 else None,
            },
            "teamMember2" : {
                "uuid" : team_member_2["uuid"] if team_member_2 else None,
                "firstName" : team_member_2["firstName"] if team_member_2 else None,
                "lastName" : team_member_2["lastName"] if team_member_2 else None,
                "email": team_member_2["email"] if team_member_2 else None,
                "school": team_member_2["school"] if team_member_2 else None,
            },
            "teamMember3" : {
                "uuid" : team_member_3["uuid"] if team_member_3 else None,
                "firstName" : team_member_3["firstName"] if team_member_3 else None,
                "lastName" : team_member_3["lastName"] if team_member_3 else None,
                "email": team_member_3["email"] if team_member_3 else None,
                "school": team_member_3["school"] if team_member_3 else None
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route("/team", methods=["POST"])
def create_tuah():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "no data provided"}), 400
        
        required_fields = ['teamName', "owner"]
        for field in required_fields:
            if field not in data:
                return jsonify(status=400, message=f"Missing {field}")
        
        team_name = data.get("teamName")
        owner = data.get("owner")


        if team_name == "":
            return jsonify(status=422, message="Unprocessable Entity (teamName is either empty or invalid data type)")
        
        try:
            int(owner)
        except:
            return jsonify(status=422, message="Unprocessable Entity (wrong data type for: owner)")

        conn = get_db_connection()
        owner_exists = conn.execute("SELECT uuid FROM hackers WHERE uuid = ?", (int(owner),)).fetchone()

        if not owner_exists:
            return jsonify(status=404, message="Owner does not exist in the database")


        owner_confirmation = conn.execute("SELECT isConfirmed FROM hackers WHERE uuid = ?", (owner,)).fetchone()
        if not owner_confirmation or owner_confirmation[0] == 0:
            return jsonify({"error": "owner is not confirmed"}), 400
        
        existing_teams = conn.execute("SELECT teamName, owner FROM teams").fetchall()
        existing_team_names = [team["teamName"] for team in existing_teams]
        existing_team_owners_names = [int(team["owner"]) for team in existing_teams] 
        if team_name in existing_team_names:
            return jsonify({"error": "team name already in use"}), 400
        if owner in existing_team_owners_names:
            return jsonify({"error": "player is already in a team"}), 400
    
        id = generate_team_id()
        list_of_ids = conn.execute("SELECT teamID FROM teams").fetchall()
        while id in list_of_ids:
            id = generate_team_id()

        conn.execute("INSERT INTO teams (teamID, teamName, owner, teamMember1, teamMember2, teamMember3) VALUES (?, ?, ?, ?, ?, ?)", (id, team_name, owner, None, None, None))
        conn.commit()

        return jsonify({
            "message": "success !!!! Yippyyyyy",
            "team" : {
                "teamID": id,
                "teamName": team_name,
                "owner": owner,
                "teamMember1": None,
                "teamMember2": None,
                "teamMember3": None
            }
        }), 200
    except Exception as e:
        return jsonify(error=str(e),status=500)
    finally:
        conn.close()

if __name__ == "__main__":
    app.run(debug=True)
    
        
