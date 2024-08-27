
// Waits for the DOM content to be fully loaded
document.addEventListener("DOMContentLoaded", function () {

    // Retrieves the interested form and error message elements
    const interestedForm = document.getElementById("interestedForm");

    // Adds a submit event listener to the interested form
    interestedForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevents the default form submission behavior

        // Extracts form data from the interested form inputs
        const formData = {
            name: interestedForm.elements.name.value,
            email: interestedForm.elements.email.value,
            cellphone: interestedForm.elements.cellphone.value,
            passwd: interestedForm.elements.passwd.value
        };

        // Basic client-side validation to ensure all fields are filled correctly
        if (!validateFormData(formData)) {
            alert("Please fill in all fields correctly.");
            return;
        }

        try {
            // Replace 'username' and 'password' with actual credentials for basic authentication
            const username = 'admin';
            const password = 'parda99*';

            // Sends a POST request to the server to register the interested person
            const response = await fetch("http://localhost:5001/interested", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    // Adds basic authentication credentials to the request header
                    "Authorization": "Basic " + btoa(username + ":" + password)
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Extracts the user token from the response object
                const responseData = await response.json();
                const userToken = responseData.data.interested.token;
                // Saves the token in localStorage
                localStorage.setItem("accessToken", userToken);
                alert("Registration successful!"); // Displays an alert message
                interestedForm.reset(); // Clears the form after successful submission

                // Redirects the user to the index page
                window.location.href = "/src/views/people/index.html";
            } else {
                // Handles errors if the server response is not okay
                const errorData = await response.json();
                throw new Error(errorData.error || "Error registering the interested person");
            }
        } catch (error) {
            alert("Error: " + error.message);
            // Handles errors that occur during form submission
        }
    });

    // Validates form data to ensure all required fields are filled
    function validateFormData(formData) {
        return formData.name && formData.email && formData.cellphone && formData.passwd;
    }
});

