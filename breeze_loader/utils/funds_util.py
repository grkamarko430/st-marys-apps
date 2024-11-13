import streamlit as st
from thefuzz import fuzz


def get_all_funds(breeze_client):
    try:
        funds_list = breeze_client.list_funds()
        return funds_list
    except Exception as e:
        st.error(f'Error: {e}')


def check_funds(df_contribution_recs, breeze_client):
    with st.spinner(text='Checking Funds...'):
        df_check_funds = df_contribution_recs
        df_check_funds.loc[:,'Fund Exists'] = None
        funds_list = breeze_client.list_funds()
        for index, row in df_contribution_recs.iterrows():
            fund_name = get_fund_name(row['Fund'], breeze_client)
            for item in funds_list:
                # Check if the fund name is similar to the fund name in Breeze with a ratio of 80
                if fuzz.partial_ratio(fund_name, item['name']) >= 80:
                    df_check_funds.loc[index, 'Fund Exists'] = 'Y'
                    break
            else:
                df_check_funds.loc[index, 'Fund Exists'] = 'N'
    return df_check_funds


def get_fund_id(fund_name, breeze_client):
    try:
        funds_list = breeze_client.list_funds()
        for item in funds_list:
            # Check if the fund name is similar to the fund name in Breeze with a ratio of 80
            if fuzz.partial_ratio(fund_name, item['name']) >= 80:
                return item['id']
    except Exception as e:
        st.error(f'Error: {e}')


def get_fund_name(fund_name, breeze_client):
    try:
        funds_list = breeze_client.list_funds()
        for item in funds_list:
            # Check if the fund name is similar to the fund name in Breeze with a ratio of 80
            if fuzz.partial_ratio(fund_name, item['name']) >= 80:
                return item['name']
    except Exception as e:
        st.error(f'Error: {e}')


def get_all_fund_names(breeze_client):
    try:
        fund_names = []
        funds_list = breeze_client.list_funds()
        for item in funds_list:
            fund_names.append(item['name'])
        return fund_names
    except Exception as e:
        st.error(f'Error: {e}')
           