from utils.api_util import connect_to_breeze
from utils.ppl_util import get_people
#get_person_details

def main():
    breeze_client = connect_to_breeze()
    people = get_people(breeze_client)
    print(people.head())    

    # Find a person by first and last name
    person = people.where((people['first_name'] == 'Talia') 
                       & (people['last_name'] == 'Baderian')).dropna()
    print(person)

    # If the person ID is less than 8 characters, pad it with zeros
    person_id = person['id'].iloc[0]
    if len(person_id) < 8:
        person_id = person_id.zfill(8)
    
    print('Person ID: -----------' + person_id) 

    person_dtl = breeze_client.get_person_details(person_id)
    print(person_dtl)



if __name__ == '__main__':
    main()


# import time
# from utils.api_util import connect_to_breeze
# from utils.ppl_util import get_people

# def main():
#     breeze_client = connect_to_breeze()
#     people = get_people(breeze_client)
#     print(people.head())    

#     for index, person in people.iterrows():
#         # If the person ID is less than 8 characters, pad it with zeros
#         if person['id'].isdigit():
            
#             person_id = person['id']
#             if len(person_id) < 8:
#                 person_id = person_id.zfill(8)

#             print('Checking Person: ' + person['first_name'] + ' ' + person['last_name'])

#             # Get the person details
#             try:
#                 person_dtl = breeze_client.get_person_details(person_id)
#             except Exception as e:
#                 print(f"Error fetching details for Person ID {person_id}: {e}")
#                 continue

#             # Check if sms_enrollment_status is not None
#             sms_enrollment_status_list = person_dtl.get('details', {}).get('2003025246', [])
#             for phone in sms_enrollment_status_list:
#                 sms_enrollment_status = phone.get('sms_enrollment_status')
#                 print(sms_enrollment_status)
#                 if sms_enrollment_status is not None:
#                     print(f"SMS Enrollment Status NOT NONE! - Person ID: {person_id}, SMS Enrollment Status: {sms_enrollment_status}")

#             # Add a delay to avoid hitting the rate limit
#             time.sleep(3.5)  # Adjust the delay as needed

# if __name__ == '__main__':
#     main()


