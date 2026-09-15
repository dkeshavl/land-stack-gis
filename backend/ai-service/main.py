from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
import uvicorn

app = FastAPI()

# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def calculate_image_difference(imageA, imageB):
    # Convert images to grayscale for comparison
    grayA = cv2.cvtColor(imageA, cv2.COLOR_BGR2GRAY)
    grayB = cv2.cvtColor(imageB, cv2.COLOR_BGR2GRAY)

    # Compute the Structural Similarity Index (SSIM)
    score, diff = ssim(grayA, grayB, full=True)
    
    # Calculate percentage of change
    similarity = score * 100
    change = 100 - similarity
    return change

@app.post("/api/detect-encroachment")
async def detect_encroachment(file1: UploadFile = File(...), file2: UploadFile = File(...)):
    # Read the uploaded image files
    contents1 = await file1.read()
    contents2 = await file2.read()
    
    # Convert to numpy arrays
    nparr1 = np.frombuffer(contents1, np.uint8)
    nparr2 = np.frombuffer(contents2, np.uint8)
    
    # Decode into OpenCV image formats
    img1 = cv2.imdecode(nparr1, cv2.IMREAD_COLOR)
    img2 = cv2.imdecode(nparr2, cv2.IMREAD_COLOR)
    
    # Resize image 2 to match image 1 dimensions just in case
    img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
    
    # Run the AI comparison
    change_percentage = calculate_image_difference(img1, img2)
    
    # If the landscape changed by more than 15%, flag it
    status = "Unauthorized Construction Detected" if change_percentage > 15.0 else "No Major Changes"
    
    return {
        "similarity_score": round(100 - change_percentage, 2),
        "change_percentage": round(change_percentage, 2),
        "status": status
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)