# Breeze Contributions Loader

## Overview

The Breeze Contributions Loader is a Streamlit-based application designed to automate the process of loading contribution records from an Excel spreadsheet into the Breeze Church Management System. The app matches contributor names from the spreadsheet with the Breeze database and loads the contributions automatically if a match is found. If no match is found, the contribution is flagged for manual entry.

## Features

- **Authentication**: Secure login using Streamlit Authenticator.
- **Template Generation**: Generate and download an Excel template for contributions.
- **File Upload**: Upload an Excel file containing contribution records.
- **Data Matching**: Match contributor names from the uploaded file with the Breeze database.
- **Fund Verification**: Verify that all funds in the spreadsheet exist in Breeze.
- **Contribution Loading**: Automatically load contributions into Breeze.
- **Manual Entry Flagging**: Flag contributions that require manual entry.
- **Download Results**: Download the results of the contribution loading process.

## Installation

1. Clone the repository:
    ```shell
    git clone https://github.com/Andrew.Markopoulos/st-marys-apps.git
    cd st-marys-apps/breeze_loader
    ```

2. Create a virtual environment and activate it:
    ```shell
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3. Install the required dependencies:
    ```shell
    pip install -r requirements.txt
    ```

4. Create a `.env` file in the root directory and add your Breeze API credentials:
    ```shell
    cp .env.example .env
    ```

    Fill in the `BREEZE_API_KEY` and `BREEZE_URL` in the `.env` file.

## Usage

1. Run the Streamlit app:
    ```shell
    streamlit run breeze_contributions_loader.py
    ```

2. Open your web browser and navigate to the provided URL (usually `http://localhost:8501`).

3. Log in using the credentials specified in the `config.yaml` file.

4. Follow the instructions on the main page to upload your contribution spreadsheet, match contributors, verify funds, and load contributions into Breeze.

## File Structure

- `breeze_contributions_loader.py`: Main application file.
- `utils/`: Directory containing utility modules for various functionalities.
- `tests/`: Directory containing test files.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For any questions or issues, please open an issue on GitHub or contact the repository owner.
