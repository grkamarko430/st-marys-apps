import streamlit as st
from thefuzz import fuzz
from utils.api_util import connect_to_breeze


def get_funds():
    breeze_api = connect_to_breeze()
    return breeze_api.list_funds()


def check_funds(df_contribution_recs):
    with st.spinner(text='Checking Funds...'):
        df_check_funds = df_contribution_recs
        df_check_funds.loc[:,'Fund Exists'] = None
        funds_list = get_funds()
        for index, row in df_contribution_recs.iterrows():
            fund_name = get_fund_name(row['Fund'])
            for item in funds_list:
                # Check if the fund name is similar to the fund name in Breeze with a ratio of 80
                if fuzz.partial_ratio(fund_name, item['name']) >= 80:
                    df_check_funds.loc[index, 'Fund Exists'] = 'Y'
                    break
            else:
                df_check_funds.loc[index, 'Fund Exists'] = 'N'
    return df_check_funds


def get_fund_id(fund_name):
    try:
        funds_list = get_funds()
        for item in funds_list:
            # Check if the fund name is similar to the fund name in Breeze with a ratio of 80
            if fuzz.partial_ratio(fund_name, item['name']) >= 80:
                return item['id']
    except Exception as e:
        st.error(f'Error: {e}')


def get_fund_name(fund_name):
    try:
        funds_list = get_funds()
        for item in funds_list:
            # Check if the fund name is similar to the fund name in Breeze with a ratio of 80
            if fuzz.partial_ratio(fund_name, item['name']) >= 80:
                return item['name']
    except Exception as e:
        st.error(f'Error: {e}')


def get_all_fund_names():
    try:
        fund_names = []
        funds_list = get_funds()
        for item in funds_list:
            fund_names.append(item['name'])
        return fund_names
    except Exception as e:
        st.error(f'Error: {e}')
           