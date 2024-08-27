// Global variable to store the jobId
let jobId;

// Event listener for DOMContentLoaded event to ensure the DOM is fully loaded
document.addEventListener("DOMContentLoaded", async function () {
    // Check if the user token is available in local storage
    const token = localStorage.getItem("enterpriseToken");

    // If token is not available, redirect to enterprise login page
    if (!token) {
        window.location.href = "loginEnterprise.html";
        return;
    }
    // Retrieves the jobId from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    jobId = urlParams.get('id'); // Assigns the jobId value here
    if (!jobId) {
        console.error("Job ID not provided in the URL.");
        return;
    }

    try {
        // Fetches job data using the jobId from the URL
        const response = await fetch(`http://localhost:5001/jobID/${jobId}`);
        if (response.ok) {
            // Parses the response data and fills the form with job data
            const jobData = await response.json();
            fillForm(jobData);
        } else {
            throw new Error(`Failed to fetch job data. Status: ${response.status}`);
        }
    } catch (error) {
        // Handles errors that occur during fetching job data
        alert('Error fetching job data.');
    }
});

// Function to fill the form with job data
async function fillForm(jobData) {

    // Checks if jobData contains the requirements property
    if (!jobData.data.requirements) {
        console.error("Requirements data not found in job data.");
        return;
    }

    const form = document.getElementById('createJobForm');

    // Fills the form inputs with job data
    form.elements['titlejob'].value = jobData.data.titlejob;
    form.elements['description'].value = jobData.data.description;
    form.elements['hiringtype'].value = jobData.data.hiringtype;
    form.elements['salary'].value = jobData.data.salary;

    // Adds an event listener for form submission
    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Collects form data
        const formData = new FormData(form);
        const titlejob = formData.get('titlejob');
        const description = formData.get('description');
        const hiringtype = formData.get('hiringtype');
        const salary = formData.get('salary');

        // Constructs a data object for updating the job
        const data = {
            enterpriseID: jobData.data.enterpriseID,
            titlejob: titlejob,
            description: description,
            hiringtype: hiringtype,
            salary: salary
        };

        try {
            // Sends a PUT request to update job data
            const response = await fetch(`http://localhost:5001/job/${jobId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                // Redirects to the index page upon successful update
                alert('Job updated successfully.');
                window.location.href = "indexEnterprise.html";
            } else {
                // Handles update failure
                throw new Error(`Failed to update job. Status: ${response.status}`);
            }
        } catch (error) {
            // Handles update error
            alert('Error updating job.');
        }
    });
}

