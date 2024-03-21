from funds import get_funds
import streamlit as st
from breeze_chms_api import breeze
from thefuzz import fuzz

def check_funds(df_contribution_recs):
    df_check_funds = df_contribution_recs
    df_check_funds.loc[:,'Fund Exists'] = None
    for index, row in df_contribution_recs.iterrows():
        fund_name = get_fund_name(row['Fund'])
        for item in get_funds():
            if fuzz.partial_ratio(fund_name, item['name']) >= 80:
            #if fund_name in item['name']:
                df_check_funds.loc[index, 'Fund Exists'] = 'Y'
                break
        else:
            df_check_funds.loc[index, 'Fund Exists'] = 'N'
    return df_check_funds


def get_fund_id(fund_name):
    try:
        for item in get_funds():
            if fuzz.partial_ratio(fund_name, item['name']) >= 80:
                return item['id']
    except Exception as e:
        st.error(f'Error: {e}')

def get_fund_name(fund_name):
    try:
        for item in get_funds():
            if fuzz.partial_ratio(fund_name, item['name']) >= 80:
                return item['name']
    except Exception as e:
        st.error(f'Error: {e}')

def get_all_fund_names():
    try:
        fund_names = []
        for item in get_funds():
            fund_names.append(item['name'])
        return fund_names
    except Exception as e:
        st.error(f'Error: {e}')
           