const sendBtn = document.querySelector(".chat-input span")
const inputBtn = document.querySelector(".chat-input textarea")
const chatbox = document.querySelector(".chatsbox")



let chat;
const API_KEY = "9860e058aaf64aa48507540d4286e1f9";
//sk-None-KBLTk8YFhhjfVxadapgvT3BlbkFJhZOAosDsai8g4cYM

const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className)
    let chatContent = className === "outgoing" ? `<p>${message}</p>` : `<span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="rgba(0,0,0,1)"><path d="M13.5 2C13.5 2.44425 13.3069 2.84339 13 3.11805V5H18C19.6569 5 21 6.34315 21 8V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18V8C3 6.34315 4.34315 5 6 5H11V3.11805C10.6931 2.84339 10.5 2.44425 10.5 2C10.5 1.17157 11.1716 0.5 12 0.5C12.8284 0.5 13.5 1.17157 13.5 2ZM6 7C5.44772 7 5 7.44772 5 8V18C5 18.5523 5.44772 19 6 19H18C18.5523 19 19 18.5523 19 18V8C19 7.44772 18.5523 7 18 7H13H11H6ZM2 10H0V16H2V10ZM22 10H24V16H22V10ZM9 14.5C9.82843 14.5 10.5 13.8284 10.5 13C10.5 12.1716 9.82843 11.5 9 11.5C8.17157 11.5 7.5 12.1716 7.5 13C7.5 13.8284 8.17157 14.5 9 14.5ZM15 14.5C15.8284 14.5 16.5 13.8284 16.5 13C16.5 12.1716 15.8284 11.5 15 11.5C14.1716 11.5 13.5 12.1716 13.5 13C13.5 13.8284 14.1716 14.5 15 14.5Z"></path></svg></span><p>${message}</p>`
    chatLi.innerHTML = chatContent;
    
    return chatLi;
}

const generateResponse = (ChatLi) => {
    const API_URL = "https://api.aimlapi.com/v1/chat/completions";
    const messageElement = ChatLi.querySelector("p");

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            "model": "gpt-3.5-turbo",
            "messages": [
                { "role": "system", "content": "You are a helpful assistant." },
                { "role": "user", "content": chat } // Include the user's input here
            ],
            "temperature": 0.7,
            "max_tokens": 512,
            "stream": false
        })
    };

    fetch(API_URL, requestOptions)
        .then(res => res.json())
        .then(data => {
            // Display the response content
            if (data.choices && data.choices[0] && data.choices[0].message) {
                messageElement.textContent = data.choices[0].message.content;
            } else {
                messageElement.textContent = "No response available. Try again.";
            }
        })
        .catch((error) => {
            messageElement.textContent = "Oops! Something went wrong. Please try again.";
            console.error("Error:", error);
        });
};



sendBtn.addEventListener("click", function() {
    chat = inputBtn.value.trim();
    inputBtn.value = "";
    reTurn()
})
function reTurn() {
    if(!chat) return;
    
    chatbox.appendChild(createChatLi(chat, "outgoing"))

    setTimeout(() => {
        const ChatLi = createChatLi("Thinking...", "incoming")
        chatbox.appendChild(ChatLi)
        generateResponse(ChatLi);
    }, 600);
}

