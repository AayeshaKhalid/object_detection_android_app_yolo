import cv2
import numpy as np
import matplotlib.pyplot as plt
from ultralytics import YOLO

# =========================================================
# LOAD YOLO MODEL
# =========================================================
model = YOLO("yolo11x.pt")

# =========================================================
# LOAD CAMERA CALIBRATION
# =========================================================

data = np.load("camera_calibration.npz")

cameraMatrix = data["cameraMatrix"]
dist = data["dist"]

fx = cameraMatrix[0, 0]
fy = cameraMatrix[1, 1]
cx = cameraMatrix[0, 2]
cy = cameraMatrix[1, 2]

# =========================================================
# REAL OBJECT WIDTH (meters)
# IMPORTANT:
# Set according to your actual object width
# =========================================================

REAL_WIDTH = 0.05   # 5 cm

# =========================================================
# LOAD IMAGE
# =========================================================

img = cv2.imread("test.jpeg")

if img is None:
    print("Image not found")
    exit()

h, w = img.shape[:2]

# =========================================================
# UNDISTORT IMAGE
# =========================================================

newCameraMatrix, roi = cv2.getOptimalNewCameraMatrix(
    cameraMatrix,
    dist,
    (w, h),
    1,
    (w, h)
)

img = cv2.undistort(
    img,
    cameraMatrix,
    dist,
    None,
    newCameraMatrix
)

# Crop valid region
x_roi, y_roi, w_roi, h_roi = roi
img = img[y_roi:y_roi + h_roi, x_roi:x_roi + w_roi]

# =========================================================
# RUN YOLO DETECTION
# =========================================================

results = model(img)

# Convert for plotting
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

# =========================================================
# PROCESS DETECTIONS
# =========================================================

for box in results[0].boxes:

    # Bounding box coordinates
    x1, y1, x2, y2 = box.xyxy[0]

    x1 = int(x1)
    y1 = int(y1)
    x2 = int(x2)
    y2 = int(y2)

    # Width and height
    w_box = x2 - x1
    h_box = y2 - y1

    # Center point
    u = x1 + w_box / 2
    v = y1 + h_box / 2

    # =====================================================
    # OBJECT CLASS
    # =====================================================

    cls_id = int(box.cls[0])

    confidence = float(box.conf[0])

    object_name = model.names[cls_id]

    # =====================================================
    # DEPTH ESTIMATION
    # =====================================================

    pixel_width = w_box

    Z = (REAL_WIDTH * fx) / pixel_width

    X = (u - cx) * Z / fx
    Y = (v - cy) * Z / fy

    # =====================================================
    # PRINT RESULTS
    # =====================================================

    print("\n================================")
    print(f"Object : {object_name}")
    print(f"Confidence : {confidence:.2f}")

    print("\nObject Coordinates (Camera Frame)")
    print(f"X = {X:.3f} meters")
    print(f"Y = {Y:.3f} meters")
    print(f"Z = {Z:.3f} meters")

    # =====================================================
    # DRAW BOUNDING BOX
    # =====================================================

    cv2.rectangle(
        img_rgb,
        (x1, y1),
        (x2, y2),
        (0, 255, 0),
        2
    )

    # Draw center point
    cv2.circle(
        img_rgb,
        (int(u), int(v)),
        5,
        (255, 0, 0),
        -1
    )

    # Label text
    label = (
        f"{object_name} "
        f"Z:{Z:.2f}m"
    )

    cv2.putText(
        img_rgb,
        label,
        (x1, y1 - 10),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 0, 0),
        2
    )

# =========================================================
# DISPLAY RESULT
# =========================================================

plt.figure(figsize=(10, 8))

plt.imshow(img_rgb)

plt.title("YOLO Object Detection + XYZ Coordinates")

plt.axis("off")

plt.show()
