# 📧 Email Sign-In Error Fix

The error you are seeing (`Invalid login: 535-5.7.8 Username and Password not accepted`) indicates that Google blocked the sign-in attempt because the password in your `.env` file is incorrect or not authorized.

Since you are using Gmail, you cannot use your regular password. You must use an **App Password**.

## Option 1: Fix the Credentials (Recommended)

1.  Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2.  Enable **2-Step Verification** if it is not already enabled.
3.  Search for **"App passwords"** in the search bar at the top (or go to [App Passwords](https://myaccount.google.com/apppasswords)).
4.  Create a new App Password:
    *   **App name**: "Elite Coffee Shop" (or any name).
    *   Click **Create**.
5.  Copy the 16-character password generated (e.g., `abcd efgh ijkl mnop`).
6.  Open your `.env` file in the project root.
7.  Update the `EMAIL_SERVER_PASSWORD` variable:
    ```env
    EMAIL_SERVER_PASSWORD="abcd efgh ijkl mnop"
    ```
    *(Remove any spaces if you prefer, though usually spaces are ignored or handled).*
8.  Restart your server:
    ```bash
    npm run dev
    ```

## Option 2: Bypass Email Sending (Development Only)

If you just want to test the sign-in flow without sending real emails, you can temporarily disable the email transporter.

1.  Open your `.env` file.
2.  Comment out the email password:
    ```env
    # EMAIL_SERVER_PASSWORD=your_wrong_password
    ```
3.  Restart your server.
4.  When you try to sign in, the **Magic Link** will be printed in your terminal console instead of being sent via email.
