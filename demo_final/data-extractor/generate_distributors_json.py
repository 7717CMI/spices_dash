#!/usr/bin/env python3
"""
Generate JSON file for Distributors Intelligence Database
Extracts data from Excel file with 3 modules (Standard, Advance, Premium)
Each module has different columns/coverage
"""

import json
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any

def get_module_field_mapping(module_name: str) -> Dict[int, str]:
    """
    Get field mapping based on module type
    Module 1 - Standard: Basic info (14 columns)
    Module 2 - Advance: + Product Portfolio (18 columns)
    Module 3 - Premium: + Brands, Channels, Coverage, Insights (33 columns)
    """
    
    # Base mapping for Module 1 - Standard
    base_mapping = {
        0: 's_no',
        1: 'company_name',
        2: 'year_established',
        3: 'headquarters_emirate',
        4: 'cities_regions_covered',
        5: 'ownership_type',
        6: 'business_type',
        7: 'no_of_employees',
        8: 'key_contact_person',
        9: 'designation_role',
        10: 'email_address',
        11: 'phone_whatsapp',
        12: 'linkedin_profile',
        13: 'website_url'
    }
    
    # Extended mapping for Module 2 - Advance
    advance_mapping = base_mapping.copy()
    advance_mapping.update({
        8: 'turnover_scale',
        9: 'key_contact_person',
        10: 'designation_role',
        11: 'email_address',
        12: 'phone_whatsapp',
        13: 'linkedin_profile',
        14: 'website_url',
        15: 'core_product_categories',
        16: 'specialty_focus',
        17: 'price_segment'
    })
    
    # Extended mapping for Module 3 - Premium
    premium_mapping = advance_mapping.copy()
    premium_mapping.update({
        18: 'key_brands_represented',
        19: 'exclusive_partnerships',
        20: 'duration_partnerships',
        21: 'retail_chains',
        22: 'pharmacies',
        23: 'spas_salons_clinics',
        24: 'ecommerce_platforms',
        25: 'channel_strength',
        26: 'distribution_type',
        27: 'emirates_served',
        28: 'regional_extensions',
        29: 'warehouse_logistics',
        30: 'delivery_storage',
        31: 'competitive_benchmarking',
        32: 'additional_comments'
    })
    
    if 'Standard' in module_name:
        return base_mapping
    elif 'Advance' in module_name:
        return advance_mapping
    elif 'Premium' in module_name:
        return premium_mapping
    else:
        return base_mapping

def extract_distributors_from_sheet(excel_path: str, sheet_name: str) -> List[Dict[str, Any]]:
    """
    Extract distributor data from a specific sheet
    
    Structure:
    - Row 4: Header row with "S.No.", "COMPANY INFORMATION", "CONTACT DETAILS"
    - Row 5: Column headers
    - Row 6+: Data rows
    """
    df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)
    
    # Find the header row (row 5 in Excel, index 4 in pandas)
    header_row_idx = 4
    data_start_idx = 5
    
    # Extract column headers from row 5 (index 4)
    headers = df.iloc[header_row_idx].tolist()
    
    # Get appropriate field mapping for this module
    field_mapping = get_module_field_mapping(sheet_name)
    
    distributors = []
    
    # Process data rows starting from row 6
    for idx in range(data_start_idx, len(df)):
        row = df.iloc[idx]
        
        # Skip empty rows
        if pd.isna(row.iloc[0]) or str(row.iloc[0]).strip() == '':
            continue
        
        # Extract data using field mapping
        distributor = {
            'id': f"{sheet_name.lower().replace(' ', '_')}_{int(row.iloc[0]) if pd.notna(row.iloc[0]) else idx}",
            'module': sheet_name,
            's_no': int(row.iloc[0]) if pd.notna(row.iloc[0]) and str(row.iloc[0]).isdigit() else None,
        }
        
        # Map all fields based on module type
        for col_idx, field_name in field_mapping.items():
            if col_idx > 0:  # Skip s_no as we already handled it
                value = row.iloc[col_idx] if col_idx < len(row) else None
                if pd.notna(value) and str(value).strip() != '':
                    # Keep the actual value, even if it's 'xx' (placeholder data)
                    distributor[field_name] = str(value).strip()
                else:
                    distributor[field_name] = None
        
        # Only add if we have at least a company name
        if distributor.get('company_name'):
            distributors.append(distributor)
    
    return distributors

def get_module_sections(module_name: str) -> Dict[str, List[str]]:
    """
    Get the sections and fields for each module
    """
    sections = {
        'company_information': [
            'company_name', 'year_established', 'headquarters_emirate',
            'cities_regions_covered', 'ownership_type', 'business_type',
            'no_of_employees'
        ],
        'contact_details': [
            'key_contact_person', 'designation_role', 'email_address',
            'phone_whatsapp', 'linkedin_profile', 'website_url'
        ]
    }
    
    if 'Advance' in module_name or 'Premium' in module_name:
        sections['company_information'].append('turnover_scale')
        sections['product_portfolio'] = [
            'core_product_categories', 'specialty_focus', 'price_segment'
        ]
    
    if 'Premium' in module_name:
        sections['brands_distributed'] = [
            'key_brands_represented', 'exclusive_partnerships', 'duration_partnerships'
        ]
        sections['distribution_channels'] = [
            'retail_chains', 'pharmacies', 'spas_salons_clinics',
            'ecommerce_platforms', 'channel_strength', 'distribution_type'
        ]
        sections['regional_operational_coverage'] = [
            'emirates_served', 'regional_extensions', 'warehouse_logistics',
            'delivery_storage'
        ]
        sections['cmi_insights'] = [
            'competitive_benchmarking', 'additional_comments'
        ]
    
    return sections

def generate_distributors_json(excel_path: str, output_path: str):
    """
    Generate JSON file from Excel with all 3 modules
    """
    print("\n=== GENERATING DISTRIBUTORS INTELLIGENCE JSON ===\n")
    
    modules = [
        'Module 1 - Standard',
        'Module 2 - Advance',
        'Module 3 - Premium'
    ]
    
    result = {
        'metadata': {
            'source_file': Path(excel_path).name,
            'modules': modules,
            'module_info': {
                'Module 1 - Standard': {
                    'sections': ['Company Information', 'Contact Details'],
                    'total_fields': 14
                },
                'Module 2 - Advance': {
                    'sections': ['Company Information', 'Contact Details', 'Product Portfolio'],
                    'total_fields': 18
                },
                'Module 3 - Premium': {
                    'sections': ['Company Information', 'Contact Details', 'Product Portfolio', 
                                'Brands Distributed', 'Distribution Channels', 
                                'Regional & Operational Coverage', 'CMI Insights'],
                    'total_fields': 33
                }
            },
            'generated_at': pd.Timestamp.now().isoformat()
        },
        'data': {},
        'sections': {}
    }
    
    total_distributors = 0
    
    for module in modules:
        print(f"[{module}] Extracting data...")
        try:
            distributors = extract_distributors_from_sheet(excel_path, module)
            result['data'][module] = distributors
            result['sections'][module] = get_module_sections(module)
            total_distributors += len(distributors)
            print(f"  [OK] Extracted {len(distributors)} distributors")
        except Exception as e:
            print(f"  [ERROR] Error extracting {module}: {str(e)}")
            result['data'][module] = []
            result['sections'][module] = {}
    
    # Save to JSON
    print(f"\n[SAVE] Writing to {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"[SUCCESS] Successfully generated JSON with {total_distributors} total distributors")
    print(f"  - Module 1 - Standard: {len(result['data'][modules[0]])} distributors (14 fields)")
    print(f"  - Module 2 - Advance: {len(result['data'][modules[1]])} distributors (18 fields)")
    print(f"  - Module 3 - Premium: {len(result['data'][modules[2]])} distributors (33 fields)")
    
    return result

if __name__ == '__main__':
    # Paths
    excel_path = Path(__file__).parent.parent / 'Distributors Intelligence Database.xlsx'
    output_path = Path(__file__).parent.parent / 'data' / 'distributors-intelligence.json'
    
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Generate JSON
    generate_distributors_json(str(excel_path), str(output_path))