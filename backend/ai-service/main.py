from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
import uvicorn
import os

app = FastAPI(title="LandStack Encroachment AI")

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

    # Compute the Structural Similarity Index (SSIM) with explicit data_range
    score, diff = ssim(grayA, grayB, full=True, data_range=255)
    
    # Calculate percentage of change
    similarity = float(score) * 100.0
    change = 100.0 - similarity
    return max(0.0, min(100.0, change))

@app.get("/")
def root():
    return {"status": "online", "service": "Encroachment AI Service"}

@app.post("/api/detect-encroachment")
async def detect_encroachment(file1: UploadFile = File(...), file2: UploadFile = File(...)):
    try:
        # Read the uploaded image files
        contents1 = await file1.read()
        contents2 = await file2.read()
        
        # Convert to numpy arrays
        nparr1 = np.frombuffer(contents1, np.uint8)
        nparr2 = np.frombuffer(contents2, np.uint8)
        
        # Decode into OpenCV image formats
        img1 = cv2.imdecode(nparr1, cv2.IMREAD_COLOR)
        img2 = cv2.imdecode(nparr2, cv2.IMREAD_COLOR)
        
        if img1 is None or img2 is None:
            raise HTTPException(
                status_code=400, 
                detail="One or both uploaded files could not be decoded as valid images."
            )
        
        # Resize image 2 to match image 1 dimensions
        img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        
        # Run the AI comparison
        change_percentage = calculate_image_difference(img1, img2)
        
        # If the landscape changed by more than 15%, flag it
        status = "Unauthorized Construction Detected" if change_percentage > 15.0 else "No Major Changes"
        
        return {
            "similarity_score": round(100.0 - change_percentage, 2),
            "change_percentage": round(change_percentage, 2),
            "status": status
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing error: {str(e)}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)