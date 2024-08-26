import mysql.connector
from config import Config

def get_db_connection():
    """Create a new database connection."""
    try:
        connection = mysql.connector.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME,
            raise_on_warnings=True
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None

def get_database_schema():
    """Function to retrieve the database schema dynamically."""
    schema = {}
    try:
        conn = get_db_connection()
        if conn is None:
            raise Exception("Failed to connect to the database.")
        
        cursor = conn.cursor()

        # Query to get table names
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()

        for table in tables:
            table_name = table[0]
            cursor.execute(f"DESCRIBE {table_name}")
            columns = cursor.fetchall()
            schema[table_name] = [column[0] for column in columns]

        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return {}
    except Exception as e:
        print(f"An error occurred: {e}")
        return {}

    return schema
