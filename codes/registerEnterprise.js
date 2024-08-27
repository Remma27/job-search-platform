document.addEventListener("DOMContentLoaded", function () {
    // Adds an event listener for the DOMContentLoaded event to ensure the DOM is fully loaded
    const form = document.getElementById("registerForm");

    // Adds a submit event listener to the registerForm
    form.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevents the default form submission behavior

        // Retrieves values from form inputs
        const name = document.getElementById("name").value;
        const url = document.getElementById("url").value;
        const callcenter = document.getElementById("callcenter").value;
        const address = document.getElementById("address").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // Sends a POST request to register a new enterprise
        fetch("http://localhost:5001/enterprise", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                url,
                callcenter,
                address,
                email,
                passwd: password
            })
        })
            .then(response => {
                if (!response.ok) {
                    alert("Network response was not ok");
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Handles the response data from the server
                if (data.status_code === 201) {
                    alert("Enterprise registered successfully");
                    // Stores the enterprise token in local storage upon successful registration
                    localStorage.setItem("enterpriseToken", data.data.enterprise.token);
                    // Redirects to the indexEnterprise page
                    window.location.href = "indexEnterprise.html";
                }
            })
            .catch(error => {
                alert("Error registering the enterprise");
                // Handles errors that occur during the registration process
            });
    });
});
