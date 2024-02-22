import os
from dotenv import load_dotenv
from breeze_chms_api import breeze

def connect_to_breeze():
    load_dotenv('api.env')
    api_key = os.getenv("API_KEY")
    #print(api_key)  
    breeze_api = breeze.BreezeApi(
        breeze_url='https://stmary.breezechms.com',
        api_key = os.getenv("API_KEY"))
    return breeze_api
    #print(breeze_api.list_people())