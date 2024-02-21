import os
from dotenv import load_dotenv
from api_client import connect_to_breeze
from load_contributions import load_contributions
import streamlit as st
import streamlit_authenticator as stauth
import pandas as pd
import yaml
from yaml.loader import SafeLoader
from streamlit_authenticator import Authenticate

def get_people(breeze_api):
    # Get List of all Breeze Users   
    people = breeze_api.list_people()
    df_ppl = pd.DataFrame(people)
    return df_ppl

def get_upload_file():
    st.header(body='Upload an .xlsx file',divider=True) 
    uploaded_file = st.file_uploader("Upload a .xlsx file", type=['xlsx'])
    # Check if a file has been uploaded
    # Check if a file has been uploaded
    if uploaded_file is not None:
        # Display some details about the uploaded file
        # st.write('File Details:')
        # file_details = {'Filename': uploaded_file.name, 'FileType': uploaded_file.type, 'FileSize': uploaded_file.size}
        # st.write(file_details)
        try:
            # Convert the uploaded file into a Pandas DataFrame
            df = pd.read_excel(uploaded_file)
            st.write('Original Data:')
            st.dataframe(data=df, use_container_width=True)
            ACH_data = df
            # Split the Beneficiary Name into First and Last Name
            ACH_data['Beneficiary Name'] = ACH_data['Beneficiary Name'].astype(str)
            ACH_data['First_Name'] = ACH_data['Beneficiary Name'].str.split().str[0]
            ACH_data['Last_Name'] = ACH_data['Beneficiary Name'].str.split().str[1]
            return ACH_data
        except Exception as e:
            st.error(f'Error: {e}')
    return None

def match_people(df_uploaded_file, people):
    results_df = pd.DataFrame()
    if df_uploaded_file is not None:
        for index, row in df_uploaded_file.iterrows():
            # Match the first and last name of people from the spreadhsheet with the Breeze database
            lookup_result = people.loc[(people['first_name'] == row['First_Name']) &
                                    (people['last_name'] == row['Last_Name'])]
            # add the ID number to the lookup result (if any)
            if not lookup_result.empty:
                lookup_result.loc[:, 'id'] = lookup_result['id']
                results_df = pd.concat([results_df, lookup_result])
        results_df = results_df.drop_duplicates()
        if not results_df.empty:
            st.write('Matched Parishioners:  Found ' + str(results_df['id'].count()) + ' matches out of ' + str(df_uploaded_file['First_Name'].count()) + ' records')
            #st.dataframe(data=results_df.drop(columns=['path','force_first_name']), use_container_width=True)
            print("Found matches:")
            print(results_df)
            return results_df
        else:
            print("No matches found")
            return None

def merge_spreasheet(df_uploaded_file, df_ppl_matched):
    merged_df = df_uploaded_file.merge(df_ppl_matched,how='left',left_on=['First_Name','Last_Name'],right_on=['first_name','last_name'])
    # Set the 'Manually Enter' column to 'Y' if the ID is null, otherwise 'N'
    merged_df['Manually Enter'] = merged_df.apply(lambda row: 'Y' if pd.isna(row['id']) else 'N', axis=1)
    merged_df = merged_df.drop(columns=['first_name','last_name','force_first_name','path'])
    merged_df['Date'] = pd.to_datetime(merged_df['Date']).dt.strftime('%Y-%m-%d')
    merged_df['Amount'] = merged_df['Amount'].astype(float).round(2)
    merged_df['Amount'] = merged_df['Amount'].map('{:.2f}'.format)
    #st.write('Merged Data:')
    st.dataframe(data=merged_df.loc[(merged_df['Manually Enter'] == 'N')], use_container_width=True)
    return merged_df

def main():
    hashed_passwords = stauth.Hasher(['abc', 'def']).generate()

    with open('config.yaml') as file:
        config = yaml.load(file, Loader=SafeLoader)

    authenticator = Authenticate(
        config['credentials'],
        config['cookie']['name'],
        config['cookie']['key'],
        config['cookie']['expiry_days'],
        config['preauthorized'])
    
    name, authentication_status, username = authenticator.login('main')

    if st.session_state["authentication_status"]:
        authenticator.logout('Logout','main')

        breeze_api = connect_to_breeze()
        tab1, tab2 = st.tabs(["ACH Loader", "tab 2"])
        with tab1:
            st.title('Breeze Automated ACH Contribution Loader')
            st.write("""The ACH Loader loads contributions from an spreadhseet into Breeze by searching on the 
                    Beneficiary Name and matching it with the Breeze database. 
                    If a match is found, the contribution is loaded automatically. 
                    If no match is found, the contribution is flagged for manual entry.""")
            # 1. Get the list of all people in the Breeze database
            people = get_people(breeze_api)
            print(people)

            # 2. Get spreadheet of contributions to be loaded
            df_uploaded_file = get_upload_file()
            print(df_uploaded_file)

            # 3. Lookup people from uploaded file in Breeze
            df_ppl_matched = match_people(df_uploaded_file, people)
            print(df_ppl_matched)
        
            # 4. Merge the matched people from the spreadsheet back into the master spreadsheet
            if df_uploaded_file is None:
                print("Please upload your file.")
                return
            merged_df = merge_spreasheet(df_uploaded_file, df_ppl_matched)
            print(merged_df)

            # # 5. Get the list of all funds in the Breeze database
            # df_breeze_funds = funds.get_funds()
            # print(df_breeze_funds)

            # 5. Load the contributions into Breeze
            df_auto_contr_recs = merged_df.loc[(merged_df['Manually Enter'] == 'N')]
            print(df_auto_contr_recs)
            st.warning("Please review the contributions to be loaded. If you need to manually enter any contributions, please do so in the spreadsheet and re-upload.")
            if df_auto_contr_recs is not None and st.button("Load Contributions"):
                with st.spinner("loading contributions"):
                    df_payment_id = load_contributions(breeze_api, df_auto_contr_recs)
                print(df_payment_id)
                st.write(df_payment_id)
                st.success("Contributions loaded successfully")

    elif st.session_state["authentication_status"] == False:
        st.error('Username/password is incorrect')
    elif st.session_state["authentication_status"] == None:
        st.warning('Please enter your username and password')




    # breeze_api = connect_to_breeze()
    # st.title('Breeze Automated Contribution Loader - ACH')
    # tab1, tab2 = st.tabs(["ACH Loader", "tab 2"])
    # with tab1:
    #     st.write("""The ACH Loader loads contributions from an spreadhseet into Breeze by searching on the 
    #              Beneficiary Name and matching it with the Breeze database. 
    #              If a match is found, the contribution is loaded automatically. 
    #              If no match is found, the contribution is flagged for manual entry.""")
    #     # 1. Get the list of all people in the Breeze database
    #     people = get_people(breeze_api)
    #     print(people)

    #     # 2. Get spreadheet of contributions to be loaded
    #     df_uploaded_file = get_upload_file()
    #     print(df_uploaded_file)

    #     # 3. Lookup people from uploaded file in Breeze
    #     df_ppl_matched = match_people(df_uploaded_file, people)
    #     print(df_ppl_matched)
    
    #     # 4. Merge the matched people from the spreadsheet back into the master spreadsheet
    #     if df_uploaded_file is None:
    #         print("Please upload your file.")
    #         return
    #     merged_df = merge_spreasheet(df_uploaded_file, df_ppl_matched)
    #     print(merged_df)

    #     # # 5. Get the list of all funds in the Breeze database
    #     # df_breeze_funds = funds.get_funds()
    #     # print(df_breeze_funds)

    #     # 5. Load the contributions into Breeze
    #     df_auto_contr_recs = merged_df.loc[(merged_df['Manually Enter'] == 'N')]
    #     print(df_auto_contr_recs)
    #     st.warning("Please review the contributions to be loaded. If you need to manually enter any contributions, please do so in the spreadsheet and re-upload.")
    #     if df_auto_contr_recs is not None and st.button("Load Contributions"):
    #         with st.spinner("loading contributions"):
    #             df_payment_id = load_contributions(breeze_api, df_auto_contr_recs)
    #         print(df_payment_id)
    #         st.write(df_payment_id)
    #         st.success("Contributions loaded successfully")



    

        # # Process the uploaded file
        # df_processed = process_file(uploaded_file)

        # # Display the processed DataFrame
        # if df_processed is not None:
        #     st.write('Processed Data:')
        #     st.write(df_processed)

# Run the main function
if __name__ == '__main__':
    main()