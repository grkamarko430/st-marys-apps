import os
from dotenv import load_dotenv
from breeze_chms_api import breeze

def connect_to_breeze():
    load_dotenv('.env')

    breeze_url = os.getenv("BREEZE_URL")
    # print('BREEZE_URL: ', breeze_url)
    api_key = os.getenv("BREEZE_API_KEY")
    # print('BREEZE_API_KEY: ', api_key)

    breeze_client = breeze.BreezeApi(
        breeze_url=breeze_url,
        api_key=api_key)

    return breeze_client

# test connection
# breeze_client = connect_to_breeze()
# funds = breeze_client.list_funds()
# print(funds)