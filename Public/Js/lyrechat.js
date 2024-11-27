const chatbtn = document.querySelector(".chatbtn");
const chat_section = document.querySelector(".Chatsection");
const groupbtn = document.querySelector(".groupbtn");
const verified_btn = document.querySelector(".verified-btn");
const archive_btn = document.querySelector(".archived-btn");
const groupbox = document.querySelector(".group")
const archivebox = document.querySelector(".archived")
const chat_box = document.querySelector(".profile")
const proFile3 = document.querySelector(".profile3")
const proFile4 = document.querySelector(".profile4")
const proFile5 = document.querySelector(".profile5")
const proFile6 = document.querySelector(".profile6")
const Chats_box = document.querySelector(".incoming")
const lightBox = document.querySelector(".lightbox")
const colBox = document.querySelector(".col-box")
const colBox1 = document.querySelector(".col-box1")
const sections = document.querySelectorAll(".section")
const chatsec = document.querySelector('.chat_btn')
const archivebtn = document.querySelector('.menubar .icon .archived_btn')
const menubox = document.querySelector('.menubutton');
const menubar = document.querySelector('.menubar');
const menu = document.querySelector('.menubox')


chat_section.classList.toggle("active");



chatbtn.addEventListener("click", () => {
  hideAllSections();
  chat_section.classList.toggle("active");
})

chatsec.addEventListener("click", () => {
  hideAllSections();
  chat_section.classList.toggle("active");
  menubar.style.display = 'none';
})
archive_btn.onclick = () => {
  hideAllSections()
  archivebox.classList.toggle("active")
}

archivebtn.onclick = () => {
  hideAllSections()
  archivebox.classList.toggle("active")
  menubar.style.display = 'none';
}

function hideAllSections() {
  sections.forEach((section) => {
    section.classList.remove("active")
  });


}

document.querySelector('.column2').onclick = () => {
  menubar.style.display = 'none'
}


menubox.onclick = () => {
    menubar.style.display = 'block'
}

menu.onclick = () => {
  menubar.style.display = 'none'
}

const settingbtn = document.querySelector('.settings')
const setting_btn = document.querySelector(".setting");
const set_content = document.querySelector(".setting_box");
const exitbtn = document.querySelector(".exit-btn");
const drop_down = document.querySelector(".dropdown");


settingbtn.addEventListener("click", () => {
  set_content.classList.toggle("activeset");
  menubar.style.display = 'none';
  //document.querySelector('.activeset').style.display = 'block';
})

setting_btn.addEventListener("click", () => {
  set_content.classList.toggle("activeset");
  //document.querySelector('.activeset').style.display = 'block';
})
exitbtn.addEventListener("click", () => {
  set_content.classList.remove("activeset");
})

const topContacts = document.querySelector('.search .contacts');
const undersection = document.querySelector('.Chatsection .active');
const undergroup = document.querySelector('.group .active');
const underarchive = document.querySelector('.archived .active');

function disableUnderContainer() {
  if (undersection) undersection.style.pointerEvents = 'none';
  if (undergroup) undergroup.style.pointerEvents = 'none';
  if (underarchive) underarchive.style.pointerEvents = 'none';
}

function enableUnderContainer() {
  if (undersection) undersection.style.pointerEvents = 'auto';
  if (undergroup) undergroup.style.pointerEvents = 'auto';
  if (underarchive) underarchive.style.pointerEvents = 'auto';
}

// Set up event listeners only if topContacts exists
if (topContacts) {
  topContacts.addEventListener('mouseenter', disableUnderContainer);
  topContacts.addEventListener('mouseleave', enableUnderContainer);
} else {
  console.warn("topContacts element not foud, event listeners not added.");
}



