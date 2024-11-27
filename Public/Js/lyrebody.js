const group__display = document.querySelector(".group")
const group_profile = document.querySelectorAll(".group_display")
const profile = document.querySelectorAll(".profile")
const display_chats = document.querySelector(".display-chat");
const Ai_chats = document.querySelector(".ai-chat")
const chat_btn = document.querySelector(".chatbtn")
const ai_chats = document.querySelector(".chat-box")
const group_btn = document.querySelector(".groupbtn")
const archiveBtn = document.querySelector(".archived-btn")
const colbox1 = document.querySelector(".col-box1")
const sectionchat = document.querySelector(".Chatsection")
const groupchats = document.querySelector(".group_chat");
const archivedbox = document.querySelector(".archived_chat");

const mediawidth = window.matchMedia("(max-width: 600px)");

mediawidth.addEventListener("change", handleMediaQueryChange);

function handleMediaQueryChange(Event) {
    if (Event.matches) {
        chat_btn.addEventListener("click", () => {
            display_chats.classList.remove("activedisplay")
            ai_chats.classList.remove("activebox");
            groupchats.classList.remove("activegroup");
            archivedbox.classList.remove("active_archived")
        })
        archiveBtn.addEventListener("click", () => {
            archivedbox.classList.remove("active_archived")
            display_chats.classList.remove("activedisplay")
            ai_chats.classList.remove("activebox");
            groupchats.classList.remove("activegroup");
        })
        /*document.querySelectorAll('.picture').addEventListener('click', () => {
            archivedbox.classList.remove("active_archived")
            display_chats.classList.remove("activedisplay")
            ai_chats.classList.remove("activebox");
            groupchats.classList.remove("activegroup");
        })*/
        console.log("media query is true")
    } else {
        console.log("Media query is false")
    }
}