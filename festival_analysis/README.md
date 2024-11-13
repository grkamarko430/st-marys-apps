# Festival Analysis

This project provides tools for analyzing festival data, including order items and transactions. It includes a Streamlit-based dashboard for visualizing metrics, item sales, and transactions over time.

## Project Structure

- `util/db_util.py`: Utility functions for loading secrets and connecting to the Turso database.
- `festival_analysis_handler.py`: Main entry point for executing the festival analysis.
- `clients/festival_analysis_client.py`: Contains the `FestivalAnalyzer` class with methods for fetching data, displaying metrics, and visualizing data.

## Setup

### Prerequisites

- Python 3.7+
- [Streamlit](https://streamlit.io/)
- [libsql_experimental](https://pypi.org/project/libsql-experimental/)
- [pandas](https://pandas.pydata.org/)
- [python-dotenv](https://pypi.org/project/python-dotenv/)
- [toml](https://pypi.org/project/toml/)

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/Andrew.Markopoulos/st-marys-apps.git
    cd st-marys-apps/festival_analysis
    ```

2. Create a virtual environment and activate it:
    ```sh
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3. Install the required packages:
    ```sh
    pip install -r requirements.txt
    ```

4. Set up your environment variables:
    - Create a `.env` file in the root directory with the following content:
        ```env
        TURSO_DATABASE_URL=<your_turso_database_url>
        TURSO_AUTH_TOKEN=<your_turso_auth_token>
        TURSO_DB_DIRECTORY=<your_db_directory>
        ```

    - Alternatively, you can use a `secrets.toml` file with the same keys.

## Usage

1. Run the festival analysis handler:
    ```sh
    streamlit run festival_analysis_handler.py
    ```

2. Open your web browser and navigate to the URL provided by Streamlit (usually `http://localhost:8501`).

3. Use the dashboard to filter data, view metrics, and analyze item sales and transactions.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.