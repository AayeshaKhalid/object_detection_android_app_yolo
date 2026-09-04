import cv2
import numpy as np
import glob

# Load calibration
data = np.load("camera_calibration.npz")
cameraMatrix = data["cameraMatrix"]
dist = data["dist"]
rvecs = data["rvecs"]  # you need to save these during calibration
tvecs = data["tvecs"]

CHECKERBOARD = (8,6)
objp = np.zeros((CHECKERBOARD[0]*CHECKERBOARD[1],3), np.float32)
objp[:,:2] = np.mgrid[0:CHECKERBOARD[0],0:CHECKERBOARD[1]].T.reshape(-1,2)

objpoints = []
imgpoints = []

images = glob.glob('calibration/*.jpeg')

for fname in images:
    img = cv2.imread(fname)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    ret, corners = cv2.findChessboardCorners(gray, CHECKERBOARD, None)
    if ret:
        objpoints.append(objp)
        corners2 = cv2.cornerSubPix(gray, corners, (11,11), (-1,-1), 
                                    (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001))
        imgpoints.append(corners2)

# Calculate reprojection error correctly
total_error = 0
for i in range(len(objpoints)):
    imgpoints2, _ = cv2.projectPoints(objpoints[i], rvecs[i], tvecs[i], cameraMatrix, dist)
    error = cv2.norm(imgpoints[i], imgpoints2, cv2.NORM_L2)/len(imgpoints2)
    total_error += error

mean_error = total_error / len(objpoints)
print(f"Mean reprojection error: {mean_error:.4f} pixels")
