const ai_chat = document.querySelector(".ai-chat");
const Ai_box = document.querySelector(".chat-box");
const profilebox = document.querySelector(".col")
const display_profile = document.querySelectorAll(".col .profile")
const Chatsection = document.querySelector(".Chatsection")
const display_chat = document.querySelector(".display-chat");
const display_title = document.querySelector(".display-title")
const display_box = document.querySelector(".display-content")
const display_incoming = document.querySelector(".display");
const display_input = document.querySelectorAll(".display-input");
const chat_send = document.querySelector(".chat-send");
const displaytext = document.querySelector(".display_text");
const group_display = document.querySelectorAll(".group_display");
const groupdisplay = document.querySelector(".group");
const groupchat = document.querySelector(".group_chat");
const group_title = document.querySelector(".group-title");
const groupBox = document.querySelector(".group-content");
const group_incoming = document.querySelector(".groups");
const groupsend = document.querySelector(".group-send");
const grouptext = document.querySelector(".group_text");
const archive_sec = document.querySelectorAll(".archive_sec");
const archived_chat = document.querySelector(".archived_chat");
const archived_title = document.querySelector(".archived-title");
const archived_content = document.querySelector(".archived-content");
const archived_incoming = document.querySelector(".archives");
const archived_send = document.querySelector(".archive-send");
const archived_text = document.querySelector(".archived_text");
const archive = document.querySelector('.archived');
const archivedheader = document.querySelector('.archived-header')
//const socket = io('http://localhost:8000/chatapp.html');


fetchProfilePicture()


document.addEventListener("DOMContentLoaded", () => {
  const userId = sessionStorage.getItem('user_id');
  if (userId) {
    fetchProfilePicture()
  } else {
    alert('User not logged in. Redirecting to login page.');
    window.location.href = '/Templates/Lyresignup.html';
  }

  const urlParams = new URLSearchParams(window.location.search);
  const userid = urlParams.get('Id');

  if (userid) {
    // Fetch and display user-specific data
    console.log(`Loading account for User ID: ${userid}`);
    // Add logic to fetch user data based on userId
  } else {
    console.error('User ID not provided in the URL');
  }

})

function fetchProfilePicture() {
  document.addEventListener('DOMContentLoaded', () => {
    const profilePictureElement = document.querySelector('.show_pic');
    const menuPictureElement = document.querySelector('.show-pic');
    if (!profilePictureElement) {
      console.error('Profile picture element not found in the DOM');
      return;
    }

    // Fetch the profile picture from the backend
    fetch('https://lyrecal.onrender.com:10000/api/users/profile-picture', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          // Set the profile picture's src to the returned file path
          profilePictureElement.src = `https://lyrecal.onrender.com:10000${data.filePath}`;
          menuPictureElement.src = `https://lyrecal.onrender.com:10000${data.filePath}`;
        } else {
          console.error('Error fetching profile picture:', data.message);
          // Set a default placeholder if fetching fails
          profilePictureElement.src = 'Public/static/default-avatar.jpg';
          menuPictureElement.src = 'Public/static/default-avatar.jpg';
        }
      })
      .catch((error) => {
        console.error('Error during profile picture fetch:', error);
        // Set a default placeholder if an error occurs
        profilePictureElement.src = 'Public/static/default-avatar.jpg';
        menuPictureElement.src = 'Public/static/default-avatar.jpg';
      });
  });
}

/*const dropdown_btn = document.querySelector(".Chatsection .chat_select div")
const dropdown = document.querySelector(".Chatsection .dropdown")

dropdown_btn.addEventListener("click", () => {
  dropdown.classList.toggle('activedrop')
})

document.querySelectorAll('.dropdown li a').forEach((item) => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
  })
})
*/

const searchBox = document.querySelector('.search-ipt');


const contactsList = document.querySelector('.contacts');
const chatContacts = document.querySelector('.Chatsection .col');

// Retrieve the authentication token
const authToken = sessionStorage.getItem('authToken');
console.log("Auth Token:", authToken);

// Set headers with token if available
const headers = {
  'Content-Type': 'application/json',
  ...(authToken && { 'Authorization': `Bearer ${authToken}` })
};

let currentChatUserId = null;

let openDropdown = null;

function displayChatContacts(contacts) {
  chatContacts.innerHTML = '';
  const aiContactHTML =
    `<div class="AI_chat">
      <img src="Public/clip_images/Lyredesign.png" alt="Lyre AI Logo" />
      <p>Lyre AI</p>s
    </div>`;
  
    chatContacts.innerHTML = aiContactHTML;
  contacts.forEach((contact, index) => {
    if (!contact.contact_id) {
      console.error('Missing contact.contact_id for:', contact);
      return;
    }

    const contactElement = document.createElement('div');
    contactElement.classList.add('profile');
    contactElement.setAttribute('data-chat-id', index);
    contactElement.setAttribute('data-contact-id', contact.contact_id);

    const profileImg = document.createElement('img');
    profileImg.src = contact.profilePicture || 'Public/static/default-avatar.jpg';
    profileImg.alt = '';
    contactElement.appendChild(profileImg);

    const displayName = document.createElement('p');
    displayName.textContent = contact.display_name;
    contactElement.appendChild(displayName);

    const contactInfo = document.createElement('h6');
    contactInfo.textContent = `${contact.country_code} ${contact.phone_number}`;
    contactElement.appendChild(contactInfo);

    const dropdownMenu = document.createElement('ul');
    dropdownMenu.classList.add('dropmenu');

    const archiveOption = document.createElement('li');
    archiveOption.textContent = 'Archive Chat';
    archiveOption.addEventListener('click', () => archiveChat(contact.contact_id));
    dropdownMenu.appendChild(archiveOption);

    const deleteOption = document.createElement('li');
    deleteOption.textContent = 'Delete Chat';
    deleteOption.addEventListener('click', () => deleteChat(contact.contact_id));
    dropdownMenu.appendChild(deleteOption);

    const menuIcon = document.createElement('span');
    menuIcon.classList.add('menuIcon');
    menuIcon.innerHTML= '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M8 256a56 56 0 1 1 112 0A56 56 0 1 1 8 256zm160 0a56 56 0 1 1 112 0 56 56 0 1 1 -112 0zm216-56a56 56 0 1 1 0 112 56 56 0 1 1 0-112z"/></svg>';

    menuIcon.addEventListener('click', () => {
      // Close any currently open dropdown
      if (openDropdown && openDropdown !== dropdownMenu) {
        openDropdown.classList.remove('activedropmenu');
      }

      // Toggle the current dropdown and update the tracker
      dropdownMenu.classList.toggle('activedropmenu');
      openDropdown = dropdownMenu.classList.contains('activedropmenu') ? dropdownMenu : null;
    });

    const menucontainer = document.createElement('div');
    menucontainer.classList.add('menucontainer');

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      if (!menucontainer.contains(event.target)) {
        dropdownMenu.classList.remove('activedropmenu');
        openDropdown = null;
      }
    });

    menuIcon.appendChild(dropdownMenu);
    menucontainer.appendChild(menuIcon);

    chatContacts.append(contactElement);
    chatContacts.append(menucontainer);
  });


  setupEventListeners(contacts);

  // Set up media query to handle responsive design
  const midWidth = window.matchMedia("(max-width: 600px)");
  handleWidthChange(midWidth); // Initial check
  midWidth.addEventListener("change", handleWidthChange);
}


// Function to set up click events for contacts and AI chat
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
      showContent()
      displayChat(chatId, contacts); // Pass chat index to display messages
      selectChatUser(contactId); // Handle contact selection by ID
    });
  });

  // Set up AI chat click event
  const aiChatElement = document.querySelector('.AI_chat');
  aiChatElement.addEventListener('click', () => {
    showAIContent();
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
        document.querySelector('.menubar').style.display = 'none'
        showChatContent()
      });
    });

    document.querySelector('.AI_chat').addEventListener('click', () => {
      column.classList.add("hidecolumn");
      searchBox.classList.add("hidesearch");
      ai_previous.style.display = 'block'
      document.querySelector('.menubar').style.display = 'none'
      showAIChatContent()

    });


    previous.addEventListener('click', () => {
      column.classList.remove("hidecolumn");
      searchBox.classList.remove("hidesearch");
      previous.style.display = 'none';
      resetActiveViews();
    });

    ai_previous.addEventListener('click', () => {
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
  document.querySelector('.menubar').style.display = 'none'
  Chatsection.classList.remove('active')
  Ai_box.classList.remove('activebox');
  display_chat.classList.add('activedisplay');
  archived_chat.classList.remove('active_archived');
}
function showContent() {
  document.querySelector('.menubar').style.display = 'none'
  Ai_box.classList.remove('activebox');
  display_chat.classList.add('activedisplay');
  archived_chat.classList.remove('active_archived');
}


// Utility function to display the AI chat view
function showAIChatContent() {
  Ai_box.classList.add('activebox');
  document.querySelector('.menubar').style.display = 'none'
  Chatsection.classList.remove('active')
  display_chat.classList.remove('activedisplay');
  archived_chat.classList.remove('active_archived');
  displayAIChat();
}
function showAIContent() {
  Ai_box.classList.add('activebox');
  document.querySelector('.menubar').style.display = 'none'
  display_chat.classList.remove('activedisplay');
  archived_chat.classList.remove('active_archived');
  displayAIChat();
}
// Utility function to reset active views
function resetActiveViews() {
  Chatsection.classList.add('active')
  display_chat.classList.remove('activedisplay');
  archived_chat.classList.remove('active_archived');
  Ai_box.classList.remove('activebox');
}


const displaydetail = document.querySelector(".displaydetail");
const displayheader = document.querySelector(".display-header");

// Display content for the selected contact
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
  displaypic.src = `${contact.profilePicture || 'Public/static/default-avatar.jpg'}`;
  displayheader.appendChild(displaypic);

  displaydetail.innerHTML = `<p>Chat with ${contact.display_name} (${contact.country_code}${contact.phone_number})</p>`;
}


const chatTitle = document.querySelector(".chat-header p");
const chatdetail = document.querySelector(".chatdetail");
let chat_header = document.querySelector(".chat-header");

function displayAIChat() {
  chatTitle.innerHTML = `Lyre AI`;

  // Clear only the existing AI image within chat_header, if present
  let existingImage = chat_header.querySelector("img");
  if (existingImage) {
    chat_header.removeChild(existingImage);
  }

  // Add the new AI profile image
  const chatpic = document.createElement("img");
  chatpic.src = "Public/clip_images/Lyredesign.png";
  chat_header.appendChild(chatpic);

  chatdetail.innerHTML = `<p>Welcome to Lyre AI chat.</p>`;
}



function toggleProfilePointerEvents(enable) {
  const profiles = document.querySelectorAll('.profile');
  profiles.forEach(profile => {
    profile.style.pointerEvents = enable ? 'auto' : 'none';
  });
}

document.querySelectorAll('.menuIcon').forEach(menuIcon => {
  const dropdownMenu = menuIcon.querySelector('.activemenu');

  menuIcon.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent closing when clicking inside the dropdown
    const isVisible = dropdownMenu.style.display === 'block';
    // Close all other dropdowns
    document.querySelectorAll('.activemenu').forEach(menu => (menu.style.display = 'none'));

    // Toggle visibility of the current dropdown
    dropdownMenu.style.display = isVisible ? 'none' : 'block';

    // Adjust pointer events based on dropdown visibility
    toggleProfilePointerEvents(!dropdownMenu.style.display === 'block');
  });

  dropdownMenu.addEventListener('pointerenter', () => {
    toggleProfilePointerEvents(false); // Ensure `.profile` is disabled when hovering on `.dropmenu`
  });

  dropdownMenu.addEventListener('pointerleave', () => {
    toggleProfilePointerEvents(true); // Re-enable `.profile` interaction when leaving `.dropmenu`
  });

  dropdownMenu.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent clicks from propagating to the document
  });
});

// Close dropdown when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.activemenu').forEach(menu => (menu.style.display = 'none'));
  toggleProfilePointerEvents(true);
});



function archiveChat(contact_id) {
  fetch('https://lyrecal.onrender.com:10000/api/archived', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
    },
    body: JSON.stringify({ contact_id }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((data) => {
          if (data.error === 'Contact is already archived') {
            alert('This contact is already archived.');
          }
          throw new Error(data.error || 'Failed to archive contact');
        });
      }
      return response.json();
    })
    .then((data) => {
      console.log('Contact archived successfully:', data.message);
      refreshChatContacts();
      refreshArchivedContacts();
    })
    .catch((error) => console.error('Error archiving contact:', error));
}

function refreshArchivedContacts() {
  fetch('https://lyrecal.onrender.com:10000/api/archived', {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch archived contacts');
      }
      return response.json();
    })
    .then((data) => {
      if (data.archived) {
        displayArchivedContacts(data.archived);
        setupArchivedEventListeners(data.archived); // Attach click handlers
      }
    })
    .catch((error) => console.error('Error fetching archived contacts:', error));
}

let openArchiveDropdown = null;

function displayArchivedContacts(archivedContacts) {
  const archivedListContainer = document.querySelector('.archive_col');
  archivedListContainer.innerHTML = ''; // Clear previous archived contacts

  
archivedContacts.forEach((contact) => {
  const archiveDiv = document.createElement('div');
  archiveDiv.classList.add('archive_sec');
  archiveDiv.dataset.contactId = contact.contact_id;

  const img = document.createElement('img');
  img.src = contact.profilePicture || 'Public/static/default-avatar.jpg.png';
  archiveDiv.appendChild(img);

  const name = document.createElement('p');
  name.textContent = contact.display_name;
  archiveDiv.appendChild(name);

  const phone = document.createElement('span');
  phone.classList.add('phone');
  phone.textContent = `${contact.country_code}${contact.phone_number}`;
  archiveDiv.appendChild(phone);

  const DropdownMenu = document.createElement('ul');
  DropdownMenu.classList.add('droparchive');

  const unarchiveOption = document.createElement('li');
  unarchiveOption.classList.add('unarchive');
  unarchiveOption.textContent = 'Unarchive';
  unarchiveOption.addEventListener('click', () => unarchiveChat(contact.contact_id)); // Adjusted to unarchive functionality
  DropdownMenu.appendChild(unarchiveOption);

  const MenuIcon = document.createElement('span');
  MenuIcon.classList.add('MenuIcon');
  MenuIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M8 256a56 56 0 1 1 112 0A56 56 0 1 1 8 256zm160 0a56 56 0 1 1 112 0 56 56 0 1 1 -112 0zm216-56a56 56 0 1 1 0 112 56 56 0 1 1 0-112z"/></svg>';

  // Event listener for toggling dropdown and closing others
  MenuIcon.addEventListener('click', () => {
    // Close any currently open dropdown
    if (openArchiveDropdown && openArchiveDropdown !== DropdownMenu) {
      openArchiveDropdown.classList.remove('activedroparchive');
    }

    // Toggle the current dropdown and update the tracker
    DropdownMenu.classList.toggle('activedroparchive');
    openArchiveDropdown = DropdownMenu.classList.contains('activedroparchive') ? DropdownMenu : null;
  });

  const archivecontainer = document.createElement('div');
  archivecontainer.classList.add('archivecontainer');

  // Close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    if (!archivecontainer.contains(event.target)) {
      DropdownMenu.classList.remove('activedroparchive');
      openArchiveDropdown = null;
    }
  });

  MenuIcon.appendChild(DropdownMenu);
  archivecontainer.appendChild(MenuIcon);

  archivedListContainer.appendChild(archivecontainer);
  archivedListContainer.appendChild(archiveDiv);
});

  const archivedWidth = window.matchMedia("(max-width: 600px)");
  handleArchivedWidthChange(archivedWidth); // Initial check
  archivedWidth.addEventListener("change", handleArchivedWidthChange);
}

function setupArchivedEventListeners(archivedContacts) {
  const elements = document.querySelectorAll('.archive_sec');
  console.log(`Attaching listeners to ${elements.length} archive_sec elements`);

  elements.forEach((archivedElement) => {
    archivedElement.addEventListener('click', () => {
      const contactId = parseInt(archivedElement.dataset.contactId, 10);

      if (isNaN(contactId)) {
        console.error('Invalid data attributes:', { contactId });
        return;
      }

      console.log(`Archived Contact ID: ${contactId}`); // Debug log
      selectChatUser(contactId, true); // Set as archived user
      displayArchivedChat(contactId, archivedContacts); // Display archived chat
    });
  });
}

function displayArchivedChat(contactId, archivedContacts) {
  const contact = archivedContacts.find((c) => c.contact_id === contactId);
  if (!contact) {
    console.error(`No archived contact found for ID: ${contactId}`);
    return;
  }

  
  archivedheader.innerHTML = '';

  // Add the new title
  const archived_title = document.createElement("p");
  archived_title.innerHTML = `${contact.display_name}`;
  archivedheader.appendChild(archived_title);

  // Clear and set the profile image
  const archivedpic = document.createElement('img');
  archivedpic.src = `${contact.profilePicture || 'Public/static/default-avatar.jpg'}`;
  archivedheader.appendChild(archivedpic);

  // Update chat details
  const archivedetail = document.querySelector('.archivedetail');
  archivedetail.innerHTML = `<p>Chat with ${contact.display_name} (${contact.country_code}${contact.phone_number})</p>`;

  // Adjust class names to show archived chat box
  resetActiveview();
  archived_chat.classList.add('active_archived');
}


function refreshChatContacts() {
  fetch('https://lyrecal.onrender.com:10000/api/contacts', {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      return response.json();
    })
    .then((data) => {
      if (data.contacts) {
        displayArchivedContacts(data.contacts);
        setupArchivedEventListeners(data.contacts); // Add event listeners after rendering
      }
    })
    .catch((error) => console.error('Error fetching contacts:', error));
}

function resetActiveview() {

  display_chat.classList.remove('activedisplay');
  archived_chat.classList.remove('active_archived');
  Ai_box.classList.remove('activebox');
}

function handleArchivedWidthChange(e) {
  const searchBox = document.querySelector('.column2 .search');
  const previous = document.querySelector('.archive_previous');
  const archivecol = document.querySelector('.column');

  if (e.matches) { // Screen width is 600px or less
    document.querySelectorAll('.archive_sec').forEach((archivedElement) => {
      archivedElement.addEventListener('click', () => {
        archive.classList.remove('active')
        archivecol.classList.add('hidecolumn');
        searchBox.classList.add('hidesearch');
        previous.style.display = 'block';
        showArchivedChatContent();
      });
    });

    previous.addEventListener('click', () => {
      archivecol.classList.remove('hidecolumn');
      searchBox.classList.remove('hidesearch');
      archive.classList.add('active')
      previous.style.display = 'none';
      resetActiveview();
    });
  } else {
    console.log('Screen size is larger than 600px');
  }
}

function showArchivedChatContent() {
  resetActiveview();
  archived_chat.classList.add('active_archived');
}
document.addEventListener('DOMContentLoaded', () => {
  refreshArchivedContacts();
});

document.addEventListener('click', (event) => {
  if (event.target.classList.contains('.unarhive')) {
    const contactElement = event.target.closest('.MenuIcn');
    if (contactElement) {
      const contact_id = contactElement.dataset.contactId; // Get the contact ID
      unarchiveChat(contact_id); // Call the unarchive function
    }
  }
});

// Unarchive contact logic
function unarchiveChat(contact_id) {
  fetch('https://lyrecal.onrender.com:10000/api/unarchive', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
    },
    body: JSON.stringify({ contact_id }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((data) => {
          throw new Error(data.error || 'Failed to unarchive contact');
        });
      }
      return response.json();
    })
    .then((data) => {
      console.log('Contact unarchived successfully:', data.message);

      // Remove the contact from the archived list
      const archivedElement = document.querySelector(
        `.archive_sec[data-contact-id="${contact_id}"]`
      );
      if (archivedElement) {
        archivedElement.remove();
      }

      // Add the contact back to the chat contacts section
      addToChatContacts(data.contact);
      refreshChatContacts(); // Optionally refresh the chat contacts
    })
    .catch((error) => console.error('Error unarchiving contact:', error));
}

// Function to add the unarchived contact to the chat contacts
function addToChatContacts(contact) {
  const chatListContainer = document.querySelector('.chat-contacts'); // Ensure this container exists

  const contactDiv = document.createElement('div');
  contactDiv.classList.add('profile');
  contactDiv.dataset.contactId = contact.contact_id;

  const img = document.createElement('img');
  img.src = contact.profilePicture || 'Public/static/default-avatar.jpg';

  const details = document.createElement('div');
  details.classList.add('details');

  const name = document.createElement('h4');
  name.textContent = contact.display_name;

  const phone = document.createElement('p');
  phone.textContent = `${contact.country_code}${contact.phone_number}`;

  details.appendChild(name);
  details.appendChild(phone);

  contactDiv.appendChild(img);
  contactDiv.appendChild(details);

  chatListContainer.appendChild(contactDiv);

  // Add an event listener to handle contact selection
  contactDiv.addEventListener('click', () => {
    selectChatUser(contact.contact_id, false); // Function to show chat details
  });
}



// Chat Section
const chatSendBtn = document.querySelector(".chat-send");
const chatTextInput = document.querySelector(".display_text");
const chatMessageContainer = document.querySelector(".display-content");

// Archived Section
const archiveSendBtn = document.querySelector(".archive-send");
const archivedTextInput = document.querySelector(".archived_text");
const archivedMessageContainer = document.querySelector(".archived-content");

// Initialize Socket.IO and User ID
const socket = io.connect('https://lyrecal.onrender.com');
const userId = sessionStorage.getItem('user_id');

if (userId) {
  console.log('Rejoining as user:', userId);
  socket.emit('join', userId);
} else {
  console.error('User ID not found in sessionStorage');
}

// Handle Connection Events
socket.on('connect', () => console.log('Connected to the server:', socket.id));
socket.on('disconnect', () => console.log('Disconnected from the server'));

// Chat Functions
const chatFunctions = {
  currentChatUserId: null,

  createMessageElement(message, isOutgoing) {
    const messageElement = document.createElement('li');
    messageElement.classList.add('display', isOutgoing ? 'exit' : 'incoming');
    messageElement.textContent = message;
    return messageElement;
  },

  displayMessage(message, isOutgoing) {
    const messageElement = this.createMessageElement(message, isOutgoing);
    chatMessageContainer.appendChild(messageElement);
    chatMessageContainer.scrollTop = chatMessageContainer.scrollHeight;
  },

  async fetchChatHistory(contactId) {
    try {
      const response = await fetch(`/api/messages/${contactId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        chatMessageContainer.innerHTML = ''; // Clear existing messages
        data.messages.forEach((msg) => {
          const isSender = msg.senderId === parseInt(userId, 10);
          this.displayMessage(msg.content, isSender);
        });
      } else {
        console.error('Failed to fetch chat history.');
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  },

  sendMessage() {
    const message = chatTextInput.value.trim();
    if (!message || !this.currentChatUserId) return;

    const data = {
      senderId: parseInt(userId, 10),
      receiverId: this.currentChatUserId,
      message,
    };

    socket.emit('sendMessage', data);
    this.displayMessage(message, true);
    chatTextInput.value = ''; // Clear input field
  },
};

// Archived Functions
const archiveFunctions = {
  currentArchivedUserId: null,

  createMessageElement(message, isOutgoing) {
    const messageElement = document.createElement('li');
    messageElement.classList.add('archives', isOutgoing ? 'exit' : 'incoming');
    messageElement.textContent = message;
    return messageElement;
  },

  displayMessage(message, isOutgoing) {
    const messageElement = this.createMessageElement(message, isOutgoing);
    archivedMessageContainer.appendChild(messageElement);
    archivedMessageContainer.scrollTop = archivedMessageContainer.scrollHeight;
  },

  async fetchHistory(contactId) {
    try {
      const response = await fetch(`https://lyrecal.onrender.com:10000/api/archived-messages/${contactId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        archivedMessageContainer.innerHTML = ''; // Clear existing messages
        data.messages.forEach((msg) => {
          const isSender = msg.senderId === parseInt(userId, 10);
          this.displayMessage(msg.content, isSender);
        });
      } else {
        console.error('Failed to fetch archived chat history.');
      }
    } catch (error) {
      console.error('Error fetching archived chat history:', error);
    }
  },

  sendMessage() {
    const message = archivedTextInput.value.trim();
    if (!message || !this.currentArchivedUserId) return;

    const data = {
      senderId: parseInt(userId, 10),
      receiverId: this.currentArchivedUserId,
      message,
    };

    socket.emit('sendArchivedMessage', data);
    this.displayMessage(message, true);
    archivedTextInput.value = ''; // Clear input field
  },
};

// Set event listener for chat send
chatSendBtn.addEventListener('click', () => {
  chatFunctions.sendMessage();
});

archiveSendBtn.addEventListener('click', () => {
  archiveFunctions.sendMessage();
});

socket.on('messageReceived', (data) => {
  if (data.receiverId === parseInt(userId, 10)) {
    // Determine if it’s an archived chat or regular chat
    if (data.isArchived) {
      archiveFunctions.displayMessage(data.message, false);
    } else {
      chatFunctions.displayMessage(data.message, false);
    }
  }
});

socket.on('archiveMessageReceived', (data) => {
  if (data.receiverId === parseInt(userId, 10)) {
    archiveFunctions.displayMessage(data.message, false);
  }
});

// Chat User Selection

archiveSendBtn.disabled = true;

function selectChatUser(contactId, isArchived = false) {
  if (!contactId) {
    console.error('No contact selected.');
    return;
  }

  if (isArchived) {
    archiveFunctions.currentArchivedUserId = contactId;
    archiveSendBtn.disabled = false;
    archiveFunctions.fetchHistory(contactId);
  } else {
    chatFunctions.currentChatUserId = contactId;
    chatFunctions.fetchChatHistory(contactId);
  }
}

// Listen for new contact event from the backend
socket.on('newContact', (newContact) => {
  if (!newContact.contact_id) {
    console.error('Missing contact.contact_id for:', newContact);
    return;
  }

  socket.on('newContact', (newContact) => {
    console.log('New contact data:', newContact);

    if (!newContact.contact_id) {
      console.error('Missing contact.contact_id for:', newContact);
      return;
    }

    const contactElement = document.createElement('div');
    contactElement.classList.add('profile');
    contactElement.setAttribute('data-chat-id', Date.now());
    contactElement.setAttribute('data-contact-id', newContact.contact_id);

    // Create profile image
    const profileImg = document.createElement('img');
    profileImg.src = newContact.profilePicture || 'Public/static/default-avatar.jpg'; // Ensure default-profile.png is in the correct path
    profileImg.alt = newContact.display_name || 'Unnamed Contact';
    profileImg.onerror = () => {
      // Handle broken image fallback
      profileImg.src = 'Public/static/default-avatar.jpg';
    };
    contactElement.appendChild(profileImg);

    const displayName = document.createElement('p');
    displayName.textContent = newContact.display_name || 'Unnamed Contact';
    contactElement.appendChild(displayName);

    const contactInfo = document.createElement('h6');
    contactInfo.textContent = `${newContact.country_code || ''} ${newContact.phone_number || 'Unknown'}`;
    contactElement.appendChild(contactInfo);

    const dropdownMenu = document.createElement('ul');
    dropdownMenu.classList.add('dropmenu');

    const archiveOption = document.createElement('li');
    archiveOption.textContent = 'Archive Chat';
    archiveOption.addEventListener('click', () => archiveChat(newContact.contact_id));
    dropdownMenu.appendChild(archiveOption);

    const deleteOption = document.createElement('li');
    deleteOption.textContent = 'Delete Chat';
    deleteOption.addEventListener('click', () => deleteChat(newContact.contact_id));
    dropdownMenu.appendChild(deleteOption);

    const menuIcon = document.createElement('span');
    menuIcon.classList.add('menuIcon');
    menuIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M8 256a56 56 0 1 1 112 0A56 56 0 1 1 8 256zm160 0a56 56 0 1 1 112 0 56 56 0 1 1 -112 0zm216-56a56 56 0 1 1 0 112 56 56 0 1 1 0-112z"/></svg>';
    menuIcon.addEventListener('click', () => {
      dropdownMenu.classList.toggle('activedrop')
      contactElement.style.pointerEvents = 'none';
    });
    const menucontainer = document.createElement('div');
    menucontainer.classList.add('menucontainer');

    menuIcon.appendChild(dropdownMenu);

    menucontainer.appendChild(menuIcon)

    const chatContacts = document.querySelector('.Chatsection .col');
    chatContacts.append(contactElement, menucontainer);
  });
})

let searchTimeout; // Timer for debouncing

function handleSearch(e) {
  const query = e.target.value.trim();

  // Clear the search results immediately if the input is empty
  if (!query) {
    contactsList.innerHTML = ''; // Clear search results
    contactsList.classList.remove('activecontact'); // Hide active class
    clearTimeout(searchTimeout); // Cancel any pending debounce action
    return;
  }

  // Debounce: Cancel previous timeout if still typing
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetch(`https://lyrecal.onrender.com:10000/api/contacts/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: headers,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);
        return response.json();
      })
      .then((data) => {
        // Ensure the input hasn't been cleared while waiting for the API
        if (!e.target.value.trim()) {
          contactsList.innerHTML = ''; // Clear any leftover results
          contactsList.classList.remove('activecontact'); // Hide active class
          return;
        }

        console.log('Search API data:', data);

        // Clear previous search results
        contactsList.innerHTML = '';

        if (data.contacts.length === 0) {
          contactsList.innerHTML = '<p>No contacts found</p>';
          return;
        }

        // Create and append contacts dynamically
        data.contacts.forEach((contact) => {
          const contactElement = document.createElement('div');
          contactElement.classList.add('contact');
          contactElement.dataset.contactId = contact.id;

          contactElement.innerHTML = `
          <img src="${contact.profilePicture}" alt="" />
            <p>${contact.display_name}</p>
            <span>${contact.country_code}${contact.phone_number}</span>
            <h3 class="add-contact-btn" data-contact-id="${contact.id}">Add</h3>
          `;

          // Add the contact element to the list
          contactsList.appendChild(contactElement);
        });

        // Attach click listeners to "Add" buttons
        document.querySelectorAll('.add-contact-btn').forEach((btn) => {
          btn.addEventListener('click', handleAddContact);
        });

        // Activate the contact list container
        contactsList.classList.add('activecontact');
      })
      .catch((error) => {
        console.error('Error fetching contacts:', error);
        contactsList.innerHTML = '<p>Error loading search results. Please try again later.</p>';
      });
  }, 300); // 300ms debounce delay
}

searchBox.addEventListener('input', handleSearch);

function handleAddContact(e) {
  const contact_id = e.target.dataset.contactId;
  const authToken = sessionStorage.getItem('authToken');

  if (!authToken) {
    console.error("Error: Auth token is missing. Please log in.");
    return;
  }

  if (!contact_id) {
    console.error("Error: contact_id is undefined");
    return;
  }

  fetch('https://lyrecal.onrender.com:10000/api/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ contact_id })
  })
    .then(response => {
      console.log("Raw response:", response);
      if (!response.ok) {
        if (response.status === 409) {
          alert('This contact is already in your list.');
          return;
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Contact added successfully:", data);
      loadUserContacts(); // Reload the contact list
    })
    .catch(error => {
      console.error('Error adding contact:', error.message || error);
      alert('Failed to add contact. Please try again.');
    });
}

function loadUserContacts() {
  const authToken = sessionStorage.getItem('authToken');

  if (!authToken) {
    console.error("Error: Auth token is missing. Please log in.");
    return;
  }

  fetch('https://lyrecal.onrender.com:10000/api/contacts', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  })
    .then(response => {
      console.log("Raw response:", response);
      if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);
      return response.json();
    })
    .then(data => {
      console.log('User contacts:', data);
      displayChatContacts(data.contacts); // Display contacts in the UI
      console.log(contacts);
    })
    .catch(error => {
      console.error('Error fetching user contacts:', error.message || error);

    });
}



// Load all contacts on page load
document.addEventListener('DOMContentLoaded', loadUserContacts);


function deleteChat(contact_id) {
  fetch('https://lyrecal.onrender.com:10000/api/delete-chat', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contact_id }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        console.log(data.message);
        // Remove the deleted contact from the chat list
        const contactElement = document.querySelector(`[data-contact-id="${contact_id}"]`);
        const menuElement = document.querySelector('.menuIcon');
        if (contactElement) {
          contactElement.remove();
          menuElement.remove()
        }
      } else if (data.error) {
        console.error('Error deleting chat:', data.error);
      }
    })
    .catch((error) => console.error('Error deleting chat:', error));
}



document.addEventListener('DOMContentLoaded', () => {
  const feedbackModal = document.getElementById('feedbackModal');
  const feedbackButton = document.querySelector('.column .icons .feed-btn');
  const feedbackBox = document.querySelector('.menubar .icon .feed_btn');
  const closeModal = document.querySelector('.close-modal');
  const feedbackForm = document.getElementById('feedbackForm');

  // Open feedback modal
  feedbackButton.addEventListener('click', () => {
    feedbackModal.style.display = 'flex';
  });

  feedbackBox.addEventListener('click', () => {
    feedbackModal.style.display = 'flex';
  });

  // Close feedback modal
  closeModal.addEventListener('click', () => {
    feedbackModal.style.display = 'none';
  });

  // Submit feedback
  feedbackForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedbackMessage = document.getElementById('feedbackMessage').value;

    try {
      const response = await fetch('https://lyrecal.onrender.com:10000/api/feedback', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: feedbackMessage }),
      });

      if (response.ok) {
        alert('Feedback sent successfully!');
        feedbackModal.style.display = 'none';
        feedbackForm.reset();
      } else {
        alert('Failed to send feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      alert('An error occurred. Please try again later.');
    }
  });
});


document.querySelector('.set_content .delete_acc').addEventListener('click', async () => {
  const userId = sessionStorage.getItem('user_id'); // Fetch the logged-in user's ID
  const authToken = sessionStorage.getItem('authToken'); // Fetch the auth token

  if (!userId || !authToken) {
    alert('You must be logged in to delete your account.');
    return;
  }

  const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.');

  if (!confirmDelete) {
    return;
  }

  try {
    const response = await fetch(`https://lyrecal.onrender.com:10000/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`, // Include the token for authentication
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      alert('Your account has been deleted successfully.');
      sessionStorage.clear(); // Clear session data
      window.location.href = 'Public/Templates/lyresignup'; // Redirect to signup page
    } else {
      const data = await response.json();
      alert(`Error: ${data.message || 'Failed to delete account'}`);
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    alert('An error occurred while deleting your account. Please try again later.');
  }
});



document.querySelector('.set_content .Logout').addEventListener('click', () => {
  // Clear sessionStorage (or localStorage if that's where you're saving tokens)
  sessionStorage.clear();

  logout()
  window.location.href = 'Public/Templates/lyresignup.html'; // or 'login.html', based on your use case
});
// Event listener for change picture button
document.querySelector('.change_pic').addEventListener('click', () => {
  document.querySelector('.newProfilePic').click();
});


function logout() {
  // Remove authentication token and any user-specific data
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('userId'); // Assuming you're storing the userId
  sessionStorage.clear(); // Clear all session-specific data
}

fetch('https://lyrecal.onrender.com:10000/api/validate-session', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
  }
})
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Session validated:', data.userId);
    } else {
      console.error('Invalid session.');
      logout(); // Clear data and redirect to login
    }
  })
  .catch(error => console.error('Error validating session:', error));


// Event listener for file input change
document.querySelector('.newProfilePic').addEventListener('change', function () {
  const file = this.files[0]; // Get the selected file

  if (file) {
    const formData = new FormData();
    formData.append('profilePicture', file);
    formData.append('id', sessionStorage.getItem('user_id')); // Include user ID from localStorage

    fetch('https://lyrecal.onrender.com:10000/api/users/upload-profile-picture', {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(data.message);
          // Update the profile picture display
          document.querySelector('.show_pic').src = data.filePath;
          document.querySelector('.show-pic').src = data.filePath;
        } else {
          alert('Failed to update profile picture: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating your profile picture.');
      });
  }
});

// Elements
const inviteButton = document.querySelector('.set_content .invite');
const inviteModal = document.querySelector('.invite-modal');
const closeInviteButton = document.querySelector('.close-invite');
const inviteForm = document.getElementById('inviteForm');

// Open modal
inviteButton.addEventListener('click', () => {
  inviteModal.classList.remove('hidden');
});

// Close modal
closeInviteButton.addEventListener('click', () => {
  inviteModal.classList.add('hidden');
});

// Handle form submission
inviteForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('inviteEmail').value;

  fetch('https://lyrecal.onrender.com:10000/api/invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert('Invite sent successfully!');
        inviteModal.classList.add('hidden');
      } else {
        alert('Failed to send invite. Please try again.');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('An error occurred while sending the invite.');
    });
});