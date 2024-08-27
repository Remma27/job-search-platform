document.addEventListener("DOMContentLoaded", async function () {


    // Retrieve token from the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    // Check if the user token is available in local storage
    // If token is not available, redirect to enterprise login page
    if (!token) {
        window.location.href = "loginEnterprise.html";
        return;
    }

    // Get the form and error message elements from the DOM
    const form = document.getElementById('createJobForm');

    // Add submit event listener to the form
    form.addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent default form submission behavior

        try {
            // Initialize an array to store job requirements
            const requirements = [];
            // Retrieve and process requirements from the form input
            const requirementsText = form.elements.requirements.value.trim();
            if (requirementsText !== '') {
                // Split requirements by lines and add them to the requirements array
                const requirementsLines = requirementsText.split('\n');
                requirementsLines.forEach(line => {
                    const requirement = line.trim();
                    if (requirement !== '') {
                        requirements.push({ [`rq_${requirements.length + 1}`]: requirement });
                    }
                });
            }

            // Construct form data object with job details
            const formData = {
                enterprise: token,
                titlejob: form.elements.titlejob.value.trim(),
                description: form.elements.description.value.trim(),
                hiringtype: form.elements.hiringtype.value.trim(),
                salary: form.elements.salary.value.trim(),
                requirements: requirements
            };

            // Send a POST request to add the job
            const response = await fetch('http://localhost:5001/job', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            // Handle response from the server
            if (response.ok) {
                alert('Job added successfully!'); // Display success message
                form.reset(); // Clear the form inputs
                window.location.href = 'indexEnterprise.html'; // Redirect to the enterprise dashboard
            } else {
                // Handle error response from the server
                alert('Error adding job');
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error adding job');
            }
        } catch (error) {
            alert('Error adding job');
        }
    });
});
