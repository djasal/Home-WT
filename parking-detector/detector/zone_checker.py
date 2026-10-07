from shapely.geometry import Polygon, box

class ZoneChecker:
    def __init__(self, zones_data):
        """
        zones_data: List of dicts representing spaces, e.g. 
        [ {"id": "A1", "polygon": [[x,y],...]}, ... ]
        """
        self.zones = []
        for z in zones_data:
            poly = Polygon(z["polygon"])
            self.zones.append({
                "id": z["id"],
                "polygon": poly,
                "area": poly.area
            })

    def get_occupancy(self, car_boxes, overlap_threshold=0.40):
        """
        car_boxes: list of (x1, y1, x2, y2)
        Returns: list of occupied zone IDs
        """
        occupied_zones = set()
        
        # Convert car bounding boxes to Shapely polygons
        car_polys = [box(x1, y1, x2, y2) for (x1, y1, x2, y2) in car_boxes]
        
        for zone in self.zones:
            for car_poly in car_polys:
                # Check intersection
                if not zone["polygon"].intersects(car_poly):
                    continue
                
                intersection_area = zone["polygon"].intersection(car_poly).area
                
                # Calculate how much of the car is inside the zone, OR
                # how much of the zone is covered by the car.
                # Usually for parking, if a significant part of the car is in the zone, it's occupied.
                # We calculate overlap relative to the car's area (prevent big zones from ignoring small cars)
                # and relative to the zone's area.
                
                overlap_ratio = intersection_area / car_poly.area
                zone_coverage = intersection_area / zone["area"]
                
                if overlap_ratio >= overlap_threshold or zone_coverage >= overlap_threshold:
                    occupied_zones.add(zone["id"])
                    break # Move to next zone
                    
        return list(occupied_zones)
