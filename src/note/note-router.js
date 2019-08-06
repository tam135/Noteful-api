const path = require('path');
const express = require('express');
const xss = require('xss');
const NoteService = require('./note-service');

const noteRouter = express.Router();
const jsonParser = express.json();

const serializeNote = note => ({
    id: note.id,
    name: xss(note.name),
    modified: note.modified,
    folder_id: note.folder_id,
    content: xss(note.content),
});

noteRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        NoteService.getAllNote(knexInstance)
            .then(note => {
                res.json(note.map(note => ({
                    id: note.id,
                    name: note.name,
                    modified: new date(note.modified),
                    folder_id: note.folder_id,
                    content: note.content,
                })))
            })
            .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        const { name, folder_id, content, modified } = req.body;
        const newNote = { name, folder_id, content };

        for (const [key, value] of Object.entries(newNote))
            if (value == null)
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` },
                });

        newNote.modified = modified;

        NoteService.insertNote(req.app.get('db'), newNote)
            .then(note => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${note.id}`))
                    .json(serializeNote(note));
            })
            .catch(next);
    });

noteRouter
    .route('/:note_id')
    .all((req, res, next) => {
        NoteService.getById(req.app.get('db'), req.params.note_id)
            .then(note => {
                if (!note) {
                    return res.status(404).json({
                        error: { message: `Note Not Found` },
                    });
                }
                res.note = note;
                next();
            })
            .catch(next);
    })
    .get((req, res, next) => {
        res.json(serializeNote(res.note));
    })
    .delete((req, res, next) => {
        NoteService.deleteNote(req.app.get('db'), req.params.note_id)
            .then(numRowsAffected => {
                res.status(204).end();
            })
            .catch(next);
    })
    .patch(jsonParser, (req, res, next) => {
        const { name, modified, folder_id, content } = req.body;
        const noteToUpdate = { name, modified, folder_id, content };

        const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length;
        if (numberOfValues === 0)
            return res.status(400).json({
                error: {
                    message: `Request body must content either 'name', 'folder_id' or 'content'`,
                },
            });

        NoteService.updateNote(req.app.get('db'), req.params.note_id, noteToUpdate)
            .then(numRowsAffected => {
                res.status(204).end();
            })
            .catch(next);
    });

module.exports = noteRouter;