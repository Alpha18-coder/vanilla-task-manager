const $ = (selector, el = document) => el.querySelector(selector);

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
let index = 0;
let hex;

const normalDropdown = function (id) { return `
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

const editDropdown = function (id) {
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

function toggleDropdown(dropdown) {
/* problem: 
1) if you add ` console.log(event.target.closest('.dropdown'))`
in `handleCloseDropdown`. you'll notice you are calling this event
listener twice!!! 

2) the filter features still rely on `closeDropdown()`

3) learn the importance of removing event listeners.
*/
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

//UTILITIES
const compose = (fn1, fn2) => fn1(fn2);

function createElement(tag, attrs, html) {
    const element = document.createElement(tag);
    Object.assign(element, attrs);
    element.innerHTML = html;

    if(attrs.onclick){
        element.setAttribute("onclick", attrs.onclick)
    }
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
        toggleDropdown(ulDropdown);
        }
    });

    const dropdownContainer = createElement("td", { className: ["dropdown__container"] }, "");
    dropdownContainer.appendChild(btnTask);
    dropdownContainer.appendChild(ulDropdown);

    return dropdownContainer
}

function createFilterBtn(type, filter) {
    const td = document.createElement('td');
    td.classList.add('filter');

    const button = document.createElement('button');
    button.classList.add('filter-btn');

    const p = document.createElement('p');
    p.textContent = `${type}: ${filter}`;

    button.appendChild(p);
    td.appendChild(button);
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

// CRUD

const CRUD = {
    add: (tasks) => (task) => [...tasks, task],
    edit: (selectedTask) => buildEditTemplate(selectedTask),
    delete: (selectedTask) => {
        taskList = taskList.filter((x) => x.id !== selectedTask.id);
        renderList(taskList);
    },
    filter: (type, filter) => {
        const filters = {
        title: (task) => task.title.toLowerCase().includes(filter),
        status: (task) => task.status.includes(filter.toLowerCase()),
        duration: (task) => task.duration.toLowerCase() === filter.toLowerCase()
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
        console.log("Invalid filter option");
    }
}

function filterByTitle(){
    const dropdown = dropdownContainer.querySelector('.filters__filter-title');
    const filterForm = dropdown.querySelector('.dropdown-form');
    toggleDropdown(dropdown);


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
    const dropdown = document.querySelector('.filters__filter-status');
    const statusOptions = dropdown.querySelectorAll('li');
    toggleDropdown(dropdown);

    function handleLocalFilter(event){
        const filterStatus = event.target.innerText;
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
    const dropdown = document.querySelector('.filters__filter-duration');
    const filterForm = dropdown.querySelector('.dropdown-form');
    toggleDropdown(dropdown);

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

const createTask = ({task, date}) => {
    const formattedDate = formatDate(date);

    return { 
        id: generateUniqueID(), 
        title: task, 
        dueDate: formattedDate, 
        duration: dateEstimation(date),
        status: 'to-do',
        color: hex ? hex : '#e6e6e6',
    }
}

function editStatus(task) {
  const taskStatus = task.querySelector('.task__status ion-icon');
  const icon = ['ellipse-outline', 'ellipsis-horizontal-circle-outline', 'checkmark-circle-outline'];

  if (index >= icon.length-1) {
    index = 0;
  } else {
    index++;
  }
  
  taskStatus.name = icon[index];
}

function buildEditTemplate(task){
    // Storing Original State
    viewMode = task.innerHTML;

    task.classList.add('edit');
    const editView = document.createDocumentFragment();
    const title = task.querySelector('.task__name').textContent;
    const desc = task.querySelector('p').textContent;

    editView.append( 
        createElement(
            "td", 
            { 
                className: "task__status", 
                dataTooltip: "change status", 
                onclick: onclick=`editStatus(${task.id})` 
            }, `
            <ion-icon name="ellipse-outline"></ion-icon>
        `),
        createElement("td", {}, `
            <input class="edit__title" value="${title}" name="title"/>
        `),
        createElement("td", {}, `
            <input class="edit__due-date" type="date" name="dueDate" />
        `),
        createDropdownCell(task.id, editDropdown),
        createElement("td",{ className: "edit__description"}, `
          <textarea name="description">${desc}</textarea>
        `),
    );

    task.innerHTML = '';
    task.append(editView);
}

function showDescription(selectedTask){
    const dropdown = selectedTask.querySelector('.task__dropdown');
    const description = selectedTask.querySelector('.task__fulldescription');

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

function searchTask(){
    const input = searchContainer.querySelector('input');
    const filterTask = input.value.toLocaleLowerCase();

    const filteredArray = CRUD.filter('title', filterTask);
    renderList(filteredArray)
}

function updateTask(task) {
    let fields = task.querySelectorAll('input, textarea');
    let previousTask = taskList.find(el => el.id === task.id);
    let hasData = Array.from(fields).every(el => el.value);

    if(hasData){
        fields.forEach(({name, value}) => previousTask[name] = value);
        let date = formatDate(previousTask.dueDate); // dd/mm/YYYY
        let deadline = previousTask.dueDate;
        previousTask.dueDate = date;
        previousTask.duration = dateEstimation(deadline);
        renderList(taskList);
    } else {
        alert("Please complete all the fields");
    }
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

const dateEstimation = (dueDate) => {
    const now = new Date();
    const deadline = new Date(dueDate);

    var diffYears = deadline.getFullYear() - now.getFullYear(); 
    var diffMonths = deadline.getMonth() - now.getMonth(); 
    var diffDays = deadline.getDate() - now.getDate(); 


    if(diffYears !== 0) {
        return diffYears > 1 ? `${diffYears} years`:`${diffYears} year`
    } 
    
    if(diffMonths !== 0 ) {
        return diffMonths > 1 ? `${diffMonths} months`:`next month`
    }

    if(diffDays > 1 ) {
        return `${diffDays} days`
    } else if(diffDays === 1) {
        return "Tomorrow"
    } else if (diffDays === 0) {
       return 'Today';
    } else {
        return "Finished"
    }
}

// MAIN CODE
function renderList(ul) {
    localStorage.setItem('tasklist', JSON.stringify(ul));
    const fragment = document.createDocumentFragment();

    ul.map((task) => {
        const {id, title, dueDate, duration, description, color } = task;

        const tr = createElement("tr", { className: ["task"], id, style: `background-color: ${color}`}, `
        <td class="task__status" data-tooltip="change status" onclick="editStatus(${id})">
            <ion-icon name="ellipse-outline"></ion-icon>
        </td>
        <td class="task__name">${title}</td>
        <td class="task__duration">${duration}</td>
        <td class="task__duedate">${dueDate}</td>
        `);

        tr.append(
            createDropdownCell(id, normalDropdown),
            createDescriptionCell(description)
        );

        fragment.append(tr);
    });

    taskUL.innerHTML = '';
    hex = '';
    taskUL.appendChild(fragment);
    closeModal();
}

function getUserInput(onSubmit){
    return function handleInput(e) {
        e.preventDefault();
        
        let userInput = {};
        inputs.forEach(({name, value}) => userInput[name] = value);
        const data = createTask(userInput);
        onSubmit(data);
    }
}

function updateList(newTask) {
    taskList = taskList.length
    ? CRUD.add(taskList)(newTask) 
    : [newTask];
    renderList(taskList);
}

const handleSubmit = compose(getUserInput, updateList);

// EVENT LISTENERS
colors.forEach(color => color.addEventListener('click', () => hex = color.dataset.value));

addBtn.addEventListener('click', openModal);
taskForm.addEventListener('submit', handleSubmit);
searchContainer.addEventListener('input', searchTask);

filterBtn.addEventListener('click', function() {
  toggleDropdown(filterDropdown);
});

filterOptions.forEach((el) => {
    el.addEventListener('click', handleFilter);
});