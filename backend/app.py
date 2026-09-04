from flask import Flask, request, jsonify
from ultralytics import YOLO
import cv2
import numpy as np
import os
import uuid
import base64
from PIL import Image as PILImage, ImageOps  # ✅ ADDED for EXIF rotation fix

app = Flask(__name__)

model = YOLO("yolo11x.pt")

data = np.load("camera_calibration.npz")
cameraMatrix = data["cameraMatrix"]
dist = data["dist"]
fx = cameraMatrix[0, 0]
fy = cameraMatrix[1, 1]
cx = cameraMatrix[0, 2]
cy = cameraMatrix[1, 2]

REAL_WIDTH = 0.05
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/detect", methods=["POST"])
def detect():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4().hex}{ext}")
    file.save(path)

    # ✅ Use PIL to auto-fix EXIF rotation from phone camera
    # This replaces the old undistort block which was causing black areas
    pil_img = PILImage.open(path)
    pil_img = ImageOps.exif_transpose(pil_img)  # fixes portrait/landscape rotation
    img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    os.remove(path)

    if img is None or img.size == 0:
        return jsonify({"error": "Could not read image"}), 400

    # ✅ conf=0.25 ensures lower confidence objects are also detected
    results = model(img, conf=0.25)
    detections = []

    for box in results[0].boxes:
        x1, y1, x2, y2 = box.xyxy[0]
        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)

        w_box = x2 - x1
        h_box = y2 - y1
        u = x1 + w_box / 2
        v = y1 + h_box / 2

        cls_id = int(box.cls[0])
        confidence = float(box.conf[0])
        object_name = model.names[cls_id]

        # XYZ calculation — same as find_xyz.py
        Z = (REAL_WIDTH * fx) / w_box
        X = (u - cx) * Z / fx
        Y = (v - cy) * Z / fy

        # =====================================================
        # DRAW BOUNDING BOX ON IMAGE
        # =====================================================
        # Green rectangle
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)

        # Blue center dot
        cv2.circle(img, (int(u), int(v)), 6, (255, 0, 0), -1)

        # Label background for readability
        label = f"{object_name} Z:{Z:.2f}m"
        (lw, lh), baseline = cv2.getTextSize(
            label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2
        )
        cv2.rectangle(
            img,
            (x1, y1 - lh - baseline - 8),
            (x1 + lw, y1),
            (0, 255, 0),
            -1  # filled background
        )
        cv2.putText(
            img, label,
            (x1, y1 - 6),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6, (0, 0, 0), 2  # black text on green bg
        )

        detections.append({
            "object": object_name,
            "confidence": round(confidence, 2),
            "X": round(float(X), 3),
            "Y": round(float(Y), 3),
            "Z": round(float(Z), 3),
        })

    # =========================================================
    # ENCODE ANNOTATED IMAGE TO BASE64
    # =========================================================
    _, buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    img_base64 = base64.b64encode(buffer).decode("utf-8")

    return jsonify({
        "detections": detections,
        "image": img_base64
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
