let reg1 = [
    {
        reg : 1,
        regname:"Firstname",
    },
    {
        reg : 2,
        regname:"Display Name",
    },
    {
        reg : 3,
        regname:"Phone number",
    },
    {
        reg : 4,
        regname:"Password",
    },
]
let reg2 = [
    {
        reg : 1,
        regname:"Surname",
    },
    {
        reg : 2,
        regname:"Email",
    },
    {
        reg : 3,
        regname:"Alternative Phonenumber",
    },
    {
        reg : 4,
        regname:"Retype Password",
    },
]

async function loadProfilePicture() {
    try {
      const response = await fetch('/api/users/profile-picture', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });
  
      const data = await response.json();
      if (response.ok) {
        document.querySelector('#profile-picture').src = data.filePath;
      } else {
        console.error('Failed to load profile picture:', data.message);
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  }
  


  function setupEventListeners(contacts) {
    // Set up contact click events
    document.querySelectorAll('.profile').forEach((contactElement) => {
      contactElement.addEventListener('click', () => {
        const chatId = parseInt(contactElement.getAttribute('data-chat-id'), 10);
        const contactId = parseInt(contactElement.getAttribute('data-contact-id'), 10);
  
        if (isNaN(chatId) || isNaN(contactId)) {
          console.error('Invalid data attributes:', { chatId, contactId });
          return;
        }
  
        console.log(`Chat ID: ${chatId}, Contact ID: ${contactId}`);
  
        displayChat(chatId, contacts); // Pass chat index to display messages
        selectChatUser(contactId); // Handle contact selection by ID
      });
    });

  }
  // Function to handle responsive display adjustments
  function handleWidthChange(e) {
    const column = document.querySelector('.column');
    const searchBox = document.querySelector('.column2 .search');
    const previous = document.querySelector('.previous');
    const ai_previous = document.querySelector('.chat-box .chat-header svg')
  
    if (e.matches) { // Screen width is 600px or less
      document.querySelectorAll('.profile').forEach((contactElement) => {
        contactElement.addEventListener('click', () => {
          column.classList.add("hidecolumn")
          searchBox.classList.add("hidesearch");
          previous.style.display = 'block';
          showChatContent()
        });
      });
  
      document.querySelector('.ai-chat').addEventListener('click', () => {
        column.classList.add("hidecolumn");
        searchBox.classList.add("hidesearch");
        ai_previous.style.display = 'block'
      });
  
  
      previous.addEventListener('click', () => {
        column.classList.remove("hidecolumn");
        searchBox.classList.remove("hidesearch");
        previous.style.display = 'none';
        resetActiveViews();
      });

    } else {
      console.log("Screen size is larger than 600px");
    }
  }
  
  // Utility function to display the main chat view for the selected contact
  function showChatContent() {
    Chatsection.classList.remove('active')
    Ai_box.classList.remove('activebox');
    display_chat.classList.add('activedisplay');
    groupchat.classList.remove('activegroup');
    archived_chat.classList.remove('active_archived');
  }
  
  // Utility function to reset active views
  function resetActiveViews() {
    Chatsection.classList.add('active')
    display_chat.classList.remove('activedisplay');
    archived_chat.classList.remove('active_archived');
    groupchat.classList.remove('activegroup');
    Ai_box.classList.remove('activebox');
  }
  
  
  const displaydetail = document.querySelector(".displaydetail");
  const displayheader = document.querySelector(".display-header");
  
  function displayChat(index, contacts) {
    const contact = contacts[index];
    display_title.innerHTML = `${contact.display_name}`;
  
    // Clear only the existing profile image within displayheader, if present
    let existingImage = displayheader.querySelector("img");
    if (existingImage) {
      displayheader.removeChild(existingImage);
    }
  
    // Set the new profile image
    const displaypic = document.createElement("img");
    displaypic.src = `${contact.profilePicture || 'default-profile.png'}`;
    displayheader.appendChild(displaypic);
  
    displaydetail.innerHTML = `<p>Chat with ${contact.display_name} (${contact.country_code}${contact.phone_number})</p>`;
  }
  