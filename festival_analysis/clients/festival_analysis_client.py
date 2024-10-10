import streamlit as st
import pandas as pd
from util.db_util import connect_turso_db


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

        for item in item_sales_pp['Item'].unique():
            item_data = item_sales_pp[item_sales_pp['Item'] == item]
            with st.expander(item):
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
        st.title('Festival Analysis')
        # Fetch data
        order_items, order_items_columns = self.fetch_order_items()
        transactions, transactions_columns = self.fetch_transactions()

        # Convert to DataFrame
        order_items_df = pd.DataFrame(order_items, columns=order_items_columns)
        transactions_df = pd.DataFrame(transactions, columns=transactions_columns)

        # Filter by date
        st.sidebar.title('Filters')
        order_items_df, transactions_df = self.filter_dates(order_items_df, transactions_df)

        # Filter out items that are not in the transactions DataFrame
        order_items_df, transactions_df = self.filter_items(order_items_df, transactions_df)

        # Display Metrics
        st.divider()
        self.display_metrics(transactions_df, order_items_df)
        st.divider()

        # Display order items
        self.display_item_sales(order_items_df)

        # Display item details
        self.display_item_details(order_items_df)

        # Visualize transactions in a line graph by day and hour of the day
        self.display_transactions_over_time(transactions_df)



