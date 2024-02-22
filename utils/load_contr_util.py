from utils.funds_util import get_fund_id, get_fund_name

def load_contributions(breeze_api, df_contribution_recs):
    print("loading contributions")
    print(df_contribution_recs)
    df_contribution_recs['Payment ID'] = None
    
    # Set values for each conribution record
    for index, row in df_contribution_recs.iterrows():
        print(row['Date'])
        date = row['Date']
        name = row['Beneficiary Name']
        uid = row['id']
        method = row['Method']
        fund_id = get_fund_id(row['Fund'])
        fund_name = get_fund_name(row['Fund'])
        amount = row['Amount']

        # Call API to add contribution
        payment_id = breeze_api.add_contribution(
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
            group=None,
            batch_number=None,
            batch_name=None
        )
        print(payment_id)

        # Add payment_id to the contribution record
        df_contribution_recs.loc[index, 'Payment ID'] = payment_id
    return df_contribution_recs
