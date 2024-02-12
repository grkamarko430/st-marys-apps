from funds import get_funds
import streamlit as st
from breeze_chms_api import breeze



def get_fund_id(fund_name):
    try:
        for item in get_funds():
            if fund_name in item['name']:
                return item['id']
    except Exception as e:
        st.error(f'Error: {e}')

def get_fund_name(fund_name):
    try:
        for item in get_funds():
            if fund_name in item['name']:
                return item['name']
    except Exception as e:
        st.error(f'Error: {e}')

def load_contributions(breeze_api, df_contribution_recs):
    print("loading contributions")
    print(df_contribution_recs)
    df_contribution_recs['Payment ID'] = None
    for index, row in df_contribution_recs.iterrows():
        print(row['Date'])
        date = row['Date']
        name = row['Beneficiary Name']
        uid = row['id']
        fund_id = get_fund_id(row['Fund'])
        fund_name = get_fund_name(row['Fund'])
        amount = row['Amount']

        payment_id = breeze_api.add_contribution(
            date=date,
            name=name,
            processor=None,
            person_id=uid,
            method='Direct Deposit',
            funds_json=[
                {
                    'id': fund_id,
                    'name': fund_name,
                    'amount': amount # Adjusted fund amount
                }
            ],
            amount=amount,  # Total contribution amount
            group=None,
            batch_number=None,
            batch_name=None
        )
        st.write(payment_id)
        print(payment_id)

       #payment_id = breeze_api.add_contribution(data)
        df_contribution_recs.loc[index, 'Payment ID'] = payment_id
    return df_contribution_recs

        


        #print(row['First_Name'], row['Last_Name'], row['Amount'], row['Date'],
    # for item in get_funds:
    #     if 'AD Book ' in item['name']:
    #         print(f"ID: {item['id']}, Name: {item['name']}")