const NoteService = {
    getAllNote(knex) {
      return knex.select('*').from('noteful_note')
    },
    insertNote(knex, newNote) {
      return knex
        .insert(newNote)
        .into('noteful_note')
        .returning('*')
        .then(rows => {
          return rows[0]
        })
    },
    getById(knex, id) {
      return knex.from('noteful_note').select('*').where('id', id).first()
    },
    deleteNote(knex, id) {
      return knex('noteful_note')
        .where({ id })
        .delete()
    },
    updateNote(knex, id, newNoteFields) {
      return knex('noteful_note')
        .where({ id })
        .update(newNoteFields)
    },
  }
  
  module.exports = NoteService