from waitress import serve
from app import app  # This imports 'app' from your app.py file
import logging

# Set up logging so you can see errors if the server crashes
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

if __name__ == '__main__':
    # Port 80 is the standard port for live websites (HTTP)
    # If you are doing a "Staging" test, you can change this to 8080
    PORT = 80 
    
    logging.info(f"Starting Production Server on port {PORT}...")
    logging.info("Press CTRL+C to stop.")
    
    # Run the Waitress WSGI server
    serve(app, host='0.0.0.0', port=PORT, threads=6)