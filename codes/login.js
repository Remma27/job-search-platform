document.addEventListener("DOMContentLoaded", function () {

    // Get the login form and error message elements
    const loginForm = document.getElementById("loginForm");

    // Add a submit event listener to the login form
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent the default form submission behavior

        // Retrieve email and password from the form inputs
        const email = loginForm.elements.email.value;
        const password = loginForm.elements.passwd.value;

        try {
            // Send a GET request to the server for login
            const response = await fetch(`http://localhost:5001/login/${email}/${password}`, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                // Extract the user token from the response object
                const responseData = await response.json();
                const userToken = responseData.data.user.token;

                // Save the token in localStorage
                localStorage.setItem("accessToken", userToken);
                alert("Login successful!"); // Display an alert message
                loginForm.reset(); // Clear the form after successful login

                // Redirect the user to another page after successful login
                window.location.href = "index.html";
            } else {
                const errorData = await response.json();
                alert(`Error during login process: ${errorData.message || "An unexpected error occurred."}`);
            }
        } catch (error) {
            alert(`Error during login process: ${error.message}`);
        }
    });
});
