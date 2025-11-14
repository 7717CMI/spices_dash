#!/usr/bin/env python3
"""
Analyze India Spices Excel file to check if it can be converted to comparison-data.json format
"""

import pandas as pd
from pathlib import Path

def analyze_excel_structure(excel_path: str):
    """Analyze the Excel file structure"""
    print("=" * 70)
    print("ANALYZING INDIA SPICES EXCEL FILE")
    print("=" * 70)
    
    # Read Excel file
    excel_file = pd.ExcelFile(excel_path)
    
    print(f"\nExcel File: {Path(excel_path).name}")
    print(f"Sheets found: {excel_file.sheet_names}")
    
    # Analyze each sheet
    for sheet_name in excel_file.sheet_names:
        print(f"\n{'='*70}")
        print(f"SHEET: {sheet_name}")
        print(f"{'='*70}")
        
        df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)
        
        print(f"\nDimensions: {df.shape[0]} rows × {df.shape[1]} columns")
        
        # Show first 15 rows to understand structure
        print("\nFirst 15 rows (first 10 columns):")
        print("-" * 70)
        for i in range(min(15, len(df))):
            row_data = [str(x)[:30] if pd.notna(x) else 'NaN' for x in df.iloc[i, :10].tolist()]
            print(f"Row {i:2d}: {row_data}")
        
        # Look for potential headers
        print("\nLooking for header patterns...")
        for i in range(min(15, len(df))):
            row = df.iloc[i]
            # Check if row contains common header keywords
            row_str = ' '.join([str(x).lower() for x in row[:15] if pd.notna(x)])
            if any(keyword in row_str for keyword in ['geography', 'segment', 'year', 'value', 'volume', 'market', 'spice', 'product', 'category', 'region', 'state', 'city']):
                print(f"  Row {i:2d} might be headers: {[str(x)[:20] if pd.notna(x) else 'NaN' for x in df.iloc[i, :10].tolist()]}")
        
        # Check for year columns
        print("\nLooking for year columns...")
        year_columns = []
        for col_idx in range(min(30, df.shape[1])):
            col_data = df.iloc[:, col_idx]
            # Check if column contains year-like values
            year_like = []
            for val in col_data[:50]:
                if pd.notna(val):
                    val_str = str(val).strip()
                    # Check if it's a 4-digit year
                    if val_str.isdigit() and len(val_str) == 4:
                        year = int(val_str)
                        if 2000 <= year <= 2100:
                            year_like.append(year)
                    # Check if it's a year in date format
                    elif isinstance(val, (int, float)) and 2000 <= val <= 2100:
                        year_like.append(int(val))
            
            if len(year_like) >= 5:
                unique_years = sorted(set(year_like))
                year_columns.append((col_idx, unique_years[:10]))
                print(f"  Column {col_idx:2d} might contain years: {unique_years[:10]}")
        
        # Check for numeric data columns (potential value/volume)
        print("\nLooking for numeric data columns (potential value/volume)...")
        numeric_cols = []
        for col_idx in range(min(30, df.shape[1])):
            col_data = df.iloc[5:, col_idx]  # Skip first 5 rows (likely headers)
            numeric_count = 0
            for val in col_data[:50]:
                if pd.notna(val):
                    try:
                        float(val)
                        numeric_count += 1
                    except:
                        pass
            
            if numeric_count >= 10:
                numeric_cols.append(col_idx)
                sample_values = [str(x)[:10] for x in col_data[:5].dropna().tolist()[:3]]
                print(f"  Column {col_idx:2d} has numeric data: {sample_values}")
        
        # Try to identify geography and segment columns
        print("\nLooking for geography/segment columns...")
        for col_idx in range(min(10, df.shape[1])):
            col_data = df.iloc[5:20, col_idx]  # Check first 15 data rows
            unique_values = col_data.dropna().unique()[:10]
            if len(unique_values) > 0:
                sample = [str(x)[:25] for x in unique_values[:5]]
                print(f"  Column {col_idx:2d} sample values: {sample}")
    
    print("\n" + "=" * 70)
    print("ANALYSIS COMPLETE")
    print("=" * 70)

if __name__ == '__main__':
    excel_path = 'Copy of India Spices Market Value and Volume.xlsx'
    
    if Path(excel_path).exists():
        try:
            analyze_excel_structure(excel_path)
        except Exception as e:
            print(f"\nERROR: Error analyzing file: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"ERROR: File not found: {excel_path}")
        print(f"   Current directory: {Path.cwd()}")
        print(f"   Files in directory: {list(Path('.').glob('*.xlsx'))}")
