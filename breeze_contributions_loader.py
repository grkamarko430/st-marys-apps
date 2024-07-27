from utils.api_util import connect_to_breeze
from utils.funds_util import check_funds, get_all_fund_names
from utils.load_contr_util import load_contributions
from utils.ppl_util import get_people, match_people
from utils.spreadsheet_util import generate_template, get_upload_file, merge_spreasheet
import streamlit as st
import streamlit_authenticator as stauth
import yaml
from yaml.loader import SafeLoader
from streamlit_authenticator import Authenticate


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
        tab1, tab2 = st.tabs(["Contribution Loader", "Documentation"])
        with tab1:
            st.title('Breeze Automated Contribution Loader')
            st.write("""This tool loads contributions from an MS Excel (.xlsx) spreadhseet into Breeze by searching on the 
                    Contributor Name and matching it with the Breeze database. 
                    If a match is found, the contribution is loaded automatically. 
                    If no match is found, the contribution is flagged for manual entry.""")


            # Get the list of all people in the Breeze database and display it in the sidebar
            people = get_people(breeze_api)
            print(people)

            # Generate the template and display it in the sidebar
            template = generate_template()
            if template is not None:
                st.sidebar.subheader('Contribution Loader Template')
                st.sidebar.download_button(label='Download',
                                           file_name='contribution_loader_template.xlsx',
                                           data=template,
                                           mime='application/vnd.ms-excel')
            else:
                pass

            # Display the list of people in the sidebar
            st.sidebar.subheader('Breeze Parishioner Directory')
            st.sidebar.dataframe(data=get_people(breeze_api), use_container_width=True)

            # Get spreadheet of contributions to be loaded
            df_uploaded_file = get_upload_file()
            
            print(df_uploaded_file)

            # Lookup people from uploaded file in Breeze
            df_ppl_matched = match_people(df_uploaded_file, people)
            print(df_ppl_matched)
        
            # Merge the matched people from the spreadsheet back into the master spreadsheet
            if df_uploaded_file is None:
                st.caption("Please upload your file...")
                return
            
            if df_ppl_matched is not None and not df_ppl_matched.empty and df_uploaded_file is not None and not df_uploaded_file.empty:
                merged_df = merge_spreasheet(df_uploaded_file, df_ppl_matched)
                print(merged_df)
            else:
                st.error("No records matched. Please check the Contributor Names in the spreadsheet and try again.")
                st.stop()

            # Perform check to make sure that all funds on spreasheet exist in Breeze
            st.subheader(body='Check Funds',divider='blue')
            df_auto_contr_recs = merged_df.loc[(merged_df['Manually Enter'] == 'N')]
            df_manual_contr_recs = merged_df.loc[(merged_df['Manually Enter'] == 'Y')]
            df_check_funds = check_funds(df_auto_contr_recs)
            #st.write(df_check_funds)
            if df_check_funds['Fund Exists'].str.contains('N').any():
                st.error("ERROR: The following funds do not exist in Breeze. Please manually change the names in the 'Fund' column to match those in Breeze and re-upload the spreadsheet.")
                st.table(df_check_funds.loc[(df_check_funds['Fund Exists'] == 'N')].iloc[:, :5])
                st.write("Available funds in Breeze:")
                st.write(get_all_fund_names())
                funds_exist = False
            else:
                st.success("All funds in the spreadsheet exist in Breeze")
                funds_exist = True
            # If funds_exist is False, stop the execution of the rest of the code
            if not funds_exist:
                st.stop()

            # Load the contributions into Breeze
            print(df_auto_contr_recs)
            st.subheader(body='Load Contributions',divider='grey')
            st.warning("Please review the contributions to be loaded. If you need to manually enter or change any contribution details, please do so in the spreadsheet file and re-upload.")
            st.write(f"Contributions to be loaded: {df_auto_contr_recs.count()[0]}")
            st.write(df_auto_contr_recs.drop(columns=['First_Name','Last_Name']))

            if 'load_contributions' not in st.session_state:
                st.session_state.load_contributions = False
            if st.button("Load Contributions"):
                st.session_state.load_contributions = True
            if df_auto_contr_recs is not None and st.session_state.load_contributions:
                with st.spinner("Loading contributions..."):
                    df_payment_id = load_contributions(breeze_api, df_auto_contr_recs)
                # Reset the flag after loading the contributions
                st.session_state.load_contributions = False

                # Display the results
                st.success("Contributions loaded successfully")
                st.subheader(body='Results',divider='blue')
                st.info("Contribution records loaded successfully:")
                st.write(df_payment_id)
                st.info("Unmatched contribution records that require manual entry:", icon="❗️")
                st.caption(":red[Action Required!]")
                st.write(df_manual_contr_recs)

                # Download the results
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
                st.caption("To load more contributions, simply upload another Excel spreadsheet file.")

    # Authentication notifications
    elif st.session_state["authentication_status"] == False:
        st.error('Username/password is incorrect')
    elif st.session_state["authentication_status"] == None:
        st.warning('Please enter your username and password')

# Run the main function
if __name__ == '__main__':
    main()