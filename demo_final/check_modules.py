import pandas as pd

# Check all three modules
modules = ['Module 1 - Standard', 'Module 2 - Advance', 'Module 3 - Premium']

for module in modules:
    df = pd.read_excel('Distributors Intelligence Database.xlsx', sheet_name=module)
    print(f"\n{'='*60}")
    print(f"{module}")
    print('='*60)
    
    # Get column headers from row 4 (index 4)
    cols = df.iloc[4].tolist()
    print(f"Total columns: {len(cols)}")
    print("\nColumn headers:")
    for i, col in enumerate(cols):
        if pd.notna(col):
            print(f"  {i}: {col}")
