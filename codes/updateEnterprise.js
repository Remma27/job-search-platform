document.addEventListener("DOMContentLoaded", async function () {
    // Retrieves the token from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    // Check if the user token is available in local storage
    // If token is not available, redirect to enterprise login page
    if (!token) {
        window.location.href = "loginEnterprise.html";
        return;
    }

    try {
        // Fetches enterprise data using the token from the URL
        const response = await fetch(`http://localhost:5001/enterprise/${token}`);
        if (response.ok) {
            // Parses the response data and fills the form with enterprise data
            const responseData = await response.json();
            fillForm(responseData, token);
        } else {
            throw new Error(`Failed to fetch enterprise data. Status: ${response.status}`);
        }
    } catch (error) {
        // Handles errors that occur during fetching enterprise data
        alert('Error fetching enterprise data.');
    }
});

// Function to fill the form with enterprise data
function fillForm(responseData, token) {
    const enterpriseData = responseData.data;
    const form = document.getElementById('updateEnterpriseForm');

    // Set the token as a custom attribute of the form
    form.setAttribute('data-token', token);

    // Fills the form inputs with enterprise data
    form.elements['name'].value = enterpriseData.name;
    form.elements['url'].value = enterpriseData.url;
    form.elements['callcenter'].value = enterpriseData.callcenter;
    form.elements['address'].value = enterpriseData.address;

    // Adds submit event listener to the form for updating enterprise data
    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Retrieve the token from the custom attribute of the form
        const token = form.getAttribute('data-token');

        const formData = new FormData(this);
        const name = formData.get('name');
        const url = formData.get('url');
        const callcenter = formData.get('callcenter');
        const address = formData.get('address');

        // Constructs the data object for updating enterprise
        const data = { name: name, url: url, callcenter: callcenter, address: address };

        try {
            // Sends a PUT request to update enterprise data
            const response = await fetch(`http://localhost:5001/enterprise/${token}`, {
                method: "PUT",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                // Redirects to the index.html page upon successful update
                const responseData = await response.json();
                alert('Enterprise updated', responseData);
                window.location.href = "indexEnterprise.html";
            } else {
                // Throws an error if updating enterprise fails
                throw new Error(`Failed to update enterprise. Status: ${response.status}`);
            }
        } catch (error) {
            // Handles errors that occur during updating enterprise
            alert('Error updating enterprise:', error);
        }
    });
}

