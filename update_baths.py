import glob
import re

files = glob.glob(r"e:\web\Bongshaihousing\dv-*.html")

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Update floorData keys for bathrooms
    content = content.replace('"750x2": { bed: "4 Rooms", bath: "2 Rooms",', '"750x2": { bed: "4 Rooms", bath: "4 Rooms",')
    content = content.replace('"950x2": { bed: "6 Rooms", bath: "2 Rooms",', '"950x2": { bed: "6 Rooms", bath: "4 Rooms",')
    content = content.replace('"1200x2": { bed: "8 Rooms", bath: "3 Rooms",', '"1200x2": { bed: "8 Rooms", bath: "6 Rooms",')

    # The 650x2 is already bath: "2 Rooms" (which corresponds to 1 bath per floor * 2).

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Updated bathroom counts for duplex villas.")
