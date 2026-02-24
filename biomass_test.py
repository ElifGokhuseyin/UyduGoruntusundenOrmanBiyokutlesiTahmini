#!/usr/bin/env python
# coding: utf-8

import argparse
import os
from pathlib import Path

os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

import numpy as np
import pandas as pd
import torch
import torch.utils.data
import tqdm
import PIL.Image as Image

import dataset


def parse_args(args=None):
    p = argparse.ArgumentParser()

    p.add_argument("--test-df", type=str, default="./data/features_metadata.csv",
                   help="path to test df")
    p.add_argument("--test-images-dir", type=str, default="./data/test_features",
                   help="path to test dir (features)")

    p.add_argument("--model-path", type=str, required=True, help="path to model")
    p.add_argument("--out-dir", type=str, required=True, help="output directory")

    # GT
    p.add_argument("--gt-dir", type=str, required=True,
                   help="ground truth directory (one file per chip_id)")
    p.add_argument("--gt-suffix", type=str, default="_agbm.tif",
                   help="GT filename suffix, e.g. _agbm.tif -> {chip_id}_agbm.tif")
    p.add_argument("--gt-ext", type=str, default="tif",
                   help="fallback extension if suffix file not found")

    p.add_argument("--num-workers", type=int, default=8, help="number of data loader workers")
    p.add_argument("--batch-size", type=int, default=32, help="batch size")
    p.add_argument("--tta", type=int, default=1, help="tta")
    p.add_argument("--img-size", type=int, nargs=2, default=dataset.IMG_SIZE)

    # Output handling
    p.add_argument("--save-pred-tiff", action="store_true",
                   help="save predicted regression map to out_dir as tif")

    # Shape mismatch
    p.add_argument("--resize-gt-to-pred", action="store_true",
                   help="if gt and pred shapes differ, resize gt to pred using bilinear")

    # Valid pixels masking (optional)
    p.add_argument("--mask-nan-inf", action="store_true",
                   help="drop NaN/Inf pixels from both y_true and y_pred")
    p.add_argument("--clip-gt", type=float, nargs=2, default=None,
                   help="clip ground truth to [min max], e.g. --clip-gt 0 300")
    p.add_argument("--clip-pred", type=float, nargs=2, default=None,
                   help="clip prediction to [min max], e.g. --clip-pred 0 300")

    return p.parse_args(args=args)


def _load_float_raster(path: Path) -> np.ndarray:
    """Load TIFF/PNG/etc as float32 array (H,W)."""
    im = Image.open(path)
    arr = np.array(im)
    if arr.ndim == 3:
        arr = arr[..., 0]
    return arr.astype(np.float32)


def _resize_bilinear(arr: np.ndarray, new_hw: tuple[int, int]) -> np.ndarray:
    """Bilinear resize for continuous targets."""
    # PIL expects (W,H)
    im = Image.fromarray(arr.astype(np.float32))
    im = im.resize((new_hw[1], new_hw[0]), resample=Image.BILINEAR)
    return np.array(im).astype(np.float32)


def _safe_r2(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    # R2 = 1 - SS_res/SS_tot
    yt = y_true.astype(np.float64)
    yp = y_pred.astype(np.float64)
    ss_res = np.sum((yt - yp) ** 2)
    mean = np.mean(yt)
    ss_tot = np.sum((yt - mean) ** 2)
    if ss_tot <= 0:
        return float("nan")
    return float(1.0 - ss_res / ss_tot)


def _pearsonr(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    yt = y_true.astype(np.float64)
    yp = y_pred.astype(np.float64)
    yt = yt - yt.mean()
    yp = yp - yp.mean()
    denom = np.sqrt(np.sum(yt ** 2) * np.sum(yp ** 2))
    if denom == 0:
        return float("nan")
    return float(np.sum(yt * yp) / denom)


def _rankdata(a: np.ndarray) -> np.ndarray:
    """
    Simple rankdata (average ranks for ties) without scipy.
    Returns ranks starting at 1.
    """
    a = a.astype(np.float64)
    order = np.argsort(a, kind="mergesort")
    ranks = np.empty_like(order, dtype=np.float64)
    ranks[order] = np.arange(1, len(a) + 1, dtype=np.float64)

    # average ties
    sorted_a = a[order]
    i = 0
    while i < len(a):
        j = i
        while j + 1 < len(a) and sorted_a[j + 1] == sorted_a[i]:
            j += 1
        if j > i:
            avg = (i + 1 + j + 1) / 2.0
            ranks[order[i:j + 1]] = avg
        i = j + 1
    return ranks


def _spearmanr(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    rt = _rankdata(y_true)
    rp = _rankdata(y_pred)
    return _pearsonr(rt, rp)


def _regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    err = (y_pred - y_true).astype(np.float64)
    mae = float(np.mean(np.abs(err)))
    rmse = float(np.sqrt(np.mean(err ** 2)))
    bias = float(np.mean(err))  # mean error (pred - true)
    r2 = _safe_r2(y_true, y_pred)
    pr = _pearsonr(y_true, y_pred)
    sr = _spearmanr(y_true, y_pred)

    return {
        "rmse": rmse,
        "mae": mae,
        "bias": bias,
        "r2": r2,
        "pearson_r": pr,
        "spearman_rho": sr,
        "n": int(len(y_true)),
        "y_true_mean": float(np.mean(y_true)),
        "y_pred_mean": float(np.mean(y_pred)),
        "y_true_std": float(np.std(y_true)),
        "y_pred_std": float(np.std(y_pred)),
    }


def main():
    args = parse_args()
    print(args)

    # Checkpoint'i yükle
    checkpoint = torch.load(args.model_path, weights_only=False)
    
    # Model mimarisini oluştur
    from models import UnetVFLOW
    model = UnetVFLOW(checkpoint['args'])
    
    # Ağırlıkları yükle
    model.load_state_dict(checkpoint['state_dict'])
    model = model.eval()
    models = [model]

    df = pd.read_csv(args.test_df)
    test_df = df[df.split == "test"].copy()
    test_df = test_df.groupby("chip_id").agg(list).reset_index()

    test_images_dir = Path(args.test_images_dir)
    gt_dir = Path(args.gt_dir)

    test_dataset = dataset.DS(df=test_df, dir_features=test_images_dir)

    args.num_workers = min(args.num_workers, args.batch_size, 8)

    test_loader = torch.utils.data.DataLoader(
        test_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        sampler=None,
        collate_fn=None,
        num_workers=args.num_workers,
        pin_memory=True,
        persistent_workers=(args.num_workers > 0),
        drop_last=False,
    )

    out_dir = Path(args.out_dir)
    out_dir.mkdir(exist_ok=True, parents=True)

    per_chip_rows = []
    scatter_rows = []

    # For global (micro) metrics
    global_y_true = []
    global_y_pred = []

    with torch.no_grad():
        with tqdm.tqdm(test_loader, leave=False, mininterval=2) as pbar:
            for images, mask, target in pbar:
                #images = images.cuda(non_blocking=True)
                #mask = mask.cuda(non_blocking=True)

                pred = dataset.predict_tta(models, images, mask, ntta=args.tta)
                # pred expected shape: (B,1,H,W) or (B,H,W)
                if pred.ndim == 4 and pred.shape[1] == 1:
                    pred = pred[:, 0, ...]  # (B,H,W)

                pred_np = pred.detach().float().cpu().numpy()  # (B,H,W)

                for pred_map, chip_id in zip(pred_np, target):
                    chip_id = str(chip_id)

                    # save prediction map
                    if args.save_pred_tiff:
                        im = Image.fromarray(pred_map.astype(np.float32))
                        im.save(out_dir / f"{chip_id}_pred.tif", format="TIFF", save_all=True)

                    # load gt map
                    gt_path = gt_dir / f"{chip_id}{args.gt_suffix}"
                    if not gt_path.exists():
                        alt = gt_dir / f"{chip_id}.{args.gt_ext}"
                        if alt.exists():
                            gt_path = alt
                        else:
                            per_chip_rows.append({
                                "chip_id": chip_id,
                                "error": f"GT not found: {gt_dir}/{chip_id}{args.gt_suffix} (or .{args.gt_ext})"
                            })
                            continue

                    gt_map = _load_float_raster(gt_path)

                    # align shapes
                    if gt_map.shape != pred_map.shape:
                        if args.resize_gt_to_pred:
                            gt_map = _resize_bilinear(gt_map, pred_map.shape)
                        else:
                            per_chip_rows.append({
                                "chip_id": chip_id,
                                "error": f"Shape mismatch gt={gt_map.shape} pred={pred_map.shape}"
                            })
                            continue

                    # optional clipping
                    if args.clip_gt is not None:
                        gt_map = np.clip(gt_map, args.clip_gt[0], args.clip_gt[1])
                    if args.clip_pred is not None:
                        pred_map = np.clip(pred_map, args.clip_pred[0], args.clip_pred[1])

                    # flatten
                    y_true = gt_map.reshape(-1)
                    y_pred = pred_map.reshape(-1)

                    # optional NaN/Inf masking
                    if args.mask_nan_inf:
                        m = np.isfinite(y_true) & np.isfinite(y_pred)
                        y_true = y_true[m]
                        y_pred = y_pred[m]

                    if len(y_true) == 0:
                        per_chip_rows.append({
                            "chip_id": chip_id,
                            "error": "No valid pixels after masking"
                        })
                        continue

                    # metrics per chip
                    m = _regression_metrics(y_true, y_pred)
                    m["chip_id"] = chip_id
                    m["gt_path"] = str(gt_path)
                    m["error"] = ""
                    per_chip_rows.append(m)

                    # collect for global micro metrics
                    global_y_true.append(y_true.astype(np.float32))
                    global_y_pred.append(y_pred.astype(np.float32))

                    # scatter sample saving (downsample to keep file small)
                    # keep at most 5000 points per chip
                    k = min(5000, len(y_true))
                    if k > 0:
                        idx = np.random.choice(len(y_true), size=k, replace=False)
                        scatter_rows.append(pd.DataFrame({
                            "chip_id": chip_id,
                            "y_true": y_true[idx],
                            "y_pred": y_pred[idx],
                        }))

                torch.cuda.synchronize()

    per_chip_df = pd.DataFrame(per_chip_rows)
    per_chip_csv = out_dir / "metrics_per_chip.csv"
    per_chip_df.to_csv(per_chip_csv, index=False)

    # scatter csv
    if len(scatter_rows) > 0:
        scatter_df = pd.concat(scatter_rows, ignore_index=True)
        scatter_csv = out_dir / "scatter_samples.csv"
        scatter_df.to_csv(scatter_csv, index=False)
    else:
        scatter_csv = None

    # summary (macro + micro)
    valid = per_chip_df[per_chip_df.get("error", "") == ""].copy()
    summary_lines = []
    summary_lines.append(f"Valid chips: {len(valid)} / {len(per_chip_df)}")

    if len(valid) > 0:
        # Macro = mean of chip metrics
        macro = {
            "rmse": float(valid["rmse"].mean()),
            "mae": float(valid["mae"].mean()),
            "bias": float(valid["bias"].mean()),
            "r2": float(valid["r2"].mean(skipna=True)),
            "pearson_r": float(valid["pearson_r"].mean(skipna=True)),
            "spearman_rho": float(valid["spearman_rho"].mean(skipna=True)),
        }

        # Micro = metrics over all pixels stacked
        y_true_all = np.concatenate(global_y_true, axis=0) if len(global_y_true) else np.array([], dtype=np.float32)
        y_pred_all = np.concatenate(global_y_pred, axis=0) if len(global_y_pred) else np.array([], dtype=np.float32)

        micro = _regression_metrics(y_true_all, y_pred_all) if len(y_true_all) else {}

        summary_lines.append("")
        summary_lines.append("MACRO (mean over chips):")
        summary_lines.append(f"  RMSE       : {macro['rmse']:.6f}")
        summary_lines.append(f"  MAE        : {macro['mae']:.6f}")
        summary_lines.append(f"  Bias       : {macro['bias']:.6f}   (pred - true)")
        summary_lines.append(f"  R^2        : {macro['r2']:.6f}")
        summary_lines.append(f"  Pearson r  : {macro['pearson_r']:.6f}")
        summary_lines.append(f"  Spearman p : {macro['spearman_rho']:.6f}")

        if micro:
            summary_lines.append("")
            summary_lines.append("MICRO (global over all pixels):")
            summary_lines.append(f"  N          : {micro['n']}")
            summary_lines.append(f"  RMSE       : {micro['rmse']:.6f}")
            summary_lines.append(f"  MAE        : {micro['mae']:.6f}")
            summary_lines.append(f"  Bias       : {micro['bias']:.6f}   (pred - true)")
            summary_lines.append(f"  R^2        : {micro['r2']:.6f}")
            summary_lines.append(f"  Pearson r  : {micro['pearson_r']:.6f}")
            summary_lines.append(f"  Spearman p : {micro['spearman_rho']:.6f}")

    summary_txt = out_dir / "metrics_summary.txt"
    summary_txt.write_text("\n".join(summary_lines), encoding="utf-8")

    print(f"[OK] Saved: {per_chip_csv}")
    if scatter_csv is not None:
        print(f"[OK] Saved: {scatter_csv}")
    print(f"[OK] Saved: {summary_txt}")


if __name__ == "__main__":
    main()