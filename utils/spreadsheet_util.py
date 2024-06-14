import pandas as pd
import io

def generate_template():
    # Create a DataFrame (replace this with your actual data)
    data = {
        'Date': ['2023-01-01'],
        'Contributor Name': ['John Doe'],
        'Amount': [100.00],
        'Fund': ['Cemetery'],
        'Method': ['Direct Deposit']
    }
    df = pd.DataFrame(data)

    # Write the DataFrame to an Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='Sheet1', index=False)

    # Return the Excel file's contents as a binary object
    return output.getvalue()