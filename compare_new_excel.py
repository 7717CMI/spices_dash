#!/usr/bin/env python3
"""
Compare new_final.xlsx structure with current india-spices-comparison-data.json
"""

import json
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any, Set

def analyze_new_excel(excel_path: str):
    """Analyze the new Excel file structure"""
    print("=" * 70)
    print("ANALYZING new_final.xlsx")
    print("=" * 70)
    
    excel_file = pd.ExcelFile(excel_path)
    print(f"\nSheets found: {excel_file.sheet_names}")
    
    excel_structure = {
        'sheets': {},
        'metadata': {},
        'geographies': set(),
        'segments': {},
        'years': set(),
        'data_structure': {}
    }
    
    # Analyze each sheet
    for sheet_name in excel_file.sheet_names:
        print(f"\n{'='*70}")
        print(f"Analyzing sheet: {sheet_name}")
        print(f"{'='*70}")
        
        df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)
        print(f"Dimensions: {df.shape[0]} rows × {df.shape[1]} columns")
        
        excel_structure['sheets'][sheet_name] = {
            'rows': df.shape[0],
            'columns': df.shape[1],
            'first_rows': df.head(10).values.tolist()
        }
        
        # Check for Parameters sheet (metadata)
        if 'parameter' in sheet_name.lower() or 'meta' in sheet_name.lower():
            print("\n[Metadata Sheet Detected]")
            for i in range(min(20, len(df))):
                row = df.iloc[i]
                if len(row) >= 2:
                    key = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else None
                    value = row.iloc[1] if pd.notna(row.iloc[1]) else None
                    if key and value:
                        excel_structure['metadata'][key] = str(value).strip()
                        print(f"  {key}: {value}")
        
        # Check for Region/Geography sheet
        if 'region' in sheet_name.lower() or 'geography' in sheet_name.lower():
            print("\n[Geography Sheet Detected]")
            for i in range(min(20, len(df))):
                row = df.iloc[i]
                for val in row:
                    if pd.notna(val):
                        val_str = str(val).strip()
                        if val_str and val_str not in ['', 'NaN', 'None']:
                            excel_structure['geographies'].add(val_str)
            print(f"  Found {len(excel_structure['geographies'])} geography values")
        
        # Check for Segmentation sheet
        if 'segment' in sheet_name.lower():
            print("\n[Segmentation Sheet Detected]")
            # Similar analysis as geography
        
        # Check for Master Sheet (data)
        if 'master' in sheet_name.lower() or 'value' in sheet_name.lower() or 'volume' in sheet_name.lower():
            print("\n[Data Sheet Detected]")
            # Try to find header row
            header_row = None
            for i in range(min(10, len(df))):
                row_str = ' '.join([str(x).lower() for x in df.iloc[i, :10] if pd.notna(x)])
                if 'geography' in row_str and ('segment' in row_str or 'year' in row_str):
                    header_row = i
                    print(f"  Potential header row: {i}")
                    print(f"  Headers: {df.iloc[i, :15].tolist()}")
                    break
            
            # Find year columns
            if header_row is not None:
                headers = df.iloc[header_row].tolist()
                year_cols = []
                for idx, header in enumerate(headers):
                    if pd.notna(header):
                        try:
                            year = int(header)
                            if 2000 <= year <= 2100:
                                year_cols.append(year)
                                excel_structure['years'].add(year)
                        except:
                            pass
                print(f"  Year columns found: {sorted(year_cols)}")
                
                # Sample data rows
                print(f"\n  Sample data rows (first 3):")
                for i in range(header_row + 1, min(header_row + 4, len(df))):
                    row = df.iloc[i]
                    print(f"    Row {i}: Geography={row.iloc[0] if len(row) > 0 else 'N/A'}, "
                          f"Segment={row.iloc[1] if len(row) > 1 else 'N/A'}")
    
    return excel_structure

def analyze_current_json(json_path: str):
    """Analyze the current JSON structure"""
    print("\n" + "=" * 70)
    print("ANALYZING CURRENT JSON STRUCTURE")
    print("=" * 70)
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    json_structure = {
        'metadata': data.get('metadata', {}),
        'geographies': {
            'global': data.get('dimensions', {}).get('geographies', {}).get('global', []),
            'regions': data.get('dimensions', {}).get('geographies', {}).get('regions', []),
            'countries': data.get('dimensions', {}).get('geographies', {}).get('countries', {}),
            'all': data.get('dimensions', {}).get('geographies', {}).get('all_geographies', [])
        },
        'segments': data.get('dimensions', {}).get('segments', {}),
        'years': data.get('metadata', {}).get('years', []),
        'record_count': {
            'value': len(data.get('data', {}).get('value', {}).get('geography_segment_matrix', [])),
            'volume': len(data.get('data', {}).get('volume', {}).get('geography_segment_matrix', []))
        }
    }
    
    print(f"\nMetadata:")
    print(f"  Market: {json_structure['metadata'].get('market_name')}")
    print(f"  Currency: {json_structure['metadata'].get('currency')} {json_structure['metadata'].get('value_unit')}")
    print(f"  Years: {json_structure['years']}")
    
    print(f"\nGeographies:")
    print(f"  Global: {json_structure['geographies']['global']}")
    print(f"  Regions: {len(json_structure['geographies']['regions'])} - {json_structure['geographies']['regions']}")
    print(f"  Total geographies: {len(json_structure['geographies']['all'])}")
    
    print(f"\nSegments:")
    for seg_type, seg_data in json_structure['segments'].items():
        print(f"  {seg_type}: {len(seg_data.get('items', []))} items ({seg_data.get('type', 'unknown')})")
    
    print(f"\nData Records:")
    print(f"  Value: {json_structure['record_count']['value']}")
    print(f"  Volume: {json_structure['record_count']['volume']}")
    
    return json_structure

def compare_structures(excel_struct: Dict, json_struct: Dict):
    """Compare the two structures and identify differences"""
    print("\n" + "=" * 70)
    print("COMPARISON RESULTS")
    print("=" * 70)
    
    differences = []
    
    # Compare metadata
    print("\n[1] METADATA COMPARISON:")
    excel_meta = excel_struct.get('metadata', {})
    json_meta = json_struct.get('metadata', {})
    
    if excel_meta:
        for key in ['market_name', 'currency', 'value_unit', 'volume_unit']:
            excel_val = excel_meta.get(key, 'NOT FOUND')
            json_val = json_meta.get(key, 'NOT FOUND')
            if excel_val != json_val and excel_val != 'NOT FOUND':
                print(f"  [WARNING] {key}: Excel='{excel_val}' vs JSON='{json_val}'")
                differences.append(f"Metadata {key} differs")
    else:
        print("  [WARNING] No metadata found in Excel (check Parameters sheet)")
        differences.append("Metadata sheet not found or different structure")
    
    # Compare years
    print("\n[2] YEARS COMPARISON:")
    excel_years = sorted(excel_struct.get('years', set()))
    json_years = sorted(json_struct.get('years', []))
    
    if excel_years:
        if set(excel_years) != set(json_years):
            print(f"  [WARNING] Years differ:")
            print(f"      Excel: {excel_years}")
            print(f"      JSON:  {json_years}")
            differences.append("Year ranges differ")
        else:
            print(f"  [OK] Years match: {excel_years}")
    else:
        print("  [WARNING] Could not detect years in Excel")
        differences.append("Years not detected in Excel")
    
    # Compare geographies
    print("\n[3] GEOGRAPHIES COMPARISON:")
    excel_geos = excel_struct.get('geographies', set())
    json_geos = set(json_struct.get('geographies', {}).get('all', []))
    
    if excel_geos:
        missing_in_excel = json_geos - excel_geos
        extra_in_excel = excel_geos - json_geos
        
        if missing_in_excel:
            print(f"  [WARNING] Geographies in JSON but not in Excel: {list(missing_in_excel)[:10]}")
            differences.append(f"{len(missing_in_excel)} geographies missing in Excel")
        
        if extra_in_excel:
            print(f"  [WARNING] Geographies in Excel but not in JSON: {list(extra_in_excel)[:10]}")
            differences.append(f"{len(extra_in_excel)} new geographies in Excel")
        
        if not missing_in_excel and not extra_in_excel:
            print(f"  [OK] Geographies match ({len(excel_geos)} total)")
    else:
        print("  [WARNING] Could not detect geographies in Excel")
        differences.append("Geographies not detected in Excel")
    
    # Compare segments
    print("\n[4] SEGMENTS COMPARISON:")
    json_segments = json_struct.get('segments', {})
    print(f"  JSON has {len(json_segments)} segment types:")
    for seg_type in json_segments.keys():
        print(f"    - {seg_type}")
    
    # Check sheet structure
    print("\n[5] SHEET STRUCTURE:")
    excel_sheets = excel_struct.get('sheets', {})
    expected_sheets = ['Parameters', 'Region', 'Segmentation', 'Master Sheet-Value', 'Master Sheet-Volume']
    
    found_sheets = []
    for expected in expected_sheets:
        found = any(expected.lower() in s.lower() for s in excel_sheets.keys())
        if found:
            print(f"  [OK] Found sheet matching '{expected}'")
            found_sheets.append(expected)
        else:
            print(f"  [WARNING] Sheet '{expected}' not found")
            differences.append(f"Missing sheet: {expected}")
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    if differences:
        print(f"\n[WARNING] Found {len(differences)} potential issues:")
        for i, diff in enumerate(differences, 1):
            print(f"  {i}. {diff}")
        print("\n[ACTION REQUIRED] The Excel file structure may differ from current JSON.")
        print("   You may need to update the conversion script to handle these differences.")
    else:
        print("\n[OK] No major structural differences detected!")
        print("   The Excel file appears compatible with the current JSON format.")
    
    return differences

if __name__ == '__main__':
    excel_path = 'new_final.xlsx'
    json_path = 'data/india-spices-comparison-data.json'
    
    if not Path(excel_path).exists():
        print(f"ERROR: File not found: {excel_path}")
        exit(1)
    
    if not Path(json_path).exists():
        print(f"ERROR: File not found: {json_path}")
        exit(1)
    
    try:
        excel_struct = analyze_new_excel(excel_path)
        json_struct = analyze_current_json(json_path)
        differences = compare_structures(excel_struct, json_struct)
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()

