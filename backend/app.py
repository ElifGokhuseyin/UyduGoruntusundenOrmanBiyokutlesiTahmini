import os
import uuid
import json
import base64
import shutil
import tempfile
import re
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict, Any

import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from skimage import io as skio
import tifffile
import io

from inference import create_predictor, BiomassPredictor

# Initialize FastAPI app
app = FastAPI(
    title="Biomass Estimation API",
    description="API for forest biomass estimation using deep learning models",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base paths
BASE_PATH = Path(__file__).resolve().parent.parent
TEST_DATA_PATH = BASE_PATH / "test_subset100chip"
RESULTS_PATH = BASE_PATH / "results"
RESULTS_PATH.mkdir(exist_ok=True)

# Initialize predictor
predictor: Optional[BiomassPredictor] = None

# Results storage (in-memory for demo, use database for production)
results_storage: Dict[str, Dict] = {}


class PredictionRequest(BaseModel):
    chip_id: str
    model_names: Optional[List[str]] = None
    ntta: int = 1
    include_ground_truth: bool = True


class PredictionResult(BaseModel):
    id: str
    chip_id: str
    timestamp: str
    models: Dict[str, Any]
    ground_truth_available: bool


def extract_chip_id(filename: str) -> Optional[str]:
    """
    Extract chip_id from filename like '0d4b9de6_S1_02.tif' or '0d4b9de6_S2_06.tif'
    Returns the chip_id (e.g., '0d4b9de6') or None if pattern doesn't match
    """
    # Pattern: chipid_S1_XX.tif or chipid_S2_XX.tif
    match = re.match(r'^([a-f0-9]+)_S[12]_\d+\.tif$', filename, re.IGNORECASE)
    if match:
        return match.group(1)
    
    # Also try pattern without strict extension check
    match = re.match(r'^([a-f0-9]+)_S[12]_\d+', filename, re.IGNORECASE)
    if match:
        return match.group(1)
    
    return None


@app.on_event("startup")
async def startup_event():
    """Initialize models on startup."""
    global predictor
    print("Initializing biomass prediction models...")
    predictor = create_predictor(BASE_PATH)
    load_results = predictor.load_all_models()
    print(f"Model loading results: {load_results}")


@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "message": "Biomass Estimation API",
        "version": "1.0.0",
        "endpoints": {
            "models": "/api/models",
            "predict": "/api/predict",
            "results": "/api/results",
            "chips": "/api/chips"
        }
    }


@app.get("/api/models")
async def get_models():
    """Get information about available models."""
    if predictor is None:
        raise HTTPException(status_code=503, detail="Models not initialized")
    
    return {
        "models": predictor.get_model_info(),
        "device": str(predictor.device)
    }


@app.get("/api/chips")
async def get_available_chips():
    """Get list of available chip IDs in test dataset."""
    features_dir = TEST_DATA_PATH / "test_features"
    
    if not features_dir.exists():
        return {"chips": [], "message": "Test features directory not found"}
    
    # Find unique chip IDs
    chip_ids = set()
    for f in features_dir.glob("*_S1_*.tif"):
        chip_id = f.name.split("_S1_")[0]
        chip_ids.add(chip_id)
    
    return {
        "chips": sorted(list(chip_ids)),
        "count": len(chip_ids),
        "features_dir": str(features_dir)
    }


@app.post("/api/predict")
async def predict_biomass(request: PredictionRequest):
    """Run biomass prediction on a chip from the test dataset."""
    if predictor is None:
        raise HTTPException(status_code=503, detail="Models not initialized")
    
    features_dir = TEST_DATA_PATH / "test_features"
    gt_dir = TEST_DATA_PATH / "test_agbm"
    
    # Check if chip exists
    s1_file = features_dir / f"{request.chip_id}_S1_00.tif"
    if not s1_file.exists():
        raise HTTPException(status_code=404, detail=f"Chip {request.chip_id} not found")
    
    # Get ground truth path if requested
    gt_path = None
    if request.include_ground_truth:
        gt_path = gt_dir / f"{request.chip_id}_agbm.tif"
        if not gt_path.exists():
            gt_path = None
    
    # Run prediction
    try:
        results = predictor.predict(
            chip_id=request.chip_id,
            data_dir=features_dir,
            model_names=request.model_names,
            ntta=request.ntta,
            ground_truth_path=gt_path
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    # Generate result ID
    result_id = str(uuid.uuid4())[:8]
    timestamp = datetime.now().isoformat()
    
    # Process predictions for response
    processed_predictions = {}
    for model_name, pred_data in results["predictions"].items():
        # Convert prediction to base64 heatmap
        heatmap_bytes = predictor.prediction_to_heatmap(
            pred_data["prediction"],
            vmin=0,
            vmax=400,
            colormap="viridis"
        )
        heatmap_b64 = base64.b64encode(heatmap_bytes).decode()
        
        processed_predictions[model_name] = {
            "heatmap": heatmap_b64,
            "stats": pred_data["stats"],
            "metrics": pred_data["metrics"],
            "processing_time": pred_data["processing_time"],
            "backbone": pred_data["backbone"]
        }
    
    # Store result
    stored_result = {
        "id": result_id,
        "chip_id": results["chip_id"],
        "timestamp": timestamp,
        "models": processed_predictions,
        "ground_truth_available": results["ground_truth_available"],
        "predictions_raw": {
            name: data["prediction"].tolist()
            for name, data in results["predictions"].items()
        }
    }
    results_storage[result_id] = stored_result
    
    # Return response (without raw predictions to reduce size)
    response = {
        "id": result_id,
        "chip_id": results["chip_id"],
        "timestamp": timestamp,
        "models": processed_predictions,
        "ground_truth_available": results["ground_truth_available"]
    }
    
    return response


@app.post("/api/predict/upload")
async def predict_from_upload(
    files: List[UploadFile] = File(...),
    model_names: Optional[str] = Query(None),
    ntta: int = Query(1),
):
    """
    Run biomass prediction on uploaded TIFF files.
    
    If the uploaded file matches a chip in test_features (e.g., '0d4b9de6_S1_02.tif'),
    it will automatically load all related files and ground truth from the test dataset.
    """
    if predictor is None:
        raise HTTPException(status_code=503, detail="Models not initialized")
    
    # Parse model names
    selected_models = None
    if model_names:
        selected_models = [m.strip() for m in model_names.split(",")]
    
    features_dir = TEST_DATA_PATH / "test_features"
    gt_dir = TEST_DATA_PATH / "test_agbm"
    
    # Try to extract chip_id from uploaded filenames
    chip_id = None
    for file in files:
        extracted_id = extract_chip_id(file.filename)
        if extracted_id:
            # Check if this chip exists in test_features
            s1_check = features_dir / f"{extracted_id}_S1_00.tif"
            if s1_check.exists():
                chip_id = extracted_id
                print(f"Found chip_id from uploaded file: {chip_id}")
                break
    
    # If we found a valid chip_id, use the standard prediction flow
    if chip_id:
        # Get ground truth path
        gt_path = gt_dir / f"{chip_id}_agbm.tif"
        if not gt_path.exists():
            gt_path = None
            print(f"Ground truth not found for chip: {chip_id}")
        else:
            print(f"Found ground truth: {gt_path}")
        
        # Run prediction using test dataset files
        try:
            results = predictor.predict(
                chip_id=chip_id,
                data_dir=features_dir,
                model_names=selected_models,
                ntta=ntta,
                ground_truth_path=gt_path
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        
        # Generate result ID
        result_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().isoformat()
        
        # Process predictions for response
        processed_predictions = {}
        for model_name, pred_data in results["predictions"].items():
            heatmap_bytes = predictor.prediction_to_heatmap(
                pred_data["prediction"],
                vmin=0,
                vmax=400,
                colormap="viridis"
            )
            heatmap_b64 = base64.b64encode(heatmap_bytes).decode()
            
            processed_predictions[model_name] = {
                "heatmap": heatmap_b64,
                "stats": pred_data["stats"],
                "metrics": pred_data["metrics"],
                "processing_time": pred_data["processing_time"],
                "backbone": pred_data["backbone"]
            }
        
        # Store result
        stored_result = {
            "id": result_id,
            "chip_id": results["chip_id"],
            "timestamp": timestamp,
            "models": processed_predictions,
            "ground_truth_available": results["ground_truth_available"],
            "predictions_raw": {
                name: data["prediction"].tolist()
                for name, data in results["predictions"].items()
            }
        }
        results_storage[result_id] = stored_result
        
        response = {
            "id": result_id,
            "chip_id": results["chip_id"],
            "timestamp": timestamp,
            "models": processed_predictions,
            "ground_truth_available": results["ground_truth_available"]
        }
        
        return response
    
    # Fallback: Process uploaded files directly (original behavior)
    # This is for when the uploaded files don't match any chip in test_features
    print("No matching chip found, processing uploaded files directly...")
    
    file_dict = {}
    ground_truth = None
    
    for file in files:
        content = await file.read()
        try:
            # Read TIFF from bytes using tifffile for multi-band satellite imagery
            img = tifffile.imread(io.BytesIO(content))
            
            if "_agbm" in file.filename.lower():
                ground_truth = img.astype(np.float32)
                if ground_truth.ndim == 3:
                    ground_truth = ground_truth[..., 0]
            else:
                file_dict[file.filename] = img
        except Exception as e:
            print(f"Error reading {file.filename}: {e}")
            continue
    
    if not file_dict:
        raise HTTPException(status_code=400, detail="No valid TIFF files uploaded")
    
    # Run prediction
    try:
        results = predictor.predict_from_files(
            file_dict=file_dict,
            model_names=selected_models,
            ntta=ntta,
            ground_truth=ground_truth
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    # Generate result ID
    result_id = str(uuid.uuid4())[:8]
    timestamp = datetime.now().isoformat()
    
    # Process predictions
    processed_predictions = {}
    for model_name, pred_data in results["predictions"].items():
        heatmap_bytes = predictor.prediction_to_heatmap(
            pred_data["prediction"],
            vmin=0,
            vmax=400,
            colormap="viridis"
        )
        heatmap_b64 = base64.b64encode(heatmap_bytes).decode()
        
        processed_predictions[model_name] = {
            "heatmap": heatmap_b64,
            "stats": pred_data["stats"],
            "metrics": pred_data["metrics"],
            "processing_time": pred_data["processing_time"],
            "backbone": pred_data["backbone"]
        }
    
    # Store result
    stored_result = {
        "id": result_id,
        "chip_id": results["chip_id"],
        "timestamp": timestamp,
        "models": processed_predictions,
        "ground_truth_available": results["ground_truth_available"],
        "predictions_raw": {
            name: data["prediction"].tolist()
            for name, data in results["predictions"].items()
        }
    }
    results_storage[result_id] = stored_result
    
    response = {
        "id": result_id,
        "chip_id": results["chip_id"],
        "timestamp": timestamp,
        "models": processed_predictions,
        "ground_truth_available": results["ground_truth_available"]
    }
    
    return response


@app.get("/api/results")
async def get_all_results():
    """Get all prediction results."""
    results_list = []
    for result_id, result in results_storage.items():
        results_list.append({
            "id": result["id"],
            "chip_id": result["chip_id"],
            "timestamp": result["timestamp"],
            "models": list(result["models"].keys()),
            "ground_truth_available": result["ground_truth_available"]
        })
    
    return {"results": sorted(results_list, key=lambda x: x["timestamp"], reverse=True)}


@app.get("/api/results/{result_id}")
async def get_result(result_id: str):
    """Get a specific prediction result."""
    if result_id not in results_storage:
        raise HTTPException(status_code=404, detail="Result not found")
    
    result = results_storage[result_id]
    return {
        "id": result["id"],
        "chip_id": result["chip_id"],
        "timestamp": result["timestamp"],
        "models": result["models"],
        "ground_truth_available": result["ground_truth_available"]
    }


@app.get("/api/results/{result_id}/download/{model_name}")
async def download_prediction(result_id: str, model_name: str):
    """Download prediction as TIFF file."""
    if result_id not in results_storage:
        raise HTTPException(status_code=404, detail="Result not found")
    
    result = results_storage[result_id]
    
    if model_name not in result.get("predictions_raw", {}):
        raise HTTPException(status_code=404, detail=f"Model {model_name} not found in result")
    
    # Convert list back to numpy array
    pred_array = np.array(result["predictions_raw"][model_name], dtype=np.float32)
    
    # Create TIFF
    tiff_bytes = predictor.prediction_to_tiff(pred_array)
    
    filename = f"{result['chip_id']}_{model_name.replace(' ', '_')}_prediction.tif"
    
    return StreamingResponse(
        io.BytesIO(tiff_bytes),
        media_type="image/tiff",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/ground-truth/{chip_id}")
async def get_ground_truth(chip_id: str):
    """Get ground truth heatmap for a chip."""
    gt_path = TEST_DATA_PATH / "test_agbm" / f"{chip_id}_agbm.tif"
    
    if not gt_path.exists():
        raise HTTPException(status_code=404, detail="Ground truth not found")
    
    gt_img = skio.imread(gt_path).astype(np.float32)
    if gt_img.ndim == 3:
        gt_img = gt_img[..., 0]
    
    # Create heatmap
    heatmap_bytes = predictor.prediction_to_heatmap(gt_img, vmin=0, vmax=400, colormap="viridis")
    heatmap_b64 = base64.b64encode(heatmap_bytes).decode()
    
    stats = {
        "min": float(np.min(gt_img)),
        "max": float(np.max(gt_img)),
        "mean": float(np.mean(gt_img)),
        "std": float(np.std(gt_img)),
        "median": float(np.median(gt_img))
    }
    
    return {
        "chip_id": chip_id,
        "heatmap": heatmap_b64,
        "stats": stats
    }


@app.delete("/api/results/{result_id}")
async def delete_result(result_id: str):
    """Delete a prediction result."""
    if result_id not in results_storage:
        raise HTTPException(status_code=404, detail="Result not found")
    
    del results_storage[result_id]
    return {"message": "Result deleted", "id": result_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)