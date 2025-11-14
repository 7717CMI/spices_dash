import pandas as pd

df = pd.read_excel('Distributors Intelligence Database.xlsx', sheet_name='Module 1 - Standard')
print("Excel structure analysis:")
print("=" * 50)
for i in range(0, 10):
    print(f'Row {i}: {df.iloc[i, 0:5].tolist()}')
    
print("\n" + "=" * 50)
print("Looking for actual column headers...")
print("Row 4 (index 4):", df.iloc[4].tolist())
print("\nFirst data row (Row 5, index 5):", df.iloc[5].tolist())
print("\nSecond data row (Row 6, index 6):", df.iloc[6].tolist())
