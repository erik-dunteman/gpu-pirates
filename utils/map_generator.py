import random
import json
import math

def generate_island():
    """
    Generates a random island with constraints:
    - 3 to 6 vertices
    - Minimum diameter of 5m (5000mm)
    - Maximum diameter of 50m (50000mm)
    """
    num_vertices = random.randint(3, 6)
    center_x = random.randint(0, 1000000)
    center_y = random.randint(0, 1000000)

    # Randomize the diameter within the allowed range
    diameter = random.randint(5000, 50000)

    vertices = []
    for _ in range(num_vertices):
        angle = random.uniform(0, 2 * math.pi)  # Random angle for vertex
        radius = random.uniform(diameter / 2, diameter)  # Random radius within the diameter
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        vertices.append((angle, [int(x), int(y)]))

    # Sort vertices by angle to avoid edge intersections
    vertices.sort(key=lambda v: v[0])
    sorted_vertices = [vertex[1] for vertex in vertices]

    return {"vertices": sorted_vertices}

# Generate the map
map_data = {"islands": [generate_island() for _ in range(100)]}

# Convert the map data to JSON
json_map = json.dumps(map_data, indent=4)

# Write the map data to a file
with open("map.json", "w") as f:
    f.write(json_map)