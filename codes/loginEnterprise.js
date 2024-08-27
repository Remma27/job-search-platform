document.addEventListener("DOMContentLoaded", () => {
    // Get the login form and error message elements
    const loginForm = document.getElementById("loginForm");

    // Add an event listener for the submit event of the login form
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent the default form submission behavior

        // Get the email and password from the form inputs
        const email = loginForm.elements.email.value;
        const password = loginForm.elements.password.value;

        try {
            // Send a GET request to the server for login
            const SERVER_URL = "http://localhost:5001/enterprise_login";
            const response = await fetch(`${SERVER_URL}/${email}/${password}`, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                // Extract the user token from the response
                const { data } = await response.json();
                const { token: enterpriseToken } = data.enterprise;

                // Save the token in the localStorage
                localStorage.setItem("enterpriseToken", enterpriseToken);

                alert("Login successful!"); // Display an alert message
                loginForm.reset(); // Clear the form after successful login

                // Redirect the user to another page after successful login
                window.location.href = "indexEnterprise.html";
            } else {
                alert("Error during the login process");
                // Handle errors if the server response is not successful
                const { message } = await response.json();
                throw new Error(message || "Error during the login process");
            }
        } catch (error) {
            // Handle errors that occur during the login process
            alert(`Error during the login process: ${error.message}`);
        }
    });
});
