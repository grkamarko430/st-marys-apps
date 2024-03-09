import os
from dotenv import load_dotenv
from utils.api_util import connect_to_breeze
from utils.funds_util import check_funds, get_all_fund_names
from utils.load_contr_util import load_contributions
from utils.ppl_util import get_people, match_people
import streamlit as st
import streamlit_authenticator as stauth
import pandas as pd
import yaml
from yaml.loader import SafeLoader
from streamlit_authenticator import Authenticate


def get_upload_file():
    st.subheader(body='Upload an .xlsx file',divider='blue') 
    uploaded_file = st.file_uploader("""Please make sure the file uses the correct format, i.e.  
                                     Date | Beneficiary Name | Amount | Fund | Method""", type=['xlsx'])
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
            contr_data = df
            # Split the Beneficiary Name into First and Last Name
            contr_data['Beneficiary Name'] = contr_data['Beneficiary Name'].astype(str)
            contr_data['First_Name'] = contr_data['Beneficiary Name'].str.split().str[0]
            contr_data['Last_Name'] = contr_data['Beneficiary Name'].str.split().str[1]
            return contr_data
        except Exception as e:
            st.error(f'Error: {e}')
    return None

def merge_spreasheet(df_uploaded_file, df_ppl_matched):
    if df_ppl_matched:
        merged_df = df_uploaded_file.merge(df_ppl_matched,how='left',left_on='Beneficiary Name',right_on='Beneficiary Name')
        # Set the 'Manually Enter' column to 'Y' if the ID is null, otherwise 'N'
        merged_df['Manually Enter'] = merged_df.apply(lambda row: 'Y' if pd.isna(row['id']) else 'N', axis=1)
        #merged_df = merged_df.drop(columns=['first_name','last_name','force_first_name','path'])
        merged_df = merged_df.drop(columns=['force_first_name','path'])
        merged_df['Date'] = pd.to_datetime(merged_df['Date']).dt.strftime('%Y-%m-%d')
        merged_df['Amount'] = merged_df['Amount'].astype(float).round(2)
        merged_df['Amount'] = merged_df['Amount'].map('{:.2f}'.format)
        #st.write('Merged Data:')
        #st.dataframe(data=merged_df.loc[(merged_df['Manually Enter'] == 'N')], use_container_width=True)
        return merged_df
    else:
        st.error("No records matched. Please check the Beneficiary Names in the spreadsheet and try again.")
        st.stop()

def main():
    # 0. Login Authentication
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
            #st.write('People in Breeze:')
            #st.dataframe(data=people, use_container_width=True)

            # 2. Get spreadheet of contributions to be loaded
            df_uploaded_file = get_upload_file()
            
            print(df_uploaded_file)

            # 3. Lookup people from uploaded file in Breeze
            st.subheader(body='Match Parishioners',divider='blue')
            df_ppl_matched = match_people(df_uploaded_file, people)
            print(df_ppl_matched)
        
            # 4. Merge the matched people from the spreadsheet back into the master spreadsheet
            if df_uploaded_file is None:
                print("Please upload your file.")
                return
            merged_df = merge_spreasheet(df_uploaded_file, df_ppl_matched)
            print(merged_df)

            # 5. Perform check to make sure that all funds on spreasheet exist in Breeze
            st.subheader(body='Check Funds',divider='blue')
            df_auto_contr_recs = merged_df.loc[(merged_df['Manually Enter'] == 'N')]
            df_manual_contr_recs = merged_df.loc[(merged_df['Manually Enter'] == 'Y')]
            df_check_funds = check_funds(df_auto_contr_recs)
            #st.write(df_check_funds)
            if df_check_funds['Fund Exists'].str.contains('N').any():
                st.error("ERROR: The following funds do not exist in Breeze. Please manually change the names in the 'Fund' column to match those in Breeze and re-upload the spreadsheet.")
                st.table(df_check_funds.loc[(df_check_funds['Fund Exists'] == 'N')])
                st.write("Available funds in Breeze:")
                st.write(get_all_fund_names())
                funds_exist = False
            else:
                st.success("All funds in the spreadsheet exist in Breeze")
                funds_exist = True
            # If funds_exist is False, stop the execution of the rest of the code
            if not funds_exist:
                st.stop()

            # 6. Load the contributions into Breeze
            print(df_auto_contr_recs)
            st.subheader(body='Load Contributions',divider='grey')
            st.warning("Please review the contributions to be loaded. If you need to manually enter or change any contribution details, please do so in the spreadsheet file and re-upload.")
            st.write("Contributions to be loaded:")
            st.write(df_auto_contr_recs)

            if 'load_contributions' not in st.session_state:
                st.session_state.load_contributions = False
            if st.button("Load Contributions"):
                st.session_state.load_contributions = True
            if df_auto_contr_recs is not None and st.session_state.load_contributions:
                with st.spinner("Loading contributions..."):
                    df_payment_id = load_contributions(breeze_api, df_auto_contr_recs)

                # 7. Display the results
                st.success("Contributions loaded successfully")
                st.subheader(body='Results',divider='blue')
                st.info("Contribution records loaded successfully:")
                st.write(df_payment_id)
                st.info("Unmatched contribution records that require manual entry:", icon="❗️")
                st.caption(":red[Action Required!]")
                st.write(df_manual_contr_recs)

                merged_df.to_excel("/tmp/merged_df.xlsx", index=False)
                with open("/tmp/merged_df.xlsx", "rb") as f:
                    all_contr_data = f.read()
                st.download_button(
                    label="Download All Contributions Spreadsheet",
                    data=all_contr_data,
                    file_name='all_contributions.xlsx',
                    mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                df_manual_contr_recs.to_excel("/tmp/df_manual_contr_recs.xlsx", index=False)
                with open("/tmp/df_manual_contr_recs.xlsx", "rb") as f:
                    unmatched_contr_data = f.read()
                st.download_button(
                    label="Download Unmatched Contributions Spreadsheet",
                    data=unmatched_contr_data,
                    file_name='unmatched_contributions.xlsx',
                    mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                st.caption("To load more contributions, please click the button below twice and select another file at the top of the page.")

                if st.button('Clear session state'):
                    keys = list(st.session_state.keys())
                    for key in keys:
                        if key != 'authentication_status':
                            del st.session_state[key]

    elif st.session_state["authentication_status"] == False:
        st.error('Username/password is incorrect')
    elif st.session_state["authentication_status"] == None:
        st.warning('Please enter your username and password')

# Run the main function
if __name__ == '__main__':
    main()