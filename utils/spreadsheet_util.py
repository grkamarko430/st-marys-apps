import pandas as pd
import io
import streamlit as st

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


def get_upload_file():
    st.subheader(body='Upload an .xlsx file',divider='blue') 
    uploaded_file = st.file_uploader("""Make sure your file is in the correct format by using the template in the sidebar.  
                                     """, type=['xlsx'],
                                     help="""Ex.)
                                            \nDate | Contributor Name | Amount | Fund | Method
                                           \n2023-01-01 | John Doe | 100.00 | General Fund | Cemetery""")

    # Check if a file has been uploaded
    if uploaded_file is not None:

        try:
            # Convert the uploaded file into a Pandas DataFrame
            df = pd.read_excel(uploaded_file)
            st.write('Original Data:')
            st.dataframe(data=df, use_container_width=True)
            contr_data = df
            # Split the Contributor Name into First and Last Name
            contr_data['Contributor Name'] = contr_data['Contributor Name'].astype(str)
            contr_data['First_Name'] = contr_data['Contributor Name'].str.split().str[0]
            contr_data['Last_Name'] = contr_data['Contributor Name'].str.split().str[1]
            return contr_data
        except Exception as e:
            st.error(f'Error: {e}')
    return None


def merge_spreasheet(df_uploaded_file, df_ppl_matched):
    merged_df = df_uploaded_file.merge(df_ppl_matched,how='left',left_on='Contributor Name',right_on='Contributor Name')
    
    merged_df['Manually Enter'] = merged_df.apply(lambda row: 'Y' if pd.isna(row['id']) else 'N', axis=1)
    merged_df['Date'] = pd.to_datetime(merged_df['Date']).dt.strftime('%Y-%m-%d')
    merged_df['Amount'] = merged_df['Amount'].astype(float).round(2)
    merged_df['Amount'] = merged_df['Amount'].map('{:.2f}'.format)

    return merged_df
