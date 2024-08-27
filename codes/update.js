document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Get the update form and error message elements
    const updateForm = document.getElementById("updateForm");

    fetchExistingData(token);

    // Add a submit event listener to the update form
    updateForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevents the default form submission behavior

        // Extract form data from the update form inputs
        const formData = {
            name: updateForm.elements.name.value,
            email: updateForm.elements.email.value,
            cellphone: updateForm.elements.cellphone.value,
        };

        // Basic client-side validation to ensure all required fields are filled correctly
        if (!validateFormData(formData)) {
            alert("Please fill in all fields correctly.");
            return;
        }

        try {
            // Send a PUT request to the server to update the user information
            const response = await fetch("http://localhost:5001/interested/" + token, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "security": token // Include security token in the request header
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Display success message and redirect the user after a short delay
                alert("Information updated successfully!"); // Display an alert message
                window.location.href = "index.html"; // Redirect to the index page
            } else {
                // Handle errors if the server response is not okay
                const errorData = await response.json();
                throw new Error(errorData.message || "Error updating information");
            }
        } catch (error) {
            // Handle errors that occur during the update process
            alert("An error occurred while updating information. Please try again.");
        }
    });
});

// Function to fetch existing user data from the server
async function fetchExistingData(token) {
    try {
        const response = await fetch("http://localhost:5001/" + token + "/me", {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "security": token // Include security token in the request header
            }
        });

        if (response.ok) {
            const data = await response.json();
            populateForm(data.data.user); // Populate the form with user information obtained from the API
        } else {
            throw new Error("Error fetching existing data");
        }
    } catch (error) {
        alert("An error occurred while fetching existing data. Please try again.");
    }
}

// Function to populate the update form with existing user data
function populateForm(userData) {
    document.getElementById("name").value = userData.name;
    document.getElementById("email").value = userData.email;
    document.getElementById("cellphone").value = userData.cellphone;
    // No need to pre-fill the password if we don't allow its update in this form
}

// Function to validate form data
function validateFormData(formData) {
    return formData.name && formData.email && formData.cellphone;
}

