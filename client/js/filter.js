'use strict'

import * as Api from './api.js'

class Filter {
    constructor() {
    }

    /**
     * Function to create the <ul></ul> list of tasks
     * @param {*} filterType an optional filter
     */
    async showTasks(filterType) {
        const taskList = document.getElementById("taskList")
        const filterTitle = document.getElementById("filter-title")
        this.clearTasks()
        let tasks

        switch (filterType) {
            case "filter-all":
                tasks = await Api.getTasks()
                filterTitle.innerText = "All"
                break
            case "filter-important":
                tasks = await Api.getTasks('important')
                filterTitle.innerText = "Important"
                break
            case "filter-today":
                tasks = await Api.getTasks('today')
                filterTitle.innerText = "Today"
                break
            case "filter-week":
                tasks = await Api.getTasks('week')
                filterTitle.innerText = "Next 7 Days"
                break
            case "filter-private":
                tasks = await Api.getTasks('private')
                filterTitle.innerText = "Private"
                break
            case "filter-shared":
                tasks = await Api.getTasks('shared')
                filterTitle.innerText = "Shared"
                break
            default:
                tasks = await Api.getTasks(filterType)
                filterTitle.innerText = filterType
        }

        //visualize tasks
        for (const task of tasks) {
            const taskNode = this.createTaskNode(task)
            taskList.appendChild(taskNode)
        }

    }

    async showProjects() {
        const projectList = document.getElementById("projects")
        this.clearProjects()

        //get all tasks to visualize projects
        const tasks = await Api.getTasks()

        //build and visualize projects
        for (const project of [...new Set(tasks.map(task => task.project))]) {
            if (project) {
                const projectNode = this.createProjectNode(project)
                projectList.appendChild(projectNode)
            }
        }
    }

    /**
     * Function to create a single task enclosed in an <li> tag
     * @param {*} task the task object
     */
    createTaskNode(task) {
        const li = document.createElement('li')
        li.id = "task" + task.id
        li.className = 'list-group-item'
        const innerDiv = document.createElement('div')
        innerDiv.className = 'custom-control custom-checkbox'
        const externalDiv = document.createElement('div')
        externalDiv.className = 'd-flex w-100 justify-content-between'

        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.id = "check-t" + task.id
        if (task.important)
            checkbox.className = 'custom-control-input important'
        else
            checkbox.className = 'custom-control-input'
        if (task.completed)
            checkbox.checked = true
        else
            checkbox.checked = false

        //event lister to mark the task as completed (or not completed)
        checkbox.addEventListener('change', event => {
            if (event.target.checked)
                task.completed = true
            else
                task.completed = false

            Api.updateTask(task)
                .then(() => {
                    //remove errors, if any
                    document.getElementById('errorMsg').innerHTML = ''
                    //refresh the user interface
                    this.filterView.clearTasks()
                    this.filterView.showTasks('filter-all')

                    this.filterView.clearProjects()
                    this.filterView.showProjects()

                    //reset the form and close the modal
                    addForm.reset()
                    document.getElementById("closeModal").click()

                })
                .catch((errorObj) => {
                    if (errorObj) {
                        const err0 = errorObj.errors[0]
                        const errorString = err0.param + ': ' + err0.msg
                        // add an alert message in DOM
                        document.getElementById('errorMsg').innerHTML = `
                            <div class="alert alert-danger alert-dismissible fade show" role="danger">
                            <strong>Error:</strong> <span>${errorString}</span> 
                            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                <span aria-hidden="true">&times</span>
                            </button>
                            </div>`
                    }
                })

        })

        innerDiv.appendChild(checkbox)

        const descriptionText = document.createElement('label')
        descriptionText.className = 'description custom-control-label'
        descriptionText.innerText = task.description
        descriptionText.htmlFor = "check-t" + task.id
        innerDiv.appendChild(descriptionText)

        if (task.project) {
            const projectText = document.createElement('span')
            projectText.className = 'project badge badge-dark ml-4'
            projectText.innerText = task.project
            innerDiv.appendChild(projectText)
        }
        externalDiv.appendChild(innerDiv)

        if (task.deadline) {
            const dateText = document.createElement('small')
            dateText.className = 'date'
            //print deadline - using the format function of Moment js
            dateText.innerText = task.deadline.format("dddd, MMMM Do YYYY, h:mm:ss a")
            //mark expired tasks - using the isBefore function of Moment js
            const now = moment()
            if (task.deadline.isBefore(now)) {
                dateText.classList.add('bg-danger')
                dateText.classList.add('text-white')
            }
            externalDiv.appendChild(dateText)
        }

        const buttonsDiv = document.createElement('div')

        const imgEdit = document.createElement('img')
        imgEdit.width = 20
        imgEdit.height = 20
        imgEdit.classList = "img-button"
        imgEdit.src = 'https://image.flaticon.com/icons/svg/1159/1159633.svg'

        //callback to edit a task
        imgEdit.addEventListener('click', event => {
            const addForm = document.getElementById("addForm")
            addForm.elements["form_id"].value = task.id
            addForm.elements["form_description"].value = task.description
            addForm.elements["form_project"].value = task.project
            addForm.elements["form_important"].checked = !!task.important
            addForm.elements["form_private"].checked = !!task.privateTask

            if (task.deadline) {
                addForm.elements["form_deadline_date"].value = task.deadline.format("YYYY-MM-DD")
                addForm.elements["form_deadline_time"].value = task.deadline.format("hh:mm")
            }

            document.getElementById("addButton").click()
        })

        buttonsDiv.appendChild(imgEdit)

        const imgDelete = document.createElement('img')
        imgDelete.width = 20
        imgDelete.height = 20
        imgDelete.src = 'https://image.flaticon.com/icons/svg/833/833262.svg'
        imgDelete.classList = "img-button"

        //callback to delete a task
        imgDelete.addEventListener('click', event => {
            Api.deleteTask(task.id).then(() => {
                this.clearTasks()
                this.showTasks('filter-all')
                this.clearProjects()
                this.showProjects()
            }).catch((errorObj) => {
                if (errorObj) {
                    const err0 = errorObj.errors[0]
                    const errorString = err0.param + ': ' + err0.msg
                    // add an alert message in DOM
                    document.getElementById('errorMsg').innerHTML = `
                        <div class="alert alert-danger alert-dismissible fade show" role="danger">
                        <strong>Error:</strong> <span>${errorString}</span> 
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                            <span aria-hidden="true">&times</span>
                        </button>
                        </div>`
                }
            })
        })

        buttonsDiv.appendChild(imgDelete)

        externalDiv.appendChild(buttonsDiv)

        if (!task.privateTask) {
            innerDiv.insertAdjacentHTML("afterend", "<img src=\"https://image.flaticon.com/icons/svg/615/615075.svg\" width=\"20\" height=\"20\" alt=\"\">")
        }

        li.appendChild(externalDiv)
        return li
    }

    /**
     * Function to destroy the <ul></ul> list of tasks
     */
    clearTasks() {
        const taskList = document.getElementById("taskList")
        taskList.innerHTML = ''
    }


    /**
     * Function to create a single project
     * @param {*} project the project name to be created
     */
    createProjectNode(project) {
        const a = document.createElement('a')
        a.className = "list-group-item list-group-item-action"
        a.innerText = project
        a.setAttribute("data-id", project)
        a.addEventListener('click', () => {
            //remove active class from other filters
            if (document.querySelector("#left-sidebar a.active"))
                document.querySelector("#left-sidebar a.active").classList.remove("active")
            //make the project as the active filter
            a.classList.add("active")

            //call showTasks with the project as a filter
            this.showTasks(project)
        })
        return a
    }

    /**
     * Function to destroy the list of projects in the side menu
     */
    clearProjects() {
        const projectList = document.getElementById("projects")
        projectList.innerHTML = ''
    }

    /**
     * Function to set up callbacks associated with filters
     */
    setUpFilterCallbacks() {
        //set up filter references
        document.querySelectorAll("#left-sidebar a").forEach(link => {
            link.addEventListener("click", (event) => {
                const filterType = event.target.dataset.id
                if (document.querySelector("#left-sidebar a.active"))
                    document.querySelector("#left-sidebar a.active").classList.remove("active")
                event.target.classList.add("active")
                this.showTasks(filterType)
            })
        })
    }

}

export default Filter