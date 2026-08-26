import os
import threading
import time
import uuid
from typing import Any, Dict, List, Tuple

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

from backend.app.config import settings


class ComputerVisionStudioService:
    """High-resolution product cutout and catalog-studio compositor."""

    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self._segmentation_session = None
        self._session_lock = threading.Lock()
        os.makedirs(self.upload_dir, exist_ok=True)

    def enhance_product_image(self, input_image_path: str) -> Dict[str, Any]:
        start_time = time.time()
        source = self._load_and_normalize(input_image_path)
        source_rgb = np.asarray(source)
        alpha, engine, mask_quality = self._segment_product(source)
        enhanced_rgb = self._enhance_product_color(source_rgb, alpha)
        foreground = np.dstack((enhanced_rgb, alpha)).astype(np.uint8)
        studio_canvas = self._composite_studio_scene(foreground)

        output_filename = f"{uuid.uuid4().hex[:8]}_studio_enhanced.png"
        output_filepath = self.upload_dir / output_filename
        studio_canvas.save(output_filepath, format="PNG", optimize=True)

        enhanced_bgr = cv2.cvtColor(enhanced_rgb, cv2.COLOR_RGB2BGR)
        return {
            "original_image_url": f"/uploads/{os.path.basename(input_image_path)}",
            "enhanced_image_url": f"/uploads/{output_filename}",
            "detected_objects": self._classify_visual_features(enhanced_bgr),
            "dominant_colors": self._extract_dominant_palette(enhanced_bgr, alpha),
            "processing_time_seconds": round(time.time() - start_time, 2),
            "confidence_score": round(0.91 + (mask_quality * 0.08), 3),
            "segmentation_engine": engine,
            "mask_quality_score": round(mask_quality, 3),
        }

    def warmup(self) -> None:
        """Load model weights outside the first artisan request."""
        try:
            from rembg import new_session

            with self._session_lock:
                if self._segmentation_session is None:
                    self._segmentation_session = new_session(settings.IMAGE_SEGMENTATION_MODEL)
        except Exception:
            # A later request can retry; GrabCut remains available meanwhile.
            return

    @staticmethod
    def _load_and_normalize(input_image_path: str) -> Image.Image:
        try:
            with Image.open(input_image_path) as candidate:
                candidate.verify()
            with Image.open(input_image_path) as candidate:
                image = ImageOps.exif_transpose(candidate).convert("RGB")
                if max(image.size) > 2400:
                    image.thumbnail((2400, 2400), Image.Resampling.LANCZOS)
                return image.copy()
        except Exception as exc:
            raise ValueError("The uploaded file is not a valid readable image.") from exc

    @staticmethod
    def _enhance_product_color(source_rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
        """Improve lighting without changing the product's authentic colour."""
        bgr = cv2.cvtColor(source_rgb, cv2.COLOR_RGB2BGR)
        lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
        lightness, channel_a, channel_b = cv2.split(lab)
        clip_limit = 1.45 if float(np.std(lightness)) > 55 else 1.9
        lightness = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8)).apply(lightness)
        balanced = cv2.cvtColor(cv2.merge((lightness, channel_a, channel_b)), cv2.COLOR_LAB2BGR)
        balanced = cv2.bilateralFilter(balanced, 5, 22, 22)
        hsv = cv2.cvtColor(balanced, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.04, 0, 255)
        balanced = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
        result = cv2.cvtColor(balanced, cv2.COLOR_BGR2RGB).astype(np.float32)
        foreground = alpha >= 128
        if np.any(foreground):
            luma = (0.2126 * result[:, :, 0] + 0.7152 * result[:, :, 1] + 0.0722 * result[:, :, 2])
            median_luma = float(np.median(luma[foreground]))
            exposure = float(np.clip(145.0 / max(median_luma, 1.0), 0.92, 1.28))
            result[foreground] = np.clip(result[foreground] * exposure, 0, 255)
        return result.astype(np.uint8)

    def _segment_product(self, source: Image.Image) -> Tuple[np.ndarray, str, float]:
        try:
            from rembg import new_session, remove

            with self._session_lock:
                if self._segmentation_session is None:
                    self._segmentation_session = new_session(settings.IMAGE_SEGMENTATION_MODEL)
            mask_image = remove(
                source,
                session=self._segmentation_session,
                only_mask=True,
                post_process_mask=False,
            )
            raw_mask = np.asarray(mask_image.convert("L"), dtype=np.uint8)
            refined = self._refine_neural_mask(raw_mask)
            quality, valid = self._score_mask(refined)
            if valid:
                return refined, settings.IMAGE_SEGMENTATION_MODEL, quality
        except Exception:
            # The app remains useful offline or before model weights finish downloading.
            pass

        fallback = self._grabcut_fallback(np.asarray(source))
        quality, _ = self._score_mask(fallback)
        return fallback, "grabcut-fallback", min(quality, 0.72)

    @staticmethod
    def _refine_neural_mask(raw_mask: np.ndarray) -> np.ndarray:
        """Remove stray text/dust while retaining the model's soft high-resolution edge."""
        raw_mask = cv2.bilateralFilter(raw_mask, 5, 18, 18)
        binary = (raw_mask >= 96).astype(np.uint8)
        coordinates = np.column_stack(np.nonzero(binary))
        slender = False
        if len(coordinates) > 20:
            eigenvalues = np.linalg.eigvalsh(np.cov(coordinates, rowvar=False))
            slender = float(np.sqrt(eigenvalues[-1] / max(eigenvalues[0], 1e-6))) > 3.6
        kernel_size = 9 if slender else 3
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

        count, labels, stats, _ = cv2.connectedComponentsWithStats(binary, 8)
        if count <= 1:
            return raw_mask
        areas = stats[1:, cv2.CC_STAT_AREA]
        largest = int(areas.max())
        minimum = max(36, int(largest * 0.018))
        keep = np.zeros_like(binary)
        for label, area in enumerate(areas, start=1):
            if int(area) >= minimum:
                keep[labels == label] = 1

        support_size = 3 if slender else 5
        support = cv2.dilate(keep, np.ones((support_size, support_size), np.uint8), iterations=1)
        refined = np.where(support > 0, raw_mask, 0).astype(np.uint8)
        refined[keep > 0] = np.maximum(refined[keep > 0], 210)
        refined[refined < 18] = 0
        return cv2.GaussianBlur(refined, (3, 3), 0)

    @staticmethod
    def _grabcut_fallback(source_rgb: np.ndarray) -> np.ndarray:
        bgr = cv2.cvtColor(source_rgb, cv2.COLOR_RGB2BGR)
        height, width = bgr.shape[:2]
        mask = np.zeros((height, width), np.uint8)
        bg_model = np.zeros((1, 65), np.float64)
        fg_model = np.zeros((1, 65), np.float64)
        margin_x, margin_y = max(1, width // 20), max(1, height // 20)
        rect = (margin_x, margin_y, max(1, width - 2 * margin_x), max(1, height - 2 * margin_y))
        try:
            cv2.grabCut(bgr, mask, rect, bg_model, fg_model, 7, cv2.GC_INIT_WITH_RECT)
            binary = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
        except cv2.error:
            gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        return cv2.GaussianBlur(binary, (5, 5), 0)

    @staticmethod
    def _score_mask(alpha: np.ndarray) -> Tuple[float, bool]:
        foreground = alpha >= 96
        area = int(foreground.sum())
        total = foreground.size
        occupancy = area / max(total, 1)
        border = np.concatenate((foreground[0], foreground[-1], foreground[:, 0], foreground[:, -1]))
        border_ratio = float(border.mean())
        valid = 0.0025 <= occupancy <= 0.92 and border_ratio < 0.62
        occupancy_score = min(1.0, occupancy / 0.04) if occupancy < 0.04 else min(1.0, (0.92 - occupancy) / 0.20)
        quality = float(np.clip(0.78 + 0.14 * occupancy_score + 0.08 * (1 - border_ratio), 0, 1))
        return quality, valid

    @staticmethod
    def _composite_studio_scene(foreground_rgba: np.ndarray) -> Image.Image:
        alpha = foreground_rgba[:, :, 3]
        points = cv2.findNonZero((alpha > 18).astype(np.uint8))
        if points is None:
            raise ValueError("No foreground product was detected in the photo.")
        x, y, width, height = cv2.boundingRect(points)
        pad = max(8, int(max(width, height) * 0.035))
        x0, y0 = max(0, x - pad), max(0, y - pad)
        x1 = min(foreground_rgba.shape[1], x + width + pad)
        y1 = min(foreground_rgba.shape[0], y + height + pad)
        product = Image.fromarray(foreground_rgba[y0:y1, x0:x1], mode="RGBA")

        canvas_size = 1200
        target = int(canvas_size * 0.76)
        scale = min(target / product.width, target / product.height, 2.25)
        product = product.resize(
            (max(1, int(product.width * scale)), max(1, int(product.height * scale))),
            Image.Resampling.LANCZOS,
        )

        yy, xx = np.mgrid[0:canvas_size, 0:canvas_size]
        radial = np.sqrt(((xx - canvas_size / 2) / canvas_size) ** 2 + ((yy - canvas_size * 0.46) / canvas_size) ** 2)
        tone = np.clip(253 - radial * 14 + (yy / canvas_size) * 3, 238, 253).astype(np.uint8)
        backdrop = np.dstack((tone, tone, np.minimum(255, tone + 2), np.full_like(tone, 255)))
        canvas = Image.fromarray(backdrop, mode="RGBA")

        position = ((canvas_size - product.width) // 2, (canvas_size - product.height) // 2 - 18)
        alpha_channel = product.getchannel("A")
        shadow = Image.new("RGBA", product.size, (20, 27, 38, 0))
        shadow.putalpha(alpha_channel.point(lambda value: int(value * 0.24)))
        shadow = shadow.filter(ImageFilter.GaussianBlur(max(10, int(canvas_size * 0.014))))
        canvas.alpha_composite(shadow, (position[0] + 14, position[1] + 24))
        canvas.alpha_composite(product, position)

        final = ImageEnhance.Sharpness(canvas.convert("RGB")).enhance(1.08)
        return ImageEnhance.Contrast(final).enhance(1.015)

    @staticmethod
    def _extract_dominant_palette(img_bgr: np.ndarray, alpha: np.ndarray) -> List[str]:
        pixels = img_bgr[alpha >= 128]
        if len(pixels) < 16:
            pixels = img_bgr.reshape(-1, 3)
        if len(pixels) > 12000:
            step = max(1, len(pixels) // 12000)
            pixels = pixels[::step]
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 0.5)
        _, _, centers = cv2.kmeans(pixels.astype(np.float32), 3, None, criteria, 5, cv2.KMEANS_PP_CENTERS)
        return [f"#{int(r):02X}{int(g):02X}{int(b):02X}" for b, g, r in centers]

    @staticmethod
    def _classify_visual_features(img_bgr: np.ndarray) -> List[str]:
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        edge_density = float(np.mean(cv2.Canny(gray, 80, 180) > 0))
        features = ["Handcrafted Artisan Product"]
        features.append("Intricate Weave / Carving Detail" if edge_density > 0.075 else "Smooth / Polished Surface")
        return features


image_service = ComputerVisionStudioService()
