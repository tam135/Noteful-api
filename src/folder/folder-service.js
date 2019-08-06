const FolderService = {
    getAllFolder(knex) {
        return knex.select('*').from('noteful_folder')
    },
    insertFolder(knex, newFolder) {
        return knex
            .insert(newFolder)
            .into('noteful_folder')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex.from('noteful_folder').select('*').where('id', id).first()
    },
    deleteFolder(knex, id) {
        return knex('noteful_folder')
            .where({ id })
            .delete()
    },
    updateFolder(knex, id, newFolderFields) {
        return knex('noteful_folder')
            .where({ id })
            .update(newFolderFields)
    },
}

module.exports = FolderService