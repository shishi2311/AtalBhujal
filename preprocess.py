import pandas as pd
import os

RAW_CSV = "Atal_Bhujal_Groundwater_Data.csv"
OUTPUT_FILE = "data/atalbhujal_water_levels.csv"

# Load CSV
df = pd.read_csv(RAW_CSV, encoding="latin1")
df.columns = df.columns.str.strip()

# Keep only relevant columns
df = df[['State_Name_With_LGD_Code', 'District_Name_With_LGD_Code', 'Block_Name_With_LGD_Code'] +
        [col for col in df.columns if 'Pre-monsoon' in col or 'Post-monsoon' in col]]

# Melt water level columns
df_melt = df.melt(id_vars=['State_Name_With_LGD_Code', 'District_Name_With_LGD_Code', 'Block_Name_With_LGD_Code'],
                  var_name='month_year', value_name='water_level_m_bgl')

# Extract 'season' and 'year' from column names
df_melt['season'] = df_melt['month_year'].apply(lambda x: 'Pre-monsoon' if 'Pre-monsoon' in x else 'Post-monsoon')
df_melt['year'] = df_melt['month_year'].str.extract('(\d{4})')
df_melt = df_melt.drop(columns=['month_year'])

# Rename columns
df_melt = df_melt.rename(columns={
    'State_Name_With_LGD_Code': 'state',
    'District_Name_With_LGD_Code': 'district',
    'Block_Name_With_LGD_Code': 'block'
})

# Remove rows with missing water levels
df_melt = df_melt.dropna(subset=['water_level_m_bgl'])

# Create data folder if not exists
if not os.path.exists("data"):
    os.makedirs("data")

# Save cleaned CSV
df_melt.to_csv(OUTPUT_FILE, index=False)

print(f"✅ Clean CSV saved to {OUTPUT_FILE}")
print("📊 Preview:\n", df_melt.head())
