document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        window.location.href = "login.html";
        return;
    }
    console.log("DOM is ready");

    // Get the certification form and error message elements
    const certificationForm = document.getElementById("certificationForm");

    // Add a submit event listener to the certification form
    certificationForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent the default form submission behavior

        // Extract form data
        const formData = {
            description: certificationForm.elements.description.value,
            category: certificationForm.elements.category.value,
            studycenter: certificationForm.elements.studycenter.value,
            year: parseInt(certificationForm.elements.year.value) // Parse the year input as an integer
        };


        try {
            // Get the access token from local storage
            const accessToken = localStorage.getItem("accessToken");
            if (!accessToken) {
                throw new Error("Access token not found in local storage");
            }

            // Send a POST request to add a new certification
            const response = await fetch(`http://localhost:5001/${accessToken}/certification`, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });


            if (response.ok) {
                // Display success message if the certification is added successfully
                alert("Certification added successfully!"); // Display an alert message
                certificationForm.reset(); // Clear the form after successful submission

                // Add a waiting time before redirecting

                // Redirect to the index.html page
                window.location.href = "index.html";
            } else {
                alert("Error adding certification");
                // Handle errors if the server response is not okay
                const errorData = await response.json();
                throw new Error(errorData.message || "Error adding certification");
            }
        } catch (error) {
            alert("Error adding certification");
            // Handle errors that occur during the process
        }
    });
});

