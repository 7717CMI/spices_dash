#!/usr/bin/env python3
"""
Convert India Spices Excel to comparison-data.json format
"""

import json
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any, Set
from collections import defaultdict

def extract_metadata(excel_path: str) -> Dict[str, Any]:
    """Extract metadata from Parameters sheet"""
    df = pd.read_excel(excel_path, sheet_name='Parameters', header=None)
    
    metadata = {}
    for idx, row in df.iterrows():
        key = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else None
        value = row.iloc[1] if len(row) > 1 and pd.notna(row.iloc[1]) else None
        
        if key and value:
            if 'Report Title' in key:
                metadata['market_name'] = str(value).strip()
            elif 'Market Type' in key:
                metadata['market_type'] = str(value).strip()
            elif 'Industry Type' in key:
                metadata['industry'] = str(value).strip()
            elif 'Value Currency' in key:
                metadata['currency'] = str(value).strip()
            elif 'Value Unit' in key:
                metadata['value_unit'] = str(value).strip()
            elif 'Volume Unit' in key:
                metadata['volume_unit'] = str(value).strip()
            elif 'Value' in key and 'Currency' not in key:
                metadata['has_value'] = str(value).strip().lower() == 'yes'
            elif 'Volume' in key and 'Unit' not in key:
                metadata['has_volume'] = str(value).strip().lower() == 'yes'
    
    # Set defaults
    metadata.setdefault('market_name', 'India Spices Market')
    metadata.setdefault('market_type', 'Country')
    metadata.setdefault('industry', 'CMFE')
    metadata.setdefault('currency', 'INR')
    metadata.setdefault('value_unit', 'Cr.')
    metadata.setdefault('volume_unit', 'Kilo Tons')
    metadata.setdefault('has_value', True)
    metadata.setdefault('has_volume', True)
    
    return metadata

def extract_geography_hierarchy(excel_path: str) -> Dict[str, Any]:
    """Extract geography hierarchy from Region sheet
    
    The Region sheet has a matrix structure where:
    - Row 0: Headers (India, North India, South India, East India, West India)
    - Each subsequent row has states in columns that correspond to their actual region
    - The column header indicates which region the state belongs to
    """
    df = pd.read_excel(excel_path, sheet_name='Region', header=None)
    
    # Build hierarchy
    global_geo = ['India']
    regions = []
    countries = defaultdict(list)
    all_geographies = set(global_geo)
    
    # First row contains region headers
    if len(df) > 0:
        first_row = df.iloc[0]
        regions = [str(x).strip() for x in first_row[1:] if pd.notna(x) and str(x).strip() != 'India']
        all_geographies.update(regions)
    
    # Process each data row - states are placed in columns matching their actual region
    for idx in range(1, len(df)):
        row = df.iloc[idx]
        # Skip the row label (column 0) - we use column headers instead
        for col_idx in range(1, len(row)):
            val = row.iloc[col_idx]
            if pd.notna(val):
                val_str = str(val).strip()
                if val_str and val_str != '':
                    # Get the region from the column header
                    if col_idx < len(first_row):
                        region = str(first_row.iloc[col_idx]).strip() if pd.notna(first_row.iloc[col_idx]) else None
                        if region and region in regions:
                            # Add this state to the correct region
                            if val_str not in countries[region]:
                                countries[region].append(val_str)
                            all_geographies.add(val_str)
    
    return {
        'global': global_geo,
        'regions': regions,
        'countries': dict(countries),
        'all_geographies': sorted(list(all_geographies))
    }

def extract_segment_hierarchy(excel_path: str) -> Dict[str, Dict[str, Any]]:
    """Extract segment hierarchy from Segmentation sheet"""
    df = pd.read_excel(excel_path, sheet_name='Segmentation', header=None)
    
    segments = {}
    
    # First row contains segment type names
    if len(df) > 0:
        segment_types = [str(x).strip() for x in df.iloc[0, 1:] if pd.notna(x)]
        
        for seg_type_idx, seg_type in enumerate(segment_types):
            if not seg_type or seg_type == 'Segmentation':
                continue
            
            col_idx = seg_type_idx + 1
            items = []
            hierarchy = {}
            
            # Extract items from this column
            for row_idx in range(1, len(df)):
                cell_value = df.iloc[row_idx, col_idx]
                if pd.notna(cell_value):
                    item = str(cell_value).strip()
                    if item and not item.startswith('Segmentation'):
                        # Remove leading > symbols (hierarchy indicators)
                        clean_item = item.lstrip('>').strip()
                        if clean_item:
                            items.append(clean_item)
                            
                            # Build hierarchy based on > symbols
                            level = item.count('>')
                            if level > 0:
                                # Find parent
                                parent = None
                                for prev_idx in range(row_idx - 1, -1, -1):
                                    prev_value = df.iloc[prev_idx, col_idx]
                                    if pd.notna(prev_value):
                                        prev_item = str(prev_value).strip()
                                        prev_level = prev_item.count('>')
                                        if prev_level < level:
                                            parent = prev_item.lstrip('>').strip()
                                            break
                                
                                if parent:
                                    if parent not in hierarchy:
                                        hierarchy[parent] = []
                                    hierarchy[parent].append(clean_item)
            
            # Determine if hierarchical
            is_hierarchical = len(hierarchy) > 0
            
            segments[seg_type] = {
                'type': 'hierarchical' if is_hierarchical else 'flat',
                'items': list(set(items)),
                'hierarchy': hierarchy
            }
    
    return segments

def extract_data_records(excel_path: str, sheet_name: str, metadata: Dict, geographies: Dict = None) -> List[Dict[str, Any]]:
    """Extract data records from Master Sheet"""
    df = pd.read_excel(excel_path, sheet_name=sheet_name, header=0)
    
    records = []
    
    # Get year columns (columns that are numeric years)
    year_columns = []
    for col in df.columns:
        try:
            year = int(col)
            if 2000 <= year <= 2100:
                year_columns.append(year)
        except:
            pass
    
    year_columns = sorted(year_columns)
    
    # Process each row
    for idx, row in df.iterrows():
        geography = str(row['Geography']).strip() if pd.notna(row.get('Geography')) else None
        if not geography:
            continue
        
        # Extract segment information
        segment_type = str(row['1st level Segment']).strip() if pd.notna(row.get('1st level Segment')) else None
        level_2 = str(row['2nd level Segment']).strip() if pd.notna(row.get('2nd level Segment')) else None
        level_3 = str(row['3rd level Segment']).strip() if pd.notna(row.get('3rd level Segment')) else None
        level_4 = str(row['4th level Segment']).strip() if pd.notna(row.get('4th level Segment')) else None
        
        # Determine segment (use the most specific level)
        segment = level_4 or level_3 or level_2 or segment_type
        
        # Determine segment level
        segment_level = 'parent' if (level_3 or level_4) else 'leaf'
        
        # Build segment hierarchy
        segment_hierarchy = {
            'level_1': segment_type or '',
            'level_2': level_2 or '',
            'level_3': level_3 or '',
            'level_4': level_4 or ''
        }
        
        # Extract time series
        time_series = {}
        for year in year_columns:
            year_str = str(year)
            value = row.get(year_str) or row.get(year)
            if pd.notna(value):
                try:
                    time_series[year] = float(value)
                except:
                    time_series[year] = 0.0
            else:
                time_series[year] = 0.0
        
        # Calculate CAGR (from first to last year)
        cagr = 0.0
        if len(year_columns) >= 2 and time_series:
            first_year = min(year_columns)
            last_year = max(year_columns)
            first_value = time_series.get(first_year, 0)
            last_value = time_series.get(last_year, 0)
            
            if first_value > 0 and last_value > 0:
                years = last_year - first_year
                if years > 0:
                    cagr = ((last_value / first_value) ** (1.0 / years) - 1) * 100
        
        # Determine geography level and parent based on hierarchy
        geography_level = 'country'
        parent_geography = None
        
        if geographies:
            # Check if it's the global geography
            if geography in geographies.get('global', []):
                geography_level = 'global'
                parent_geography = None
            # Check if it's a region
            elif geography in geographies.get('regions', []):
                geography_level = 'region'
                parent_geography = geographies.get('global', ['India'])[0] if geographies.get('global') else None
            # Check if it's a country/state (in countries mapping)
            else:
                for region, countries_list in geographies.get('countries', {}).items():
                    if geography in countries_list:
                        geography_level = 'country'
                        parent_geography = region
                        break
        
        record = {
            'geography': geography,
            'geography_level': geography_level,
            'parent_geography': parent_geography,
            'segment_type': segment_type or '',
            'segment': segment,
            'segment_level': segment_level,
            'segment_hierarchy': segment_hierarchy,
            'time_series': time_series,
            'cagr': round(cagr, 2),
            'market_share': 0.0  # Will be calculated later
        }
        
        records.append(record)
    
    # Calculate market share for base year (2024)
    base_year = metadata.get('base_year', 2024)
    if base_year in year_columns:
        year_total = sum(r['time_series'].get(base_year, 0) for r in records)
        if year_total > 0:
            for record in records:
                year_value = record['time_series'].get(base_year, 0)
                record['market_share'] = (year_value / year_total)
    
    return records

def calculate_market_share(records: List[Dict], year: int) -> None:
    """Calculate market share for a specific year"""
    year_total = sum(r['time_series'].get(year, 0) for r in records)
    if year_total > 0:
        for record in records:
            year_value = record['time_series'].get(year, 0)
            record['market_share'] = (year_value / year_total) * 100

def convert_india_spices_to_json(excel_path: str, output_path: str):
    """Main conversion function"""
    print("=" * 70)
    print("CONVERTING INDIA SPICES EXCEL TO JSON")
    print("=" * 70)
    
    # Extract metadata
    print("\n[1/5] Extracting metadata...")
    metadata = extract_metadata(excel_path)
    print(f"  Market: {metadata['market_name']}")
    print(f"  Currency: {metadata['currency']} {metadata['value_unit']}")
    print(f"  Volume Unit: {metadata['volume_unit']}")
    
    # Extract geography hierarchy
    print("\n[2/5] Extracting geography hierarchy...")
    geographies = extract_geography_hierarchy(excel_path)
    print(f"  Global: {len(geographies['global'])}")
    print(f"  Regions: {len(geographies['regions'])}")
    print(f"  Countries/States: {sum(len(v) for v in geographies['countries'].values())}")
    
    # Extract segment hierarchy
    print("\n[3/5] Extracting segment hierarchy...")
    segments = extract_segment_hierarchy(excel_path)
    print(f"  Segment Types: {len(segments)}")
    for seg_type, seg_data in segments.items():
        print(f"    - {seg_type}: {len(seg_data['items'])} items ({seg_data['type']})")
    
    # Extract value data
    print("\n[4/6] Extracting value data...")
    value_records = extract_data_records(excel_path, 'Master Sheet-Value', metadata, geographies)
    print(f"  Value Records: {len(value_records)}")
    
    # Extract volume data
    print("\n[5/6] Extracting volume data...")
    volume_records = extract_data_records(excel_path, 'Master Sheet-Volume', metadata, geographies)
    print(f"  Volume Records: {len(volume_records)}")
    
    # Get years from records
    all_years = set()
    for record in value_records:
        all_years.update(record['time_series'].keys())
    years = sorted(all_years)
    
    # Determine start, base, and forecast years
    start_year = min(years) if years else 2020
    base_year = 2024 if 2024 in years else max([y for y in years if y <= 2024], default=start_year)
    forecast_year = max(years) if years else 2032
    
    historical_years = [y for y in years if y <= base_year]
    forecast_years = [y for y in years if y > base_year]
    
    # Build final JSON structure
    result = {
        'metadata': {
            **metadata,
            'years': years,
            'start_year': start_year,
            'base_year': base_year,
            'forecast_year': forecast_year,
            'historical_years': historical_years,
            'forecast_years': forecast_years
        },
        'dimensions': {
            'geographies': geographies,
            'segments': segments
        },
        'data': {
            'value': {
                'geography_segment_matrix': value_records
            },
            'volume': {
                'geography_segment_matrix': volume_records
            }
        }
    }
    
    # Save to JSON
    print(f"\n[Saving] Writing to {output_path}...")
    output_path_obj = Path(output_path)
    output_path_obj.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"[SUCCESS] Successfully converted to {output_path}")
    print(f"  - Total records: {len(value_records)} value, {len(volume_records)} volume")
    print(f"  - Years: {start_year} to {forecast_year} ({len(years)} years)")
    print(f"  - Geographies: {len(geographies['all_geographies'])}")
    print(f"  - Segment types: {len(segments)}")
    
    return result

if __name__ == '__main__':
    excel_path = 'new_final.xlsx'
    output_path = 'data/india-spices-comparison-data.json'
    
    if Path(excel_path).exists():
        try:
            convert_india_spices_to_json(excel_path, output_path)
        except Exception as e:
            print(f"\nERROR: Error converting file: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"ERROR: File not found: {excel_path}")

