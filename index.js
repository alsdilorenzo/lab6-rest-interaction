'use strict'

const express = require('express')
const morgan = require('morgan')
const dao = require('./dao.js')

const app = express()
const port = 3000
app.use(morgan('tiny'))
app.use(express.json())

app.use(express.static('client'))
app.get('/', (req, res) => res.redirect('/index.html'))

//GET /tasks
app.get('/tasks', (req, res) => {
    dao.getTasks(req.query.filter)
        .then((tasks) => {
            res.json(tasks)
        })
        .catch((err) => {
            res.status(500).json({
                errors: [{'msg': err}],
            })
        })
})

//GET /tasks/:taskID
app.get('/tasks/:taskID', (req, res) => {
    let id = req.params.taskID
    dao.getTask(id)
        .then((task) => {
            if (task)
                res.json(task)
            else
                res.status(404).send()
        })
        .catch((err) => {
            res.status(500).json({
                errors: [{'Param': 'Server', 'msg': err}],
            })
        })
})

//POST /tasks
app.post('/tasks', (req, res) => {
    if (req.body) {
        dao.createTask(req.body)
            .then((id) => res.status(201).json({'id': id}))
            .catch((err) => res.status(500).json({errors: [{'param': 'Server', 'msg': err}],}))
    } else {
        res.status(400).end()
    }
})

//PUT /tasks/:taskID
app.put('/tasks/:taskID', (req, res) => {
    let id = req.body.id
    if (id) {
        let newTask = req.body
        dao.updateTask(req.params.taskID, newTask)
            .then((result) => res.status(200).end())
            .catch((err) => res.status(500).json({errors: [{'param': 'Server', 'msg': err}],}))
    } else {
        res.status(400).end()
    }
})

//DELETE /tasks/:taskID
app.delete('/tasks/:taskID', (req,res) => {
    dao.deleteTask(req.params.taskID)
        .then((result) => res.status(204).end())
        .catch((err) => res.status(500).json({
            errors: [{'param': 'Server', 'msg': err}],
        }))
})

app.listen(port, () => console.log(`Server ready: listening at http://localhost:${port}`))