import urllib.request
import json

try:
    url = "https://bdapis.com/api/v1.2/district/dhaka"
    response = urllib.request.urlopen(url)
    data = json.loads(response.read().decode('utf-8'))
    print("Upazilas for Dhaka:", data['data'][0]['upazillas'])
except Exception as e:
    print("Error:", e)
