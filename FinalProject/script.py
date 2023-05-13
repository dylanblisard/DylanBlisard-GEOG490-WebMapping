import json

# Read the GeoJSON file
with open('Shipwrecks.geojson', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Iterate over the features and add the ID field
for index, feature in enumerate(data['features']):
    feature['id'] = index + 1

# Write the updated GeoJSON data to a new file
with open('updated_geojson_file.geojson', 'w') as f:
    json.dump(data, f)