import random
import json
import math

island_id = 0
def generate_island():
    """
    Generates a random island with constraints:
    - 4 to 6 vertices
    - Minimum diameter of 5m (5000mm)
    - Maximum diameter of 50m (50000mm)
    - Maximum 50% variance between radii of the island
    """
    num_vertices = random.randint(4, 6)
    center_x = random.randint(0, 1_000_000)
    center_y = random.randint(0, 1_000_000)

    # Randomize the diameter within the allowed range
    diameter = random.randint(5_000, 50_000)

    # Calculate minimum and maximum radius based on 50% variance constraint
    min_radius = diameter / 2
    max_radius = min_radius * 1.5  # 50% more than the minimum

    vertices = []
    for _ in range(num_vertices):
        angle = random.uniform(0, 2 * math.pi)  # Random angle for vertex
        radius = random.uniform(min_radius, max_radius)  # Random radius within constrained range
        x = center_x + radius * math.cos(angle)
        x = max(0, min(x, 1_000_000))  # Clamping x within the map boundaries
        y = center_y + radius * math.sin(angle)
        y = max(0, min(y, 1_000_000))  # Clamping y within the map boundaries
        vertices.append((angle, [int(x), int(y)]))

    # Sort vertices by angle to avoid edge intersections
    vertices.sort(key=lambda v: v[0])
    sorted_vertices = [vertex[1] for vertex in vertices]

    object_vertices = []
    for vertex in sorted_vertices:
        object_vertices.append({"x": vertex[0], "y": vertex[1]})

    global island_id
    island = {
        "vertices": object_vertices,
        "ID": "island_"+str(island_id)
    }
    island_id += 1
    return island

# Generate the map with updated island generation function
map_data = {"islands": [generate_island() for _ in range(100)]}

# Convert the map data to JSON
json_map = json.dumps(map_data, indent=4)

# Write the map data to a file
with open("map.json", "w") as map_file:
    map_file.write(json_map)