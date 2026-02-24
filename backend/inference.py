import os
import time
import uuid
import io
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

import numpy as np
import torch
from PIL import Image
from skimage import io as skio

from models import UnetVFLOW
from dataset import read_imgs, read_imgs_from_files, predict_tta


@dataclass
class ModelInfo:
    name: str
    path: str
    backbone: str
    loaded: bool = False


class BiomassPredictor:
    """Handles biomass prediction using multiple deep learning models."""
    
    def __init__(self, model_configs: List[Dict]):
        self.models: Dict[str, torch.nn.Module] = {}
        self.model_infos: Dict[str, ModelInfo] = {}
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        for config in model_configs:
            self.model_infos[config["name"]] = ModelInfo(
                name=config["name"],
                path=config["path"],
                backbone=config.get("backbone", "unknown")
            )
    
    def load_model(self, model_name: str) -> bool:
        """Load a specific model by name."""
        if model_name in self.models:
            return True
        
        info = self.model_infos.get(model_name)
        if not info:
            return False
        
        if not os.path.exists(info.path):
            print(f"Model file not found: {info.path}")
            return False
        
        try:
            checkpoint = torch.load(info.path, weights_only=False, map_location=self.device)
            model = UnetVFLOW(checkpoint['args'])
            model.load_state_dict(checkpoint['state_dict'])
            model = model.to(self.device)
            model.eval()
            
            self.models[model_name] = model
            info.loaded = True
            info.backbone = checkpoint['args'].backbone
            print(f"Loaded model: {model_name} ({info.backbone})")
            return True
        except Exception as e:
            print(f"Error loading model {model_name}: {e}")
            return False
    
    def load_all_models(self) -> Dict[str, bool]:
        """Load all configured models."""
        results = {}
        for name in self.model_infos.keys():
            results[name] = self.load_model(name)
        return results
    
    def get_model_info(self) -> List[Dict]:
        """Get information about all models."""
        return [
            {
                "name": info.name,
                "backbone": info.backbone,
                "loaded": info.loaded,
                "path": info.path
            }
            for info in self.model_infos.values()
        ]
    
    @torch.no_grad()
    def predict(
        self, 
        chip_id: str, 
        data_dir: Path,
        model_names: Optional[List[str]] = None,
        ntta: int = 1,
        ground_truth_path: Optional[Path] = None
    ) -> Dict:
        """
        Run prediction on a chip using specified models.
        
        Returns dict with predictions and metrics for each model.
        """
        if model_names is None:
            model_names = list(self.models.keys())
        
        # Load images
        imgs, mask = read_imgs(chip_id, data_dir)
        
        # Convert to tensors
        images = torch.from_numpy(imgs).unsqueeze(0).float().to(self.device)
        masks = torch.from_numpy(mask).unsqueeze(0).to(self.device)
        
        # Load ground truth if available
        gt_map = None
        if ground_truth_path and ground_truth_path.exists():
            gt_map = self._load_ground_truth(ground_truth_path)
        
        results = {
            "chip_id": chip_id,
            "predictions": {},
            "ground_truth_available": gt_map is not None
        }
        
        for model_name in model_names:
            if model_name not in self.models:
                if not self.load_model(model_name):
                    continue
            
            model = self.models[model_name]
            start_time = time.time()
            
            # Run prediction
            pred = predict_tta([model], images, masks, ntta=ntta)
            
            if pred.ndim == 4 and pred.shape[1] == 1:
                pred = pred[:, 0, ...]
            
            pred_np = pred.cpu().numpy()[0]  # [H, W]
            processing_time = time.time() - start_time
            
            # Calculate statistics
            stats = self._calculate_stats(pred_np)
            
            # Calculate metrics if ground truth available
            metrics = None
            if gt_map is not None:
                metrics = self._calculate_metrics(gt_map, pred_np)
            
            results["predictions"][model_name] = {
                "prediction": pred_np,
                "stats": stats,
                "metrics": metrics,
                "processing_time": processing_time,
                "backbone": self.model_infos[model_name].backbone
            }
        
        return results
    
    @torch.no_grad()
    def predict_from_files(
        self,
        file_dict: Dict[str, np.ndarray],
        model_names: Optional[List[str]] = None,
        ntta: int = 1,
        ground_truth: Optional[np.ndarray] = None
    ) -> Dict:
        """
        Run prediction from uploaded file arrays.
        """
        if model_names is None:
            model_names = list(self.models.keys())
        
        # Extract chip_id from filenames
        chip_id = "uploaded"
        for filename in file_dict.keys():
            if "_S1_" in filename or "_S2_" in filename:
                chip_id = filename.split("_S")[0]
                break
        
        # Load images from file dict
        imgs, mask = read_imgs_from_files(file_dict)
        
        # Convert to tensors
        images = torch.from_numpy(imgs).unsqueeze(0).float().to(self.device)
        masks = torch.from_numpy(mask).unsqueeze(0).to(self.device)
        
        results = {
            "chip_id": chip_id,
            "predictions": {},
            "ground_truth_available": ground_truth is not None
        }
        
        for model_name in model_names:
            if model_name not in self.models:
                if not self.load_model(model_name):
                    continue
            
            model = self.models[model_name]
            start_time = time.time()
            
            pred = predict_tta([model], images, masks, ntta=ntta)
            
            if pred.ndim == 4 and pred.shape[1] == 1:
                pred = pred[:, 0, ...]
            
            pred_np = pred.cpu().numpy()[0]
            processing_time = time.time() - start_time
            
            stats = self._calculate_stats(pred_np)
            
            metrics = None
            if ground_truth is not None:
                metrics = self._calculate_metrics(ground_truth, pred_np)
            
            results["predictions"][model_name] = {
                "prediction": pred_np,
                "stats": stats,
                "metrics": metrics,
                "processing_time": processing_time,
                "backbone": self.model_infos[model_name].backbone
            }
        
        return results
    
    def _load_ground_truth(self, path: Path) -> np.ndarray:
        """Load ground truth biomass map."""
        img = Image.open(path)
        arr = np.array(img).astype(np.float32)
        if arr.ndim == 3:
            arr = arr[..., 0]
        return arr
    
    def _calculate_stats(self, pred: np.ndarray) -> Dict:
        """Calculate prediction statistics."""
        return {
            "min": float(np.min(pred)),
            "max": float(np.max(pred)),
            "mean": float(np.mean(pred)),
            "std": float(np.std(pred)),
            "median": float(np.median(pred))
        }
    
    def _calculate_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
        """Calculate regression metrics."""
        # Flatten arrays
        yt = y_true.flatten().astype(np.float64)
        yp = y_pred.flatten().astype(np.float64)
        
        # Remove invalid values
        valid = np.isfinite(yt) & np.isfinite(yp)
        yt = yt[valid]
        yp = yp[valid]
        
        if len(yt) == 0:
            return None
        
        # Error
        err = yp - yt
        
        # RMSE
        rmse = float(np.sqrt(np.mean(err ** 2)))
        
        # MAE
        mae = float(np.mean(np.abs(err)))
        
        # Bias
        bias = float(np.mean(err))
        
        # R²
        ss_res = np.sum((yt - yp) ** 2)
        ss_tot = np.sum((yt - np.mean(yt)) ** 2)
        r2 = float(1 - ss_res / ss_tot) if ss_tot > 0 else float('nan')
        
        # Pearson correlation
        yt_centered = yt - yt.mean()
        yp_centered = yp - yp.mean()
        denom = np.sqrt(np.sum(yt_centered ** 2) * np.sum(yp_centered ** 2))
        pearson_r = float(np.sum(yt_centered * yp_centered) / denom) if denom > 0 else float('nan')
        
        return {
            "rmse": rmse,
            "mae": mae,
            "bias": bias,
            "r2": r2,
            "pearson_r": pearson_r,
            "n_pixels": int(len(yt))
        }
    
    def prediction_to_heatmap(
        self, 
        prediction: np.ndarray, 
        vmin: float = 0, 
        vmax: float = 400,
        colormap: str = "viridis"
    ) -> bytes:
        """Convert prediction array to colored heatmap PNG bytes."""
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        
        # Normalize to [0, 1]
        normalized = np.clip((prediction - vmin) / (vmax - vmin), 0, 1)
        
        # Apply colormap
        cmap = plt.get_cmap(colormap)
        colored = cmap(normalized)
        
        # Convert to uint8
        img_array = (colored[:, :, :3] * 255).astype(np.uint8)
        
        # Create PNG
        img = Image.fromarray(img_array)
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        return buffer.getvalue()
    
    def prediction_to_tiff(self, prediction: np.ndarray) -> bytes:
        """Convert prediction array to TIFF bytes."""
        img = Image.fromarray(prediction.astype(np.float32))
        buffer = io.BytesIO()
        img.save(buffer, format='TIFF')
        buffer.seek(0)
        return buffer.getvalue()


# Default predictor instance
def create_predictor(base_path: Path) -> BiomassPredictor:
    """Create predictor with default model configurations."""
    model_configs = [
        {
            "name": "MobileNetV3-Large",
            "path": str(base_path / "logs" / "model_best.pth"),
            "backbone": "mobilenetv3_large_100"
        },
        {
            "name": "EfficientNet-B5",
            "path": str(base_path / "efficientnet" / "model_best.pth"),
            "backbone": "tf_efficientnet_b5"
        }
    ]
    return BiomassPredictor(model_configs)
