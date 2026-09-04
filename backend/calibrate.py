import cv2
import numpy as np
import glob

# checkerboard inner corners
CHECKERBOARD = (8,6)

# termination criteria
criteria = (cv2.TERM_CRITERIA_EPS +
            cv2.TERM_CRITERIA_MAX_ITER,
            30, 0.001)

# prepare object points
objp = np.zeros((CHECKERBOARD[0] *
                 CHECKERBOARD[1],3), np.float32)

objp[:,:2] = np.mgrid[0:CHECKERBOARD[0],
                      0:CHECKERBOARD[1]].T.reshape(-1,2)

# arrays
objpoints = []
imgpoints = []

# load images
images = glob.glob('calibration/*.jpeg')

print("Number of images found:", len(images))

for fname in images:

    img = cv2.imread(fname)

    if img is None:
        print("Cannot read:", fname)
        continue

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # find corners
    ret, corners = cv2.findChessboardCorners(
        gray,
        CHECKERBOARD,
        None
    )

    if ret:

        print("Corners found:", fname)

        objpoints.append(objp)

        corners2 = cv2.cornerSubPix(
            gray,
            corners,
            (11,11),
            (-1,-1),
            criteria
        )

        imgpoints.append(corners2)

        cv2.drawChessboardCorners(
            img,
            CHECKERBOARD,
            corners2,
            ret
        )

        cv2.imshow("Corners", img)
        cv2.waitKey(300)

    else:
        print("Corners NOT found:", fname)

cv2.destroyAllWindows()

# calibration
ret, cameraMatrix, dist, rvecs, tvecs = cv2.calibrateCamera(
    objpoints,
    imgpoints,
    gray.shape[::-1],
    None,
    None
)

print("\n==============================")
print("Camera Matrix:")
print(cameraMatrix)

print("\nDistortion Coefficients:")
print(dist)

# save calibration
np.savez("camera_calibration.npz",
         cameraMatrix=cameraMatrix,
         
         dist=dist,
         rvecs=rvecs,
         tvecs=tvecs)

print("\nCalibration saved to camera_calibration.npz")

