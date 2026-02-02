# How to Fix Firebase Storage CORS Block

The error you're seeing happens because Firebase Storage, by default, blocks file uploads from local websites (`localhost`) for security. You need to "white-list" your development server.

### Method 1: The Fastest Way (Using Cloud Shell)

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click the **Terminal Icon** (Activate Cloud Shell) in the top-right header.
3.  In the terminal that opens at the bottom, click the **three dots** (Menu) and select **Upload**.
4.  Upload the `cors.json` file from this project folder.
5.  Run this command in that Cloud Shell terminal:
    ```bash
    gsutil cors set cors.json gs://testnet-4fb78.firebasestorage.app
    ```
    *(Note: If it asks to authorize, click **Authorize**.)*

---

### Method 2: For Local Developers (If you have gcloud installed)

If you have the Google Cloud CLI installed, just run this in your project terminal:
```bash
gsutil cors set cors.json gs://testnet-4fb78.firebasestorage.app
```

---

### Why is this needed?
Firebase Storage is a secure cloud bucket. Browser security (CORS) requires the "Server" (Firebase) to explicitly say "I trust uploads from http://localhost:5173". Once you run the command above, the server will send the correct approval headers and your uploads will work perfectly.
