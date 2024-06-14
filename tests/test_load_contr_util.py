import pandas as pd
from unittest.mock import Mock
from utils.funds_util import get_fund_id, get_fund_name
from code_under_test import load_contributions

def test_adds_contributions_with_valid_data():
    breeze_api = Mock()
    breeze_api.add_contribution.return_value = 'payment123'

    df_contribution_recs = pd.DataFrame({
        'Date': ['2023-01-01'],
        'Contributor Name': ['John Doe'],
        'id': [1],
        'Method': ['Credit Card'],
        'Fund': ['General Fund'],
        'Amount': [100.0]
    })

    result = load_contributions(breeze_api, df_contribution_recs)

    assert result.loc[0, 'Payment ID'] == 'payment123'
    breeze_api.add_contribution.assert_called_once()


def test_handles_empty_dataframe():
    breeze_api = Mock()

    df_contribution_recs = pd.DataFrame(columns=['Date', 'Contributor Name', 'id', 'Method', 'Fund', 'Amount'])

    result = load_contributions(breeze_api, df_contribution_recs)

    assert result.empty
    breeze_api.add_contribution.assert_not_called()

import pandas as pd
from unittest.mock import Mock
from utils.funds_util import get_fund_id, get_fund_name
from code_under_test import load_contributions


def test_manages_missing_date_field():
    breeze_api = Mock()
    breeze_api.add_contribution.return_value = 'payment123'

    df_contribution_recs = pd.DataFrame({
        'Date': [None],
        'Contributor Name': ['John Doe'],
        'id': [1],
        'Method': ['Credit Card'],
        'Fund': ['General Fund'],
        'Amount': [100.0]
    })

    result = load_contributions(breeze_api, df_contribution_recs)

    assert result.loc[0, 'Payment ID'] == 'payment123'
    breeze_api.add_contribution.assert_called_once()