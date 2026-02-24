# Biomass Estimation Web Application

A professional web application for forest biomass estimation from satellite imagery using deep learning models.

![Biomass Estimation](https://img.shields.io/badge/Biomass-Estimation-green)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688)

## Features
- Multi-temporal Sentinel-1 and Sentinel-2 satellite imagery processing (12-month time series)
- Above-Ground Biomass (AGBM) estimation using LiDAR-calibrated ground truth data
- Deep learning-based regression framework for biomass prediction
- Comparative analysis of two backbone architectures: MobileNetV3-Large and EfficientNet-B5
- UNet-style encoder–decoder architecture for spatial prediction
- Multi-band (15-channel) geospatial data preprocessing and normalization
- Model training with advanced optimization strategies (AdamW, learning rate scheduling, mixed precision)
- Comprehensive performance evaluation using RMSE, MAE, R², and correlation metrics
- Experimental subset analysis to evaluate scalability and generalization performance
- Web-based visualization interface for prediction and ground-truth comparison
- REST API-based inference pipeline with GeoTIFF input support
- Full-stack implementation with FastAPI backend and React frontend

  
## Project Structure

```
elif-website/
├── backend/
│   ├── app.py              # FastAPI application
│   ├── inference.py        # Model inference logic
│   ├── models.py           # UnetVFLOW architecture
│   ├── dataset.py          # Data preprocessing
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── App.jsx         # Main app
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
├── efficientnet/
│   └── model_best.pth      # EfficientNet-B5 weights
├── logs/
│   └── model_best.pth      # MobileNetV3 weights
└── test_subset100chip/
    ├── test_features/      # Test satellite imagery
    └── test_agbm/          # Ground truth data
```

## Quick Start

### Backend Setup

1. Download the required files from this link:
   https://drive.google.com/file/d/10kagONU6nyuVe_VD1HK3-uxP8-DYzHUq/view?usp=drive_link
   (İçindeki 3 klasörü elif-website klasörü içine yükleyiniz.)

3. Create a virtual environment:
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the API server:
```bash
python app.py
# Or use uvicorn:
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/models` | List available models |
| GET | `/api/chips` | List test chip IDs |
| POST | `/api/predict` | Run prediction on test chip |
| POST | `/api/predict/upload` | Run prediction on uploaded files |
| GET | `/api/results` | Get all prediction results |
| GET | `/api/results/{id}` | Get specific result |
| GET | `/api/results/{id}/download/{model}` | Download prediction TIFF |
| GET | `/api/ground-truth/{chip_id}` | Get ground truth heatmap |

## Model Details

### MobileNetV3-Large
- **Architecture**: UNet with MobileNetV3 encoder
- **Parameters**: ~5.4M
- **Speed**: Fast inference
- **Use case**: Real-time applications

### EfficientNet-B5
- **Architecture**: UNet with EfficientNet-B5 encoder
- **Parameters**: ~30M
- **Speed**: Moderate
- **Use case**: High-accuracy requirements

## Input Data Format

The models expect satellite imagery in the following format:

- **Sentinel-1**: 4 channels (VV, VH, VV/VH ratio, temporal stats)
- **Sentinel-2**: 11 spectral bands
- **Temporal**: 12 monthly observations
- **Spatial**: 256×256 pixels per chip
- **Format**: GeoTIFF (.tif)

### Filename Convention
```
{chip_id}_S1_{month:02d}.tif  # Sentinel-1
{chip_id}_S2_{month:02d}.tif  # Sentinel-2
{chip_id}_agbm.tif            # Ground truth (optional)
```

## Metrics

| Metric | Description |
|--------|-------------|
| RMSE | Root Mean Square Error |
| MAE | Mean Absolute Error |
| Bias | Mean prediction error |
| R² | Coefficient of determination |
| Pearson r | Pearson correlation coefficient |

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PyTorch**: Deep learning framework
- **timm**: Pre-trained model backbones
- **segmentation-models-pytorch**: UNet decoder

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool
- **TailwindCSS**: Utility-first CSS
- **Framer Motion**: Animations
- **Recharts**: Data visualization
- **Lucide React**: Icons

## Configuration

### Environment Variables

```bash
# Backend
CUDA_VISIBLE_DEVICES=0  # GPU device (optional)

# Frontend (in .env.local)
VITE_API_BASE_URL=http://localhost:8000/api
```

## License

This project is developed for forest carbon monitoring and conservation applications.

## Acknowledgments

- Sentinel-1/2 data from ESA Copernicus Programme
- Pre-trained models from timm library
- UNet architecture from segmentation-models-pytorch
