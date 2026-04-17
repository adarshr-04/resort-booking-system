import google.generativeai as genai
import sys

API_KEY = 'AQ.Ab8RN6LsDRWqhulfiDvaoi-Czh_r9QDgxM-1I8olKFgsbXMCuw'

try:
    genai.configure(api_key=API_KEY)
    
    # Using the name confirmed by list_models
    print("Attempting generation with 'gemini-flash-latest'...")
    model = genai.GenerativeModel('gemini-flash-latest')
    response = model.generate_content("Say 'Resort is Ready!'")
    print(f"SUCCESS: {response.text}")
            
except Exception as e:
    print(f"FAILED: {str(e)}")
