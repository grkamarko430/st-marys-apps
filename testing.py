from utils.api_util import connect_to_breeze

breeze_api = connect_to_breeze()

funds = []
funds = breeze_api.list_funds()

print(funds)