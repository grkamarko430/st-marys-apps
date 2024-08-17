import pytest
from utils.api_util import connect_to_breeze

class TestGetFunds:

    def test_breeze_api_connection(self):
        breeze_client = connect_to_breeze()
        funds = breeze_client.list_funds()
        print(funds)
        assert len(funds) > 0

    #  Successfully connects to Breeze API and retrieves the list of funds
    def test_successful_connection_and_retrieval(self, mocker):
        from utils.funds_util import get_funds
        from utils.api_util import connect_to_breeze

        mock_breeze_client = mocker.Mock()
        mock_breeze_client.list_funds.return_value = [{'id': 1, 'name': 'General Fund'}]
        mocker.patch('utils.api_util.connect_to_breeze', return_value=mock_breeze_client)

        funds = get_funds()

        assert funds == [{'id': 1, 'name': 'General Fund'}]

    #  Handles the scenario where the API key is missing or incorrect
    def test_missing_or_incorrect_api_key(self, mocker):
        from utils.funds_util import get_funds
        from utils.api_util import connect_to_breeze

        mocker.patch('utils.api_util.connect_to_breeze', side_effect=Exception("Invalid API Key"))

        with pytest.raises(Exception) as excinfo:
            get_funds()

        assert str(excinfo.value) == "Invalid API Key"
