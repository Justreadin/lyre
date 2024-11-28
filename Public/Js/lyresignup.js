
// Selecting DOM elements
const signup = document.querySelector(".signup");
const Form = document.querySelector('.Form');
const nextBtn = document.querySelector('.signup .next button');
const input1 = document.querySelector('.Firstname input');
const input2 = document.querySelector('.Surname input');
const regText = document.querySelector(".Firstname label");
const reg1Text = document.querySelector(".Surname label");
const profilePictureInput = document.querySelector('.profile-pic');
const profilepic = document.querySelector('.profile_pic');
const uploadBtn = document.querySelector('.uploadbtn');
const profilePictureDisplay = document.querySelector('.profile_pic .show-pic');
const message = document.querySelector(".signup_message");
const signinBtn = document.querySelector(".sign-btn");
const signIn = document.querySelector(".sign_in");
const exitBtn = document.querySelector(".exitbtn");
const signBtn = document.querySelector(".sign_btn");


// Initialize variables
let regCount = 0;
let userData = {};
let firstname, surname, display_name, email, phone_number, password, country_code;

nextBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const inputVal1 = input1.value.trim();
    const inputVal2 = input2.value.trim();

    switch (regCount) {
        case 0: // First name and surname step
            if (!inputVal1 || !inputVal2) {
                alert('Error: Please enter both your First name and surname');
                return;
            }
            firstname = inputVal1;
            surname = inputVal2;
            regCount++;
            updateForm();
            break;

        case 1: // Display name and email step
            // Assuming you have corresponding inputs for display_name and email
            // You will need to update these accordingly in your HTML
            if (!inputVal1 || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(inputVal2)) {
                alert('Error: Please enter a valid display name and email');
                return;
            }
            display_name = inputVal1;
            email = inputVal2;
            regCount++;
            updateForm();
            break;

        case 2: // Country code, phone number, and password step
            const countryCodeElement = document.querySelector('.countrycode'); // Select the country code dropdown
            const countryCode = countryCodeElement ? countryCodeElement.value : ''; // Get the value of the selected option

            // Check if country code is valid
            if (!countryCode) {
                alert('Error: Enter a valid country code');
                return;
            }
            if (!/^\d{10}$/.test(inputVal1)) {
                alert('Error: Phone number should be 10 digits');
                return;
            }
            if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.,/!#$%^-_])[A-Za-z\d@$!%*?&.,/!#$%^-_]{8,}$/.test(inputVal2)) {
                alert('Error: Password must be at least 8 characters, and contain uppercase, lowercase, numbers, and special characters');
                return;
            }
            country_code = countryCode;
            phone_number = inputVal1;
            password = inputVal2;
            submitSignUpForm();
            break;

        default:
            alert('Unexpected registration step');
    }
});

// Submit the signup form data
function submitSignUpForm() {
    userData = { display_name, surname, email, country_code, phone_number, password, firstname };

    console.log("Submitting userData:", userData);

    fetch('https://lyrecal.onrender.com:1800/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    })
        .then((res) => {
            if (!res.ok) throw new Error(`HTTP error status: ${res.status}`);
            return res.json();
        })
        .then((data) => {
            if (data.success) {
                alert('Registration successful');
                sessionStorage.setItem('id', data.id);
                Form.style.display = 'none';
                profilepic.style.display = 'block';
                // Assuming you have corresponding elements for hiding and showing
            } else {
                alert(`Error: ${data.message}`);
            }
        })
        .catch((err) => {
            console.error('Error:', err);
            alert('An error occurred during registration');
        });
}

// Update form step labels and input fields
function updateForm() {
    const labels = [
        { regname: 'First Name' },
        { regname: 'Display Name' },
        { regname: 'Phone Number' }
    ];
    const labels1 = [
        { regname: 'Surname' },
        { regname: 'Email' },
        { regname: 'Password' }
    ];

    regText.textContent = labels[regCount]?.regname || '';
    reg1Text.textContent = labels1[regCount]?.regname || '';
    input1.placeholder = `Enter ${regText.textContent}`;
    input2.placeholder = regCount === 1 ? 'Enter Email' : 'Enter Password';

    // Set the appropriate input types for email and password fields
    if (regCount === 1) {
        input2.type = 'email';  // Email field
    } else if (regCount === 2) {
        input2.type = 'password'; // Password field
        document.querySelector('.Country_Code').style.display = 'block'; // Show country code input
    } else {
        input2.type = 'text';  // Reset to text for phone number or name inputs
    }

    // Show country code field on phone number step
    if (regCount === 2) {
        document.querySelector('.Country_Code').style.display = 'block'; // Show country code input
    } else {
        document.querySelector('.Country_Code').style.display = 'none'; // Hide country code input
    }

    input1.value = '';
    input2.value = '';
}



// Function to check if `id` is set in sessionStorage, with a delay
function checkForId(callback, interval = 500, maxAttempts = 10) {
  let attempts = 0;

  const idCheckInterval = setInterval(() => {
    const id = sessionStorage.getItem('id'); // Retrieve 'id' from sessionStorage

    if (id) {
      clearInterval(idCheckInterval);
      callback(id); // Proceed if `id` is found
    } else if (attempts >= maxAttempts) {
      clearInterval(idCheckInterval);
      alert('Error: User ID not found. Please try re-registering.');
    }

    attempts++;
  }, interval);
}

// Function to upload and display profile picture
function uploadProfilePicture(id) {
  const file = profilePictureInput.files[0];

  // Check if a file is selected
  if (!file) {
    alert('Error: Please select a file to upload');
    return;
  }

  const formData = new FormData();
  formData.append('profilePicture', file);
  formData.append('id', id); // Attach the confirmed ID to formData

  // Send POST request to upload the profile picture
  fetch('https://lyrecal.onrender.com:1800/api/users/upload-profile-picture', {
    method: 'POST',
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        // Display the uploaded profile picture immediately
        profilePictureDisplay.src = `${data.filePath}`;
        alert('Profile picture uploaded successfully!');

        // Redirect to the user's account page immediately
        window.location.href = `Public/Templates/lyre.html?userId=${id}`;
      } else {
        alert(`Error: ${data.message || 'Could not upload profile picture'}`);
      }
    })
    .catch((error) => {
      console.error('Error during upload:', error);
      alert('An error occurred while uploading the profile picture.');
    });
}

// Event listener for the upload button
uploadBtn.addEventListener('click', () => {
  checkForId((id) => uploadProfilePicture(id)); // Ensure the ID is available before uploading
});

// Event listener for the "Skip" button
const skipBtn = document.querySelector('.skipbtn');
skipBtn.addEventListener('click', () => {
  // Use a default placeholder profile picture
  profilePictureDisplay.src = 'Public/static/default-avatar.jpg';

  // Redirect to the user's account immediately
  const id = localStorage.getItem('user_id'); // Retrieve the user's ID from localStorage
  if (id) {
    window.location.href = `Public/Templates/lyre.html?userId=${id}`;
  } else {
    console.error('User ID not found for redirection');
    alert('Error: Unable to redirect to the account page.');
  }
});


signinBtn?.addEventListener("click", () => {
  signIn?.classList.toggle("activesign");
  if (Form) Form.style.display = 'none';
});

exitBtn?.addEventListener("click", () => {
  signIn?.classList.remove("activesign");
  if (Form) Form.style.display = 'block';
});


// Login Function
async function login() {
  const emailInput = document.querySelector(".email input");
  const passwordInput = document.querySelector(".password input");

  if (!emailInput || !passwordInput) {
    alert("Error: Email and password fields are required");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  // Check if email or password is missing
  if (!email || !password) {
    alert("Error: Email and password are required");
    return;
  }

  try {
    const response = await fetch('https://lyrecal.onrender.com:1800/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    // Parse JSON data
    const data = await response.json();

    if (response.ok) {
      // Save the token and role with consistent naming
      sessionStorage.setItem('authToken', data.token);
      sessionStorage.setItem('userRole', data.role); // Save role for frontend logic
      console.log("Login successful. Auth token stored:", data.token);

      // Decode the token to extract user_id
      const tokenPayload = JSON.parse(atob(data.token.split('.')[1])); // Base64 decode
      sessionStorage.setItem('user_id', tokenPayload.id); // Save user ID for future use

      alert('Login successful');
      console.log('User joined with ID:', sessionStorage.getItem('user_id'));
      socket.emit('join', sessionStorage.getItem('user_id'));

      // Redirect based on role
      if (data.role === 'admin') {
        window.location.href = 'Public/Templates/Lyre-admin.html'; // Redirect to admin dashboard
      } else {
        window.location.href = `Public/Templates/lyre.html?userId=${sessionStorage.getItem('user_id')}`;
      }
    } else {
      // Display error message if login fails
      alert(`Error: ${data.message || "Incorrect email or password"}`);
    }
  } catch (error) {
    console.error('Login error:', error);
    alert("An error occurred during login");
  }
}

// Add event listener to login button
signBtn?.addEventListener('click', login);

