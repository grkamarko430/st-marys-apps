import pandas as pd
from thefuzz import fuzz
import streamlit as st


def get_people(breeze_api):
    # Get List of all Breeze Users   
    people = breeze_api.list_people()
    df_ppl = pd.DataFrame(people)
    return df_ppl


def check_similar_names(df):
    names = df['Beneficiary Name']
    similar_names = []
    for name in names:
        scores = [(other_name, fuzz.ratio(name, other_name)) for other_name in names if other_name != name]
        scores.sort(key=lambda x: x[1], reverse=True)
        #st.write(name)
        #st.write(scores)
        if scores[0][1] > 80:  # if the best match has a score > 80
            similar_names.append(name)
    return similar_names


def match_people(df_orig_uploaded_file, people):
    if df_orig_uploaded_file is None or df_orig_uploaded_file.empty:
        print("Please upload your file.")
    else:
        st.subheader(body='Match Parishioners',divider='blue')
        results_df = pd.DataFrame()
        unmatched_df = pd.DataFrame()
        # Count distinct Beneficiary Names in the uploaded file
        distinct_bene_names = df_orig_uploaded_file['Beneficiary Name'].nunique()

        # Check similar names and remove them from the dataframe
        similar_names = check_similar_names(df_orig_uploaded_file)
        if similar_names:
            exclude_df = df_orig_uploaded_file[df_orig_uploaded_file['Beneficiary Name'].isin(similar_names)]
            df_uploaded_file = df_orig_uploaded_file[~df_orig_uploaded_file['Beneficiary Name'].isin(similar_names)]

        if df_uploaded_file is not None:
            for index, row in df_uploaded_file.iterrows():
            
                # Direct matching
                lookup_result = people.loc[(people['first_name'] == row['First_Name']) &
                                        (people['last_name'] == row['Last_Name'])]
                if not lookup_result.empty:
                    lookup_result.loc[:, 'id'] = lookup_result['id']
                    lookup_result.loc[:, 'Beneficiary Name'] = row['Beneficiary Name']  # Add 'Beneficiary Name' to lookup_result
                    results_df = pd.concat([results_df, lookup_result])
                else:
                    unmatched_df = pd.concat([unmatched_df, pd.DataFrame(row).T])

            unmatched_records = unmatched_df.copy()

            # Fuzzy matching
            for index, row in unmatched_df.iterrows():
                max_score = 0
                best_match = None
                questionable_matches = []

                for i, person in people.iterrows():
                    score = fuzz.partial_ratio(row['Beneficiary Name'], person['first_name'] + ' ' + person['last_name'])
                    #score = fuzz.token_sort_ratio(row['Beneficiary Name'], person['first_name'] + ' ' + person['last_name'])
                    if score > max_score:
                        max_score = score
                        best_match = person
                    if 80 < score <= 90 or ((score == 100) and len(row['First_Name'] + ' ' + row['Last_Name']) != len(person['first_name'] + ' ' + person['last_name'])):  # questionable match
                        questionable_matches.append((person, score))
                if max_score > 90:
                    lookup_result = best_match
                    print(lookup_result)
                    print(max_score)
                    print(row)
                    lookup_result['id'] = lookup_result['id']
                    lookup_result['Beneficiary Name'] = row['Beneficiary Name']
                    results_df = pd.concat([results_df, pd.DataFrame(lookup_result).T])
                    unmatched_records = unmatched_records.drop(index)  # remove matched record from unmatched_records
                # elif questionable_matches:
                #     st.warning(f"Questionable matches for {row['Beneficiary Name']}:")
                    # approved_matches = []
                    # for match, score in questionable_matches:
                    #     is_approved = st.checkbox(f"Is {match['first_name']} {match['last_name']} with score {score} the right person?", value=False)
                    #     if is_approved:
                    #         approved_matches.append(match)
                    # for match in approved_matches:
                    #     # Assuming match is a dictionary with keys corresponding to columns in results_df
                    #     match_df = pd.DataFrame(match, index=[0])
                    #     results_df = pd.concat([results_df, match_df], ignore_index=True)
                    
            results_df = results_df.drop_duplicates()

        if not results_df.empty:
            st.markdown(f"<div style='color: white; font-size:16px;'>Found <b>{str(results_df['id'].count())}</b> out of <b>{str(distinct_bene_names)}</b> parishioners from the spreadsheet that matched in Breeze.  <b>{str(unmatched_records['First_Name'].count())}</b> parishioners did not automatically match, and <b>{str(exclude_df['First_Name'].count())}</b> more were excluded from the matching process since the names were too similar.</div>", unsafe_allow_html=True)            
            st.write(results_df)
            if not exclude_df.empty:
                st.write("Excluded records:")
                st.write(exclude_df)
            if not unmatched_records.empty:
                st.write("Unmatched records:")
                st.write(unmatched_records)
            return results_df
        else:
            print("No matches found")
            return None





            