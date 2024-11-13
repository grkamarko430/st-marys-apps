from utils.funds_util import get_fund_id, get_fund_name
import datetime as dt
import streamlit as st

def generate_group_id() -> str:
    return f'{dt.datetime.now().strftime("%Y%m%d%H%M%")}'

def load_contributions(breeze_client, df_contribution_recs):
    print("loading contributions")
    print(df_contribution_recs)
    df_contribution_recs['Payment ID'] = None
    
    # Set values for each conribution record
    for index, row in df_contribution_recs.iterrows():
        try:
            print(row['Date'])
            date = row['Date']
            name = row['Contributor Name']
            uid = row['id']
            method = row['Method']
            fund_id = get_fund_id(row['Fund'], breeze_client)
            fund_name = get_fund_name(row['Fund'], breeze_client)
            amount = row['Amount']
            group = generate_group_id()
            batch_name = 'Auto Contribution Loader'

            # Call API to add contribution
            payment_id = breeze_client.add_contribution(
                date=date,
                name=name,
                processor=None,
                person_id=uid,
                method=method,
                funds_json=[
                    {
                        'id': fund_id,
                        'name': fund_name,
                        'amount': amount # Adjusted fund amount
                    }
                ],
                amount=amount,  # Total contribution amount
                group=group,
                batch_number=None,
                batch_name=batch_name
            )
            print(payment_id)

            # Add payment_id to the contribution record
            df_contribution_recs.loc[index, 'Payment ID'] = payment_id
        except Exception as e:
            st.error(f'Error: {e}')
    return df_contribution_recs
