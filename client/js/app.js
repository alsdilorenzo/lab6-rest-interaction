'use strict'

import Task from './task.js'
import Filter from './filter.js'
import * as Api from './api.js'

class App {
    constructor() {
        this.getTasks()

        $('#addModal').on('hidden.bs.modal', function (e) {
            //clear add modal fields
            const addForm = document.getElementById('addForm')
            addForm.reset()
            document.getElementById('form_title').innerText = 'Add a Task'
        })

        $('#addModal').on('show.bs.modal', function (e) {
            const addForm = document.getElementById("addForm")
            if (addForm.elements["form_id"].value && addForm.elements["form_id"].value !== "")
                document.getElementById("form_title").innerText = "Update Task"
        })
    }

    async getTasks() {
        //create the filter view and visualize tasks and projects
        this.filterView = new Filter()
        this.filterView.showTasks('filter-all')
        this.filterView.showProjects()

        //set up callbacks for filters
        this.filterView.setUpFilterCallbacks()

        //set up custom validation callback -> if I insert a time for the deadline, then the date is required
        const timeInput = document.getElementById("form_deadline_time")
        const dateInput = document.getElementById("form_deadline_date")
        timeInput.addEventListener("input", function (event) {
            if (timeInput.value !== "") {
                //check date
                if (dateInput.value === "") {
                    dateInput.setCustomValidity("Please, specify the date!")
                    dateInput.classList.add("invalid")
                }
            } else {
                dateInput.setCustomValidity("")
                dateInput.classList.remove("invalid")
            }
        })
        dateInput.addEventListener("input", function (event) {
            if (dateInput.value !== "")
                dateInput.setCustomValidity("")
        })

        //set up form callback
        document.getElementById('addForm').addEventListener('submit', event => {
            event.preventDefault()
            const addForm = document.getElementById("addForm")

            const description = addForm.elements["form_description"].value

            let project = addForm.elements["form_project"].value
            if (project === "")
                project = undefined

            const important = addForm.elements["form_important"].checked
            const privateTask = addForm.elements["form_private"].checked

            const deadlineDate = addForm.elements["form_deadline_date"].value
            const deadlineTime = addForm.elements["form_deadline_time"].value

            let deadline = undefined
            if (deadlineDate !== "" && deadlineTime !== "")
                deadline = moment(deadlineDate + " " + deadlineTime + "Z")
            else if (deadlineDate !== "")
                deadline = moment(deadlineDate)

            if (addForm.elements["form_id"].value && addForm.elements["form_id"].value !== "") {
                //there is a task id -> update
                const id = addForm.elements["form_id"].value
                const task = new Task(id, description, important, privateTask, deadline, project)
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
            } else {
                //the id is empty -> add
                const task = new Task(null, description, important, privateTask, deadline, project)

                Api.addTask(task)
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
            }
        })


    }
}

export default App