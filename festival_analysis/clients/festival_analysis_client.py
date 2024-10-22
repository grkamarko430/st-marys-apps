import streamlit as st
import pandas as pd
from util.db_util import connect_turso_db
from pandasai import Agent, SmartDataframe
from langchain_groq import ChatGroq
import os

class FestivalAnalyzer:
    def __init__(self):
        self.conn = connect_turso_db()
        self.cursor = self.conn.cursor()
        print('------CONN-----', self.conn)

    def fetch_order_items(self):
        self.cursor.execute('''select item_order_id, Date, Time, Category, Item, Qty, Price_Point_Name, Modifiers_Applied,
                            Gross_Sales, Discounts, Net_Sales, Tax, Transaction_ID, Payment_ID, Customer_ID, Customer_Name,
                            Customer_Reference_ID, Count, Token
                            from festival_item_orders''')
        order_items = self.cursor.fetchall()
        columns = [desc[0] for desc in self.cursor.description]
        return order_items, columns

    def fetch_transactions(self):
        self.cursor.execute('''select Transaction_ID, Date, Time, Gross_Sales, Discounts, Service_Charges, Net_Sales,
                            Gift_Card_Sales, Tax, Tip, Partial_Refunds, Total_Collected, Card, Card_Entry_Methods, Cash,
                            Fees, Net_Total, Payment_ID, Card_Brand, PAN_Suffix, Customer_ID, Customer_Name, Customer_Reference_ID,
                            Fee_Percentage_Rate, Fee_Fixed_Rate, Transaction_Status
                            from festival_transactions''')
        transactions = self.cursor.fetchall()
        columns = [desc[0] for desc in self.cursor.description]
        return transactions, columns

    @staticmethod
    def display_metrics(transactions_df, order_items_df):
        # Create three columns
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric('Gross Sales:', f"{transactions_df['Gross_Sales'].sum():,.2f}", delta=f"{transactions_df['Gross_Sales'].sum()-85853.28:,.2f}")
            st.write('Discounts:  ', f" {transactions_df['Discounts'].sum():,.2f}")
            st.write('Square Fees:  ', f" {transactions_df['Fees'].sum():,.2f}")
        with col2:
            st.metric('Net Sales:', f"{transactions_df['Net_Sales'].sum():,.2f}", delta=f"{transactions_df['Net_Sales'].sum()-84738.78:,.2f}")
            st.write('Number of Items Sold:  ', f" {order_items_df.shape[0]:,.2f}")
            st.write('Number of Transactions:  ', f" {transactions_df.shape[0]:,.2f}")
        with col3:
            st.metric('Net Total:', f"{transactions_df['Net_Total'].sum():,.2f}", delta=f"{transactions_df['Net_Total'].sum()-82924.26:,.2f}")
            st.write('Avg. Items per Trans:  ', f" {order_items_df.shape[0] / transactions_df.shape[0]:,.2f}")
            st.write('Avg. Net Sales per Trans:  ', f" {transactions_df['Net_Sales'].mean():,.2f}")

    @staticmethod
    def display_item_sales(order_items_df):
        st.header('Item Sales')
        # Group and aggregate data by Item
        item_sales = order_items_df.groupby('Item').agg({'Qty': 'sum', 'Net_Sales': 'sum'}).reset_index()
        item_sales['Net_Sales'] = item_sales['Net_Sales'].astype(float)
        # Sort by Net_Sales in descending order
        item_sales = item_sales.sort_values(by='Net_Sales', ascending=False)
        # Display the aggregated data by Item
        st.dataframe(item_sales, hide_index=True, use_container_width=True)

    @staticmethod
    def display_item_details(order_items_df):
        st.header('Item Details')
        item_sales_pp = order_items_df.groupby(['Item', 'Price_Point_Name', 'Date']).agg({'Qty': 'sum'}).reset_index()
        item_sales_pp['Date'] = pd.to_datetime(item_sales_pp['Date'])
        item_sales_pp['Day'] = item_sales_pp['Date'].dt.date
        item_sales_pp = item_sales_pp.sort_values(by=['Item', 'Day'])

        selected_item = st.selectbox('Select an Item', item_sales_pp['Item'].unique())
        item_data = item_sales_pp[item_sales_pp['Item'] == selected_item]
        st.dataframe(item_data, hide_index=True, use_container_width=True)
        price_point_data = item_data[item_data['Qty'] > 0]
        st.bar_chart(price_point_data.pivot(index='Day', columns='Price_Point_Name', values='Qty'), use_container_width=True)

    @staticmethod
    def display_transactions_over_time(transactions_df):
        st.header('Transactions by Day and Hour of the Day')
        transactions_df['Date'] = pd.to_datetime(transactions_df['Date'], dayfirst=False, errors='coerce')
        transactions_df['Time'] = pd.to_datetime(transactions_df['Time'], format='%H:%M:%S')
        transactions_df['Day'] = transactions_df['Date'].dt.day_name()
        transactions_df['Hour'] = transactions_df['Time'].dt.hour
        transactions_grouped = transactions_df.groupby(['Day', 'Hour']).size().reset_index(name='Count')
        transactions_grouped['Day_Hour'] = transactions_grouped['Day'] + ' ' + transactions_grouped['Hour'].astype(str)
        transactions_grouped = transactions_grouped.sort_values(by=['Day', 'Hour'])
        st.line_chart(transactions_grouped.set_index('Day_Hour')['Count'])

    @staticmethod
    def filter_dates(order_items_df, transactions_df):
        # Convert the 'Date' columns to datetime format
        order_items_df['Date'] = pd.to_datetime(order_items_df['Date'], dayfirst=False, errors='coerce')
        transactions_df['Date'] = pd.to_datetime(transactions_df['Date'], dayfirst=False, errors='coerce')
        # Fetch the minimum and maximum dates from the DataFrames
        min_date = min(order_items_df['Date'].min(), transactions_df['Date'].min())
        max_date = max(order_items_df['Date'].max(), transactions_df['Date'].max())
        # Ensure min_date and max_date are of type datetime.date
        min_date = min_date.date()
        max_date = max_date.date()
        # Create a Streamlit slider for date filtering
        date_filter = st.sidebar.slider('Date Filter', min_date, max_date, (min_date, max_date), format="YYYY-MM-DD")
        # Filter the DataFrames by the selected date range
        order_items_df = order_items_df[(order_items_df['Date'] >= pd.to_datetime(date_filter[0])) & (order_items_df['Date'] <= pd.to_datetime(date_filter[1]))]
        transactions_df = transactions_df[(transactions_df['Date'] >= pd.to_datetime(date_filter[0])) & (transactions_df['Date'] <= pd.to_datetime(date_filter[1]))]
        return order_items_df, transactions_df

    @staticmethod
    def filter_items(order_items_df, transactions_df):
        items_to_exclude = st.sidebar.multiselect('Exclude Items', sorted(order_items_df['Item'].unique()))
        if items_to_exclude:
            order_items_df = order_items_df[~order_items_df['Item'].isin(items_to_exclude)]
            # Filter transactions based on the filtered order items
            filtered_transaction_ids = order_items_df['Transaction_ID'].unique()
            transactions_df = transactions_df[transactions_df['Transaction_ID'].isin(filtered_transaction_ids)]
        return order_items_df, transactions_df

    def execute(self):
        tab1, tab2 = st.tabs(['Dashboard', 'Chat'])

        with tab1:
            st.title('Festival Analysis Dashboard')
            order_items, order_items_columns = self.fetch_order_items()
            transactions, transactions_columns = self.fetch_transactions()
            order_items_df = pd.DataFrame(order_items, columns=order_items_columns)
            transactions_df = pd.DataFrame(transactions, columns=transactions_columns)
            st.sidebar.title('Filters')
            order_items_df, transactions_df = self.filter_dates(order_items_df, transactions_df)
            order_items_df, transactions_df = self.filter_items(order_items_df, transactions_df)
            self.display_metrics(transactions_df, order_items_df)
            st.divider()
            self.display_item_sales(order_items_df)
            self.display_item_details(order_items_df)
            self.display_transactions_over_time(transactions_df)

        with tab2:
            st.title('Chat With Festival Data (Beta)')
            st.write('Chat with the Festival Data to get insights. Be sure to include years in your queries. '
                     'Ask questions like "in 2024, how many grape leaves did we sell and what are the net sales?", "What were the top selling items in 2024?", '
                     '"Which day did we sell the most hummus?" Also try making asking for charts like '
                     '"Show me a bar chart of sales by item in 2024"')

            if "GROQ_API_KEY" not in os.environ:
                os.environ["GROQ_API_KEY"] = st.secrets["GROQ_API_KEY"]
            if "PANDASAI_API_KEY" not in os.environ:
                os.environ["PANDASAI_API_KEY"] = st.secrets["PANDASAI_API_KEY"]

            if 'chat_history' not in st.session_state:
                st.session_state.chat_history = []

            llm = ChatGroq(model="llama-3.2-90b-text-preview", temperature=0.0, max_retries=2)
            order_items_df_smrt = SmartDataframe(order_items_df, config={"llm": llm})
            transactions_df_smrt = SmartDataframe(transactions_df, config={"llm": llm})
            agent = Agent([order_items_df,transactions_df], config={"llm": llm})
            # agent.train(docs=["you are the best data analyst ever", "You think critically and check your work several times to make sure it is correct. "])

            if st.button("Clear Chat"):
                st.session_state.chat_history = []

            user_input = st.chat_input("Ask a question about the festival data:")
            if user_input:
                st.session_state.chat_history.append({"role": "user", "content": user_input})
                response = agent.chat(user_input)
                st.session_state.chat_history.append({"role": "assistant", "content": response})

            for message in st.session_state.chat_history:
                st.chat_message(message["role"]).write(message["content"])




# Instantiate:
# from langchain_groq import ChatGroq
# llm = ChatGroq(    model="mixtral-8x7b-32768",    temperature=0.0,    max_retries=2,    # other params...)

# Invoke:
# messages = [    ("system", "You are a helpful translator. Translate the user    sentence to French."),    ("human", "I love programming."),]llm.invoke(messages)
#
# AIMessage(content='The English sentence "I love programming" canbe translated to French as "J'aime programmer". The word"programming" is translated as "programmer" in French.',response_metadata={'token_usage': {'completion_tokens': 38,'prompt_tokens': 28, 'total_tokens': 66, 'completion_time':0.057975474, 'prompt_time': 0.005366091, 'queue_time': None,'total_time': 0.063341565}, 'model_name': 'mixtral-8x7b-32768','system_fingerprint': 'fp_c5f20b5bb1', 'finish_reason': 'stop','logprobs': None}, id='run-ecc71d70-e10c-4b69-8b8c-b8027d95d4b8-0')