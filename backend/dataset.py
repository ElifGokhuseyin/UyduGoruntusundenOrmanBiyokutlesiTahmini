import numpy as np
import torch
import tifffile
from pathlib import Path


s1_min = np.array([-25, -62, -25, -60], dtype="float32")
s1_max = np.array([29, 28, 30, 22], dtype="float32")
s1_mm = s1_max - s1_min

s2_max = np.array(
    [19616., 18400., 17536., 17097., 16928., 16768., 16593., 16492., 15401., 15226., 255.],
    dtype="float32",
)

IMG_SIZE = (256, 256)


def read_imgs(chip_id: str, data_dir: Path):
    """Read 12 months of S1 and S2 satellite imagery for a chip."""
    imgs, mask = [], []
    
    for month in range(12):
        # Read S1 (Sentinel-1) data
        s1_path = data_dir / f"{chip_id}_S1_{month:0>2}.tif"
        if s1_path.is_file():
            img_s1 = tifffile.imread(s1_path)
            m = img_s1 == -9999
            img_s1 = img_s1.astype("float32")
            img_s1 = (img_s1 - s1_min) / s1_mm
            img_s1 = np.where(m, 0, img_s1)
        else:
            img_s1 = np.zeros(IMG_SIZE + (4,), dtype="float32")
        
        # Read S2 (Sentinel-2) data
        s2_path = data_dir / f"{chip_id}_S2_{month:0>2}.tif"
        if s2_path.is_file():
            img_s2 = tifffile.imread(s2_path)
            img_s2 = img_s2.astype("float32")
            img_s2 = img_s2 / s2_max
        else:
            img_s2 = np.zeros(IMG_SIZE + (11,), dtype="float32")

        # Concatenate S1 and S2
        img = np.concatenate([img_s1, img_s2], axis=2)
        img = np.transpose(img, (2, 0, 1))  # [C, H, W]
        imgs.append(img)
        mask.append(False)

    mask = np.array(mask)
    imgs = np.stack(imgs, axis=0)  # [T, C, H, W]

    return imgs, mask


def read_imgs_from_files(file_dict: dict):
    """
    Read satellite imagery from a dictionary of uploaded files.
    file_dict: {filename: numpy_array} mapping
    """
    imgs, mask = [], []
    
    for month in range(12):
        # Find S1 file for this month
        s1_key = None
        s2_key = None
        
        for filename in file_dict.keys():
            if f"_S1_{month:0>2}.tif" in filename:
                s1_key = filename
            if f"_S2_{month:0>2}.tif" in filename:
                s2_key = filename
        
        # Process S1
        if s1_key and file_dict[s1_key] is not None:
            img_s1 = file_dict[s1_key]
            m = img_s1 == -9999
            img_s1 = img_s1.astype("float32")
            img_s1 = (img_s1 - s1_min) / s1_mm
            img_s1 = np.where(m, 0, img_s1)
        else:
            img_s1 = np.zeros(IMG_SIZE + (4,), dtype="float32")
        
        # Process S2
        if s2_key and file_dict[s2_key] is not None:
            img_s2 = file_dict[s2_key]
            img_s2 = img_s2.astype("float32")
            img_s2 = img_s2 / s2_max
        else:
            img_s2 = np.zeros(IMG_SIZE + (11,), dtype="float32")

        img = np.concatenate([img_s1, img_s2], axis=2)
        img = np.transpose(img, (2, 0, 1))
        imgs.append(img)
        mask.append(False)

    mask = np.array(mask)
    imgs = np.stack(imgs, axis=0)

    return imgs, mask


def predict_tta(models, images, masks, ntta=1):
    """Test-time augmentation prediction."""
    result = images.new_zeros((images.shape[0], 1, images.shape[-2], images.shape[-1]))
    n = 0
    
    for model in models:
        logits = model(images, masks)
        result += logits
        n += 1

        if ntta >= 2:
            # horizontal flip
            logits = model(torch.flip(images, dims=[-1]), masks)
            result += torch.flip(logits, dims=[-1])
            n += 1

        if ntta >= 3:
            # vertical flip
            logits = model(torch.flip(images, dims=[-2]), masks)
            result += torch.flip(logits, dims=[-2])
            n += 1

        if ntta >= 4:
            # horizontal + vertical flip
            logits = model(torch.flip(images, dims=[-2, -1]), masks)
            result += torch.flip(logits, dims=[-2, -1])
            n += 1

    result /= n * len(models)
    return result
