// Fetches user data upon DOM content load
document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        window.location.href = "login.html";
        return;
    }
    try {
        // Fetches user data from the server using the access token
        const response = await fetch("http://127.0.0.1:5001/" + token + "/me");
        if (response.ok) {
            const responseData = await response.json();
            const userData = responseData.data.user;
            if (userData && userData.name) {
                // Displays a welcome message with the user's name
                document.getElementById("username").textContent = "Welcome, " + userData.name;
                document.getElementById("email").textContent = "Email: " + userData.email;
                document.getElementById("cellphone").textContent = "Phone: " + userData.cellphone;
            } else {
                throw new Error("User data not found or incomplete.");
            }
        } else {
            throw new Error("Failed to fetch user data. Status: " + response.status);
        }
    } catch (error) {
        // Handles errors that occur during fetching user data
        alert("An error occurred while fetching user data. Please try again.");
        document.getElementById("username").textContent = "Error fetching user data.";
    }

    await fetchAndDisplayJobs();
    getCertifications(token);
});

/**
 * Fetches and displays the available jobs that the user has not applied to.
 */
async function fetchAndDisplayJobs() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        // Fetch the available jobs
        const jobsResponse = await fetch('http://localhost:5001/job');
        const jobsData = await jobsResponse.json();

        if (jobsData.status_code === 200) {
            const enterprises = await fetchEnterprises();

            // Filter the jobs to only show those the user has not applied to
            const jobs = jobsData.data.filter(job => !job.interested_people.includes(token));

            const jobListContainer = document.getElementById('jobList');
            jobListContainer.innerHTML = '';

            if (jobs.length > 0) {
                jobs.forEach(job => {
                    const enterprise = enterprises.find(e => e.token === job.enterprise);
                    const enterpriseName = enterprise ? enterprise.name : 'Unknown';

                    const requirementsList = job.requirements.map((req, index) => {
                        const key = Object.keys(req)[0];
                        const value = req[key];
                        return `<li>Requirement ${index + 1}: ${value}</li>`;
                    }).join('');

                    const jobItem = document.createElement('div');
                    jobItem.classList.add('job-item');
                    jobItem.innerHTML = `
                    <h2>${job.titlejob}</h2>
                    <p><strong>Enterprise:</strong> ${enterpriseName}</p>
                    <p><strong>Description:</strong> ${job.description}</p>
                    <p><strong>Hiring Type:</strong> ${job.hiringtype}</p>
                    <p><strong>Salary:</strong> ${job.salary}</p>
                    <p><strong>Requirements:</strong></p>
                    <ul>${requirementsList}</ul>
                    <button class="apply-button" onclick="applyForJob('${job.id}')">Apply</button>
                    `;
                    jobListContainer.appendChild(jobItem);
                });
            } else {
                const noJobsMessage = document.createElement('p');
                noJobsMessage.textContent = 'No jobs found.';
                jobListContainer.appendChild(noJobsMessage);
            }
        } else {
            const errorMessage = document.createElement('p');
            errorMessage.textContent = jobsData.status_message;
            jobListContainer.appendChild(errorMessage);
        }
    } catch (error) {
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Error fetching job data. Please, try again later';
        jobListContainer.appendChild(errorMessage);
    }
}

/**
 * Fetches the list of enterprises from the server.
 * @returns {Promise<Array>} - The list of enterprises.
 */
async function fetchEnterprises() {
    const enterpriseResponse = await fetch("http://localhost:5001/enterprise");
    const enterpriseData = await enterpriseResponse.json();

    if (enterpriseData.status_code === 200) {
        return enterpriseData.data;
    } else {
        throw new Error(`Failed to fetch enterprise data. Status: ${enterpriseResponse.status}`);
    }
}

// Redirects to the update.html page when the updateButton is clicked
document.getElementById("updateButton").addEventListener("click", function () {
    window.location.href = "update.html";
});

// Redirects to the addCertificates.html page when the addCertificatesButton is clicked
document.getElementById("addCertificatesButton").addEventListener("click", function () {
    window.location.href = "addCertificates.html";
});

/**
 * Applies for a job by sending a request to the server.
 * @param {string} jobId - The ID of the job to apply for.
 */
async function applyForJob(jobId) {
    const token = localStorage.getItem("accessToken");

    try {
        const response = await fetch(`http://localhost:5001/job/${jobId}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId: token })
        });

        if (response.ok) {
            alert('You have applied for the job successfully');
            await fetchAndDisplayJobs();
        } else {
            const errorData = await response.json();
            throw new Error(`Failed to apply for job. Status: ${response.status}, Message: ${errorData.message}`);
        }
    } catch (error) {
        alert('An error occurred while applying for the job. Please try again later.');
    }
}

// Retrieves certifications data from the server using the access token
function getCertifications(token) {
    fetch(`http://localhost:5001/${token}/certification`)
        .then(response => response.json())
        .then(data => {
            if (data.status_code === 200) {
                // Displays certifications data in a table
                displayCertifications(data.data);
            } else {
                console.error('Error fetching certifications:', data.error);
                const tableBody = document.querySelector('#certificationsTable tbody');
                if (tableBody) {
                    tableBody.innerHTML = '<tr><td colspan="6">No certifications</td></tr>';
                } else {
                    console.error('tableBody element not found');
                }
            }
        })
        .catch(error => {
            console.error('Error making request:', error);
            const tableBody = document.querySelector('#certificationsTable tbody');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="6">Error fetching certifications</td></tr>';
            } else {
                console.error('tableBody element not found');
            }
        });
}

/**
 * Displays the user's certifications in a table.
 * If no certifications are found, it displays a "No certifications found" message.
 * @param {Array} certifications - The list of certifications to display.
 */
function displayCertifications(certifications) {
    try {
        const certificationsTable = document.getElementById('certificationsTable');
        const tableBody = certificationsTable?.getElementsByTagName('tbody')[0]; // Use optional chaining

        // Clear the table body
        if (tableBody) {
            tableBody.innerHTML = '';
        }

        if (certifications.length === 0) {
            // Hide the table and show the "No certifications found" message
            if (certificationsTable) {
                certificationsTable.classList.add('hidden');
            }
            noCertificationsMessage.classList.remove('hidden');
        } else {
            // Show the table and hide the "No certifications found" message
            if (certificationsTable) {
                certificationsTable.classList.remove('hidden');
            }

            certifications.forEach(certification => {
                const row = document.createElement('tr');
                row.innerHTML = `
            <td>${certification.description}</td>
            <td>${certification.category}</td>
            <td>${certification.studycenter}</td>
            <td>${certification.year}</td>
            <td>
              <button class="btn-action" onclick="modifyCertificate('${certification.id}')">Modify</button>
              <button class="btn-action" onclick="deleteCertificate('${certification.id}')">Delete</button>
            </td>
          `;
                if (tableBody) {
                    tableBody.appendChild(row);
                }
            });
        }
    } catch (error) {
        console.error('Error in displayCertifications:', error);
    }
}

// Redirects to the UpdateCertificates.html page with the certificate ID
function modifyCertificate(certificateId) {
    window.location.href = `UpdateCertificates.html?certId=${certificateId}`;
}

// Deletes a certificate with confirmation
function deleteCertificate(certificateId) {
    const confirmation = confirm("Are you sure you want to delete this certificate?");
    if (confirmation) {
        const token = localStorage.getItem("accessToken");
        fetch(`http://localhost:5001/${token}/certification/${certificateId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                alert('Certificate deleted successfully.');
                location.reload(); // Reloads the page after successful deletion
            })
            .catch(error => {
                console.error('Error deleting certificate:', error);
            });
    }
}

// Logs out the user by removing the access token from local storage and redirecting to the login page
function logout() {
    localStorage.removeItem("accessToken");
    window.location.href = "login.html";
}
