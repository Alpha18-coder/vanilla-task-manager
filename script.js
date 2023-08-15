const $ = (selector, el=document) => el.querySelector(selector);

const searchContainer = $('.search-container');
const addBtn = $('.add-btn');
const taskUL = $('.table__tasks');
const overlay = $('.overlay');
const taskForm = $('.task-form');
const filterCol = $('.filters');

const dropdownContainer = $('.dropdown__container', filterCol);
const filterBtn = $('.filter-btn', dropdownContainer);
const filterDropdown = $('.filters__dropdown', dropdownContainer);

const inputs = taskForm.querySelectorAll('input, textarea');
const colors = Array.from($('.color-container').children);
const filterOptions = Array.from(filterDropdown.querySelectorAll('li'));

let taskList = JSON.parse(localStorage.getItem('tasklist')) || [];
let viewMode;

renderList(taskList);

// MODAL
function openModal(){
    taskForm.reset();
    const newOverlay = overlay.classList.add('active'); 
    taskForm.onclick = function(event) {
        event.stopPropagation(); // prevent click event from bubbling up
    } 
    return newOverlay;  
}

function closeModal() {
    const newOverlay = overlay.classList.remove('active');
    return newOverlay;
}

overlay.onclick = closeModal;

// DROPDOWNS

function openDropdown(dropdown) {
    if(!dropdown.classList.contains('active') && dropdown !== null){
        dropdown.classList.add('active');
    }

    if(dropdown.classList.contains('active')){
        function handleCloseDropdown(event) {
            if(!event.target.closest('.dropdown')) {
                closeDropdown(dropdown);
                document.body.removeEventListener('click', handleCloseDropdown, true);
            }
        }
        document.body.addEventListener('click', handleCloseDropdown, true);
    }
};

function closeDropdown(dropdown){
    if(dropdown !== null){
        dropdown.classList.remove('active');
    }
}

function normalDropdown (id) { return `
    <li onclick="CRUD.edit(${id})">
        <span>edit</span>
        <ion-icon name="create"></ion-icon>
    </li>
    <li onclick="CRUD.delete(${id})">
        <span>delete</span>
        <ion-icon name="trash"></ion-icon>
    </li>
    <li onclick="showDescription(${id})">
        <span>show desc.</span>
        <ion-icon name="document-text"></ion-icon>
    </li>
`}

function editDropdown (id) {
    return `
    <li onclick="updateTask(${id});">
        <span>save</span>
        <ion-icon name="save"></ion-icon>
    </li>
    <li onclick="cancelEdit(${id})">
        <span>cancel</span>
        <ion-icon name="close-circle"></ion-icon>
    </li>
    <li onclick="CRUD.delete(${id})">
        <span>delete</span>
        <ion-icon name="trash"></ion-icon>
    </li>
`}

//UTILITIES
const compose = (fn1, fn2) => fn1(fn2);

function createElement(tag, attrs, html) {
    const element = document.createElement(tag);
    Object.assign(element, attrs);
    element.innerHTML = html;

    // Set the data-tooltip attribute if it exists in attrs object
    if (attrs.dataTooltip) {
        element.setAttribute("data-tooltip", attrs.dataTooltip);
    }

    return element;
}

function createDescriptionCell(description){
    return createElement("td", { className: "task__fulldescription"},`<p>${description}</p>`);
}

function createDropdownCell(id, getContent){
    const btnTask = createElement("button", { className: ["task-btn"] }, `
        <ion-icon name="ellipsis-vertical"></ion-icon>
    `);
    
    //view mode / edit mode
    const ulDropdown = createElement("ul"
        ,{className: ["task__dropdown", "dropdown"].join(" ")}
        ,getContent(id)
    );

    btnTask.addEventListener("click", (e) => {
        if (e.target === btnTask) {
        openDropdown(ulDropdown);
        }
    });

    const dropdownContainer = createElement("td", { className: ["dropdown__container"] }, "");
    dropdownContainer.appendChild(btnTask);
    dropdownContainer.appendChild(ulDropdown);

    return dropdownContainer
}

function createFilterBtn(type, filter) {
    const td = createElement("td", {className: "filter"}, `
    <button class="filter-btn">
        ${type} : ${filter}
    </button>
    `)

    filterCol.appendChild(td);
}

function generateUniqueID() {
  return (
    '_' +
    Math.random()
      .toString(36)
      .substr(2, 9)
  );
}

function validateInput(el){
    let p;
    if(el.nodeName === "LI"){
        p = el.children[1].innerText;
    } else {
        p = el.innerText;
    }
    return p;
}

function showDescription(selectedTask){
    // para cerrar la descripcion, agrega una "X" dentro.
    const dropdown = $('.task__dropdown', selectedTask);
    const description = $('.task__fulldescription', selectedTask);

    if(description.textContent){
        description.classList.add('active');  
    } else {
        alert("You didn't add a description");
    }

    closeDropdown(dropdown);
}

function cancelEdit(task) {
    task.classList.remove('edit');

    // Restore the original state
    task.innerHTML = viewMode;
    renderList(taskList);
}

function formatDate(date) {
    let inputDate = new Date(date);

    const day = inputDate.getDate().toString().padStart(2, '0');
    const month = (inputDate.getMonth() + 1).toString().padStart(2, '0');
    const year = inputDate.getFullYear().toString();
    const hour = inputDate.getHours() % 12 || 12;
    const minute = inputDate.getMinutes().toString().padStart(2, '0');
    const amPm = inputDate.getHours() >= 12 ? 'PM' : 'AM';

    return `${day}/${month}/${year} ${hour}:${minute}${amPm}`;
}

function unformatDate(str) {
    let [day, month, year] = str.slice(0, 10).split('/');
    return `${year}-${month}-${day}`;
}

function dateEstimation (date) {
    const now = new Date().getTime(); 
    const deadline = new Date(date).getTime(); 
    const diffDays = Math.floor(Math.abs(deadline - now) / 86400000); 

    if (deadline < now) {
        return "Finished"; // if the deadline has passed, return "Finished"
    } else if (diffDays === 0) {
        return "Today"; // if the difference is zero, return "Today"
    } else if (diffDays === 1) {
        return "Tomorrow"; // if the difference is one, return "Tomorrow"
    } else if (diffDays < 30) {
        return `${diffDays} days`; // if the difference is less than 30, return the number of days
    } else if (diffDays < 365) {
        const diffMonths = Math.floor(diffDays / 30); // get the difference in months
        return diffMonths === 1 ? "next month" : `${diffMonths} months`; // return the number of months or "next month"
    } else {
        const diffYears = Math.floor(diffDays / 365); // get the difference in years
        return diffYears === 1 ? "next year" : `${diffYears} years`; // return the number of years or "next year"
    }
}

function saveChanges(ul){
    localStorage.setItem('tasklist', JSON.stringify(ul));
    renderList(ul);
}

// CRUD

const CRUD = {
    add: (tasks) => (task) => [...tasks, task],
    edit: (selectedTask) => buildEditTemplate(selectedTask),
    delete: (selectedTask) => {
        taskList = taskList.filter((x) => x.id !== selectedTask.id);
        saveChanges(taskList);
    },
    filter: (type, input) => {
        const filters = {
        title: (task) => task.title.toLowerCase().includes(input),
        status: (task) => task.status.toLowerCase() === input.toLowerCase(),
        duration: (task) => task.duration.toLowerCase() === input.toLowerCase()
        };
        return taskList.filter(filters[type]);
    }
}

const FILTER_OPTIONS = {
    Title: filterByTitle,
    Status: filterByStatus,
    Duration: filterByDuration,
}

function handleFilter(event) {
    let previousDropdown = event.currentTarget.parentElement;
    closeDropdown(previousDropdown);

    const filter = validateInput(event.target);
    const filterFunction = FILTER_OPTIONS[filter];

    if (filterFunction) {
        filterFunction();
    } else {
        console.error("Invalid filter option");
    }
}

function filterByTitle(){
    const dropdown = $('.filters__filter-title', dropdownContainer);
    const filterForm = $('.dropdown-form', dropdown);
    openDropdown(dropdown);

    function handleLocalFilter(event){
        event.preventDefault();

        const input = document.getElementById('filter-title');
        const filterTitle = input.value;

        createFilterBtn('Title', filterTitle);
        const filteredArray = CRUD.filter('title', filterTitle);
        renderList(filteredArray)
        closeDropdown(dropdown);

        filterForm.reset();
        filterForm.removeEventListener('submit', handleLocalFilter);
    }

    filterForm.addEventListener('submit', handleLocalFilter);
}

function filterByStatus(){
    const dropdown = $('.filters__filter-status');
    const statusOptions = dropdown.querySelectorAll('li');
    openDropdown(dropdown);

    function handleLocalFilter(event){
        const filterStatus = event.target.innerText;
        console.log(filterStatus)
        createFilterBtn('Status', filterStatus);
        const filteredArray = CRUD.filter('status', filterStatus);
        renderList(filteredArray);
        closeDropdown(dropdown);
        statusOptions.forEach(status => {
            status.removeEventListener('click', handleLocalFilter);
        });
    }

    statusOptions.forEach(status => {
        status.addEventListener('click', handleLocalFilter);
    });
}

function filterByDuration(){
    const dropdown = $('.filters__filter-duration');
    const filterForm = $('.dropdown-form', dropdown);;
    openDropdown(dropdown);

    function handleLocalFilter(event){
        event.preventDefault();

        const input = document.getElementById('filter-date');
        const filterDate = input.value.trim();

        createFilterBtn('Duration', filterDate);
        const filteredArray = CRUD.filter('duration', filterDate);
        renderList(filteredArray)
        closeDropdown(dropdown);

        filterForm.reset();
        filterForm.removeEventListener('submit', handleLocalFilter);
    }

    filterForm.addEventListener('submit', handleLocalFilter);
}

function searchTask(){
    const input = $('input', searchContainer);
    const filterTask = input.value.toLocaleLowerCase();

    const filteredArray = CRUD.filter('title', filterTask);
    renderList(filteredArray)
}

function buildEditTemplate(task){
    // Storing Original State HTML
    viewMode = task.innerHTML;

    task.classList.add('edit');
    const editView = document.createDocumentFragment();
    const title = $('.task__name', task).textContent;
    const desc = $('p', task).textContent;
    const date = $('.task__duedate', task).textContent;

    editView.append( 
        createElement(
            "td", 
            { 
                className: "task__status", 
                dataTooltip: "change status", 
                onclick: () => editStatus(task.id) 
            }, 
            `<ion-icon name="ellipse-outline"></ion-icon>`
        ),

        createElement("td", {}, `
            <input 
                class="edit__title" 
                name="title"
                value="${title}" 
            />
        `),

        createElement("td", {}, `
            <input 
                class="edit__duedate" 
                type="date" 
                name="date"
                value="${unformatDate(date)}"
            />
        `),

        createDropdownCell(task.id, editDropdown),

        createElement(
            "td",
            { className: "edit__description"}, 
            `<textarea name="description">${desc}</textarea>`
        ),
    );

    task.innerHTML = '';
    task.append(editView);
}

function editStatus(task) {
  const obj = taskList.find((el) => el.id === task.id);
  const newStatus = ['to-do', 'In Progress', 'Completed'];
  let index = newStatus.indexOf(obj.status);

  if (index >= newStatus.length-1) {
    index = 0;
  } else {
    index++;
  }

  obj.status = newStatus[index];
  saveChanges(taskList);
}

function updateTask(task) {
    let fields = task.querySelectorAll('input, textarea');
    let prevTaskState = taskList.find(el => el.id === task.id);
    
    fields.forEach(({name, value}) => prevTaskState[name] = value);
    let dateObj = new Date(prevTaskState.date);
    dateObj.setDate(dateObj.getDate() + 1)
    prevTaskState.date = formatDate(dateObj); // dd/mm/YYYY
    prevTaskState.duration = dateEstimation(dateObj);
    saveChanges(taskList);
}

// MAIN CODE
function renderList(ul) {
    const fragment = document.createDocumentFragment();
    ul.map((task) => {
        const {id, title, status, date, duration, description, color } = task;

        const tr = createElement(
            "tr", 
            { 
                className: ["task"], 
                id, 
                style: `background-color: ${color}`
            }, 
            `
                <td class="task__status" data-tooltip="change status" onclick="editStatus(${id})">
                ${
                    status === "In Progress"
                    ? `<ion-icon name="ellipsis-horizontal-circle-outline"></ion-icon>`
                    : status === "Completed"
                    ? `<ion-icon name="checkmark-circle-outline"></ion-icon>`
                    : `<ion-icon name="ellipse-outline"></ion-icon>`
                }
                </td>
                <td class="task__name">${title}</td>
                <td class="task__duration">${duration}</td>
                <td class="task__duedate">${date}</td>
            `
        );

        tr.append(
            createDropdownCell(id, normalDropdown),
            createDescriptionCell(description)
        );

        fragment.append(tr);
    });

    taskUL.innerHTML = '';
    taskUL.appendChild(fragment);
    closeModal();
}

function createTask(onSubmit) {
  return function handleInput(e) {
    e.preventDefault();

    // Create an object from the inputs
    let task = Object.fromEntries(
        Array.from(inputs).map(({ name, value }) => [name, value])
    );

    // Set the color from the selected span or default to gray
    let selectedColor = $(".color-container .color.selected");
    task.color = selectedColor 
    ? selectedColor.dataset.value 
    : "#e6e6e6";

    // Format the date and add other properties
    const dateObj = task.date;

    task.date = formatDate(task.date);
    task.status = "to-do";
    task.id = generateUniqueID();
    task.duration = dateEstimation(dateObj);

    // Remove event listener and the selected class from all colors
    colors.forEach(color => {
        color.classList.remove('selected');
        color.removeEventListener('click', () => {
            colors.forEach(color => color.classList.remove('selected'))
            color.classList.add('selected');
         });
    });

    onSubmit(task);
  };
}

function updateList(newTask) {
    taskList = taskList.length
    ? CRUD.add(taskList)(newTask) 
    : [newTask];
    saveChanges(taskList);
}

const handleSubmit = compose(createTask, updateList);

// EVENT LISTENERS
//adds "selected" class to only one element (before submit)
colors.forEach(color => {
    color.addEventListener('click', () => {
        colors.forEach(color => color.classList.remove('selected'))
        color.classList.add('selected');
    });
});

addBtn.addEventListener('click', openModal);
taskForm.addEventListener('submit', handleSubmit);
searchContainer.addEventListener('input', searchTask);

filterBtn.addEventListener('click', () => {
  openDropdown(filterDropdown);
});

filterOptions.forEach((el) => {
    el.addEventListener('click', handleFilter);
});