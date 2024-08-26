from flask import Flask, request, jsonify, render_template
from openai_api import generate_openai_response
from database import get_database_schema, get_db_connection
import json

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run_query', methods=['POST'])
def run_query():
    user_prompt = request.json.get('UserPrompt', '')

    if not user_prompt:
        return jsonify({'error': 'User prompt is required'}), 400
    
    schema = get_database_schema()
    schema_str = json.dumps(schema, indent=4)

    system_message = f"""
    You are a helpful, cheerful database assistant. 
    Use the following dynamically retrieved database schema when creating your answers:

    {schema_str}

    When creating your answers, consider the following:

    1. If a query involves a column or value that is not present in the provided database schema, correct it and mention the correction in the summary. If a column or value is missing, provide an explanation of the issue and adjust the query accordingly.
    2. If there is a spelling mistake in the column name or value, attempt to correct it by matching the closest possible column or value from the schema. Mention this correction in the summary to clarify any changes made.
    3. Ensure that the correct columns and values are used based on the schema provided. Verify the query against the schema to confirm accuracy.
    4. Include column name headers in the query results for clarity.

    Always provide your answer in the JSON format below:

    {{ "summary": "your-summary", "query":  "your-query" }}
    
    Output ONLY JSON.
    In the preceding JSON response, substitute "your-query" with a MariaDB query to retrieve the requested data.
    In the preceding JSON response, substitute "your-summary" with a summary of the query and any corrections or clarifications made.
    Always include all columns in the table.
    """

    raw_content = generate_openai_response(system_message, user_prompt)
    
    if raw_content is None:
        return jsonify({'error': 'Failed to get response from OpenAI API.'}), 500
    
    # Debug: Log the raw content to inspect it
    print("Raw content from OpenAI:", raw_content)
    
    try:
        ai_response = json.loads(raw_content.replace("```json", "").replace("```", ""))
        summary = ai_response.get('summary', '')
        query = ai_response.get('query', '')

        if query and query != "NA":
            # Connect to the MySQL database
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)

            # Execute the query
            cursor.execute(query)
            row_data = cursor.fetchall()

            cursor.close()
            conn.close()

            return jsonify({'summary': summary, 'rowData': row_data})
        else: 
            return jsonify({'summary': summary, 'query': 'NA', 'error': 'Non-executable query'})

    except json.JSONDecodeError as json_err:
        print("JSON decode error:", json_err)
        return jsonify({'error': 'Failed to parse the response from OpenAI. Please check the response format.'}), 500
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': str(e)}), 500
